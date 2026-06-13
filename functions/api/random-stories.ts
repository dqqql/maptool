import type {
  GeneratedEncounter,
  RandomStoryRequest,
  RandomStoryResponse,
  StoryLength,
} from '../../src/types';

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-v4-flash';
const MAX_BODY_BYTES = 64 * 1024;
const MAX_CONTEXT_LENGTH = 20_000;
const MAX_NOTE_LENGTH = 5_000;
const MAX_FIELD_LENGTH = 2_000;
const MAX_LIST_ITEMS = 12;
const DEFAULT_TIMEOUT_MS = 60_000;
const VALID_LENGTHS = new Set<StoryLength>(['short', 'medium', 'long']);

interface HandlerOptions {
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

interface DeepSeekResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

class RequestError extends Error {
  constructor(
    readonly status: 400 | 401 | 429 | 502 | 504,
    message: string,
  ) {
    super(message);
  }
}

function jsonResponse(body: object, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readBearerToken(request: Request): string {
  const authorization = request.headers.get('Authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1].trim() ?? '';
  if (token.length < 8 || token.length > 256) {
    throw new RequestError(401, '缺少或无效的 DeepSeek API Key');
  }
  return token;
}

async function readRequestBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new RequestError(400, '请求必须使用 application/json');
  }
  const declaredLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new RequestError(400, '请求内容过大');
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new RequestError(400, '请求内容过大');
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new RequestError(400, '请求不是合法 JSON');
  }
}

function requireString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new RequestError(400, `${field} 必须是字符串`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new RequestError(400, `${field} 超出长度限制`);
  }
  return normalized;
}

export function validateRandomStoryRequest(value: unknown): RandomStoryRequest {
  if (!isRecord(value)) throw new RequestError(400, '请求格式无效');

  const context = requireString(value.context, '地图上下文', MAX_CONTEXT_LENGTH);
  const note = requireString(value.note, '备注', MAX_NOTE_LENGTH);
  if (!context && !note) throw new RequestError(400, '地图选择或备注至少需要一项');

  const count = value.count;
  if (!Number.isInteger(count) || typeof count !== 'number' || count < 1 || count > 6) {
    throw new RequestError(400, '生成数量必须是 1 到 6 的整数');
  }

  if (!Array.isArray(value.types) || value.types.length < 1 || value.types.length > 6) {
    throw new RequestError(400, '故事类型必须包含 1 到 6 项');
  }
  const types = [...new Set(value.types.map((item) => requireString(item, '故事类型', 30)))];
  if (types.some((item) => !item) || types.length < 1) {
    throw new RequestError(400, '故事类型不能为空');
  }

  if (typeof value.length !== 'string' || !VALID_LENGTHS.has(value.length as StoryLength)) {
    throw new RequestError(400, '故事长度无效');
  }

  return {
    context,
    note,
    count,
    types,
    length: value.length as StoryLength,
  };
}

function lengthInstruction(length: StoryLength): string {
  if (length === 'short') return '短篇：每个字段简洁，列表各 1 到 2 项。';
  if (length === 'long') return '长篇：提供充分细节，列表各 3 到 5 项。';
  return '中篇：信息完整但紧凑，列表各 2 到 4 项。';
}

function buildMessages(input: RandomStoryRequest, retry: boolean) {
  const schema = {
    encounters: [{
      type: '必须是指定类型之一',
      title: '标题',
      hook: '触发事件',
      scene: '现场描述',
      developments: ['冲突或变化'],
      cluesOrInteractions: ['线索或互动'],
      resolutions: ['可能结局'],
    }],
  };
  const correction = retry
    ? '\n上一次输出未通过校验。请只返回满足数量和字段要求的 JSON 对象，不要添加解释或 Markdown。'
    : '';
  const typeDistribution = input.count === input.types.length
    ? `必须让 ${input.types.join('、')} 每种类型恰好出现一份。`
    : '请在允许类型中尽量均匀分配。';

  return [
    {
      role: 'system',
      content:
        '你是 TRPG 游戏主持人的遭遇设计助手。请根据地图上下文生成可直接使用的随机故事。'
        + '输出必须是严格 JSON，并完全符合给定结构。不要复述 API Key，也不要输出推理过程。',
    },
    {
      role: 'user',
      content:
        `请生成 ${input.count} 份随机故事。\n`
        + `允许类型：${input.types.join('、')}。\n`
        + `${typeDistribution}\n`
        + `${lengthInstruction(input.length)}\n`
        + `地图上下文：\n${input.context || '无'}\n`
        + `补充备注：\n${input.note || '无'}\n`
        + `JSON 结构示例：${JSON.stringify(schema)}`
        + correction,
    },
  ];
}

function requireOutputString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text || text.length > MAX_FIELD_LENGTH) return null;
  return text;
}

function requireOutputList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_LIST_ITEMS) return null;
  const items = value.map(requireOutputString);
  return items.every((item): item is string => item !== null) ? items : null;
}

function validateEncounter(value: unknown, allowedTypes: Set<string>): GeneratedEncounter | null {
  if (!isRecord(value)) return null;
  const type = requireOutputString(value.type);
  const title = requireOutputString(value.title);
  const hook = requireOutputString(value.hook);
  const scene = requireOutputString(value.scene);
  const developments = requireOutputList(value.developments);
  const cluesOrInteractions = requireOutputList(value.cluesOrInteractions);
  const resolutions = requireOutputList(value.resolutions);
  if (
    !type || !allowedTypes.has(type) || !title || !hook || !scene
    || !developments || !cluesOrInteractions || !resolutions
  ) {
    return null;
  }
  return { type, title, hook, scene, developments, cluesOrInteractions, resolutions };
}

export function parseGeneratedEncounters(
  content: string,
  expectedCount: number,
  allowedTypes: string[],
): GeneratedEncounter[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.encounters) || parsed.encounters.length !== expectedCount) {
    return null;
  }
  const typeSet = new Set(allowedTypes);
  const encounters = parsed.encounters.map((item) => validateEncounter(item, typeSet));
  if (!encounters.every((item): item is GeneratedEncounter => item !== null)) return null;
  if (
    expectedCount === allowedTypes.length
    && allowedTypes.some((type) => encounters.filter((encounter) => encounter.type === type).length !== 1)
  ) {
    return null;
  }
  return encounters;
}

function upstreamError(status: number): RequestError {
  if (status === 401 || status === 403) {
    return new RequestError(401, 'DeepSeek API Key 无效或无权调用');
  }
  if (status === 429) {
    return new RequestError(429, 'DeepSeek 请求过于频繁，请稍后重试');
  }
  return new RequestError(502, 'DeepSeek 服务暂时不可用');
}

async function callDeepSeek(
  fetcher: typeof fetch,
  apiKey: string,
  input: RandomStoryRequest,
  signal: AbortSignal,
  retry: boolean,
): Promise<string> {
  const response = await fetcher(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      thinking: { type: 'disabled' },
      response_format: { type: 'json_object' },
      messages: buildMessages(input, retry),
      max_tokens: input.length === 'long' ? 8192 : 4096,
      stream: false,
    }),
    signal,
  });

  if (!response.ok) throw upstreamError(response.status);

  let payload: DeepSeekResponse;
  try {
    payload = await response.json() as DeepSeekResponse;
  } catch {
    return '';
  }
  return payload.choices?.[0]?.message?.content ?? '';
}

export async function handleRandomStoriesRequest(
  request: Request,
  options: HandlerOptions = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const abortFromClient = () => controller.abort();
  request.signal.addEventListener('abort', abortFromClient, { once: true });

  try {
    const apiKey = readBearerToken(request);
    const input = validateRandomStoryRequest(await readRequestBody(request));
    const fetcher = options.fetcher ?? fetch;

    for (let attempt = 0; attempt < 2; attempt++) {
      const content = await callDeepSeek(fetcher, apiKey, input, controller.signal, attempt === 1);
      const encounters = parseGeneratedEncounters(content, input.count, input.types);
      if (encounters) {
        const result: RandomStoryResponse = { encounters };
        return jsonResponse(result);
      }
    }
    throw new RequestError(502, 'DeepSeek 返回的故事格式无效');
  } catch (error) {
    if (controller.signal.aborted) {
      return jsonResponse({ error: '生成随机故事超时' }, 504);
    }
    if (error instanceof RequestError) {
      return jsonResponse({ error: error.message }, error.status);
    }
    return jsonResponse({ error: 'DeepSeek 服务调用失败' }, 502);
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener('abort', abortFromClient);
  }
}

export const onRequestPost: PagesFunction = async ({ request }) => {
  return handleRandomStoriesRequest(request);
};

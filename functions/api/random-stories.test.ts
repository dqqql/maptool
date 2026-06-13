import { describe, expect, it, vi } from 'vitest';
import {
  handleRandomStoriesRequest,
  parseGeneratedEncounters,
  validateRandomStoryRequest,
} from './random-stories';

const requestBody = {
  context: '节点：旧矿井',
  note: '',
  count: 1,
  types: ['调查'],
  length: 'medium',
};

const encounter = {
  type: '调查',
  title: '井下回声',
  hook: '商队失踪。',
  scene: '井下传来敲击声。',
  developments: ['村民隐瞒旧矿道。'],
  cluesOrInteractions: ['货箱上有鳞片。'],
  resolutions: ['救出商队。'],
};

function makeRequest(body: unknown = requestBody, apiKey = 'test-api-key') {
  return new Request('https://example.com/api/random-stories', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function deepSeekResponse(content: string, status = 200) {
  return Response.json({
    choices: [{ message: { content } }],
  }, { status });
}

describe('random stories Pages Function', () => {
  it('validates request bounds', () => {
    expect(validateRandomStoryRequest(requestBody)).toEqual(requestBody);
    expect(() => validateRandomStoryRequest({ ...requestBody, count: 7 })).toThrow();
    expect(() => validateRandomStoryRequest({ ...requestBody, context: '', note: '' })).toThrow();
  });

  it('parses only the expected count and allowed types', () => {
    const content = JSON.stringify({ encounters: [encounter] });
    expect(parseGeneratedEncounters(content, 1, ['调查'])).toEqual([encounter]);
    expect(parseGeneratedEncounters(content, 2, ['调查'])).toBeNull();
    expect(parseGeneratedEncounters(content, 1, ['战斗'])).toBeNull();
  });

  it('requires one of each type when count matches the type count', () => {
    const duplicateTypes = JSON.stringify({
      encounters: [
        encounter,
        { ...encounter, title: '第二份', type: '调查' },
      ],
    });
    expect(parseGeneratedEncounters(duplicateTypes, 2, ['调查', '战斗'])).toBeNull();
  });

  it('forwards the API key and fixed DeepSeek options', async () => {
    const fetcher = vi.fn<typeof fetch>(async (_input, init) => {
      const payload = JSON.parse(String(init?.body));
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer test-api-key' });
      expect(payload).toMatchObject({
        model: 'deepseek-v4-flash',
        thinking: { type: 'disabled' },
        response_format: { type: 'json_object' },
        stream: false,
      });
      return deepSeekResponse(JSON.stringify({ encounters: [encounter] }));
    });

    const response = await handleRandomStoriesRequest(makeRequest(), { fetcher });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ encounters: [encounter] });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('retries once after invalid model JSON', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(deepSeekResponse('not-json'))
      .mockResolvedValueOnce(deepSeekResponse(JSON.stringify({ encounters: [encounter] })));

    const response = await handleRandomStoriesRequest(makeRequest(), { fetcher });
    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('returns 502 after two invalid model responses', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => deepSeekResponse(JSON.stringify({ encounters: [] })));
    const response = await handleRandomStoriesRequest(makeRequest(), { fetcher });
    expect(response.status).toBe(502);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it.each([
    [401, 401],
    [403, 401],
    [429, 429],
    [500, 502],
  ])('maps upstream %i to %i', async (upstreamStatus, expectedStatus) => {
    const fetcher = vi.fn<typeof fetch>(async () => deepSeekResponse('{}', upstreamStatus));
    const response = await handleRandomStoriesRequest(makeRequest(), { fetcher });
    expect(response.status).toBe(expectedStatus);
  });

  it('returns 400 for malformed input and 401 for a missing key', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const badInput = await handleRandomStoriesRequest(makeRequest({ ...requestBody, count: 0 }), { fetcher });
    expect(badInput.status).toBe(400);

    const missingKey = new Request('https://example.com/api/random-stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    const unauthorized = await handleRandomStoriesRequest(missingKey, { fetcher });
    expect(unauthorized.status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('returns 504 when the upstream call exceeds the timeout', async () => {
    const fetcher = vi.fn<typeof fetch>((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const response = await handleRandomStoriesRequest(makeRequest(), { fetcher, timeoutMs: 5 });
    expect(response.status).toBe(504);
  });
});

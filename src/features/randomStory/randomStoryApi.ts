import type { RandomStoryRequest, RandomStoryResponse } from '../../types';

export class RandomStoryApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function generateRandomStories(
  apiKey: string,
  request: RandomStoryRequest,
): Promise<RandomStoryResponse> {
  const response = await fetch('/api/random-stories', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new RandomStoryApiError(response.status || 502, '服务返回了无法读取的响应');
  }

  if (!response.ok) {
    const message = (
      typeof payload === 'object'
      && payload !== null
      && 'error' in payload
      && typeof payload.error === 'string'
    )
      ? payload.error
      : '随机故事生成失败';
    throw new RandomStoryApiError(response.status, message);
  }

  if (
    typeof payload !== 'object'
    || payload === null
    || !('encounters' in payload)
    || !Array.isArray(payload.encounters)
  ) {
    throw new RandomStoryApiError(502, '服务返回的故事格式无效');
  }

  return payload as RandomStoryResponse;
}

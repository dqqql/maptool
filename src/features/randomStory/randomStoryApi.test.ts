import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateRandomStories } from './randomStoryApi';

const request = {
  context: '节点：旧矿井',
  note: '',
  groups: 1,
  types: ['调查'],
  length: 'medium' as const,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('random story API client', () => {
  it('explains how to recover when local Vite returns HTML', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<!doctype html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })));

    await expect(generateRandomStories('test-api-key', request)).rejects.toThrow(
      '本地开发请停止旧进程并重新运行 npm run dev',
    );
  });
});

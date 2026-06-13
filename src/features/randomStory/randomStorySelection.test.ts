import { describe, expect, it } from 'vitest';
import { cleanModelText, encounterToMarkdown } from './randomStorySelection';

describe('random story Markdown conversion', () => {
  it('removes control characters and abnormal whitespace', () => {
    expect(cleanModelText('  黑水\u0000井\n\t回声\u200b  ')).toBe('黑水 井 回声');
  });

  it('uses only the supported Markdown structures', () => {
    const markdown = encounterToMarkdown({
      type: '调查',
      title: '黑水井下的回声',
      hook: '商队失踪。',
      scene: '井下传来敲击声。',
      developments: ['村民拒绝承认。'],
      cluesOrInteractions: ['货箱上有鳞片。'],
      resolutions: ['救出商队。'],
    });
    expect(markdown).toContain('## 黑水井下的回声');
    expect(markdown).toContain('> 类型：调查');
    expect(markdown).toContain('**冲突与变化**');
    expect(markdown).toContain('- 村民拒绝承认。');
  });
});

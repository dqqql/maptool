import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_STORY_SYSTEM_PROMPT,
  type Edge,
  type GeneratedEncounter,
  type MapNode,
  type RandomStoryRequest,
  type StoryLength,
  type TextBox,
} from '../../types';
import { deleteApiKey, getApiKey, saveApiKey } from './apiKeyStorage';
import { generateRandomStories } from './randomStoryApi';
import { buildRandomStoryContext, buildSelectionGroups } from './randomStorySelection';
import { useRandomStoryStore } from './randomStoryStore';
import './RandomStoryDialog.css';

const STORY_TYPES = ['调查', '战斗', '社交', '奇遇', '欢乐'];

interface Props {
  open: boolean;
  nodes: MapNode[];
  edges: Edge[];
  texts: TextBox[];
  onClose: () => void;
  onGenerated: (encounters: GeneratedEncounter[]) => void;
}

export function RandomStoryDialog({ open, nodes, edges, texts, onClose, onGenerated }: Props) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);
  const [editingKey, setEditingKey] = useState(false);
  const [note, setNote] = useState('');
  const [groupCount, setGroupCount] = useState(1);
  const [types, setTypes] = useState<string[]>(['调查', '战斗', '社交']);
  const [customType, setCustomType] = useState('');
  const [length, setLength] = useState<StoryLength>('medium');
  const [overridePrompt, setOverridePrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [promptConfirmOpen, setPromptConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selection = useRandomStoryStore();
  const groups = useMemo(() => buildSelectionGroups(nodes, edges, texts), [nodes, edges, texts]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setKeyLoading(true);
    setError('');
    getApiKey()
      .then((stored) => {
        if (!alive) return;
        setApiKey(stored);
        setEditingKey(!stored);
      })
      .catch(() => {
        if (alive) setError('无法读取本地 API Key 设置');
      })
      .finally(() => {
        if (alive) setKeyLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) handleClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!open) return null;

  function handleClose() {
    selection.clearSelection();
    setError('');
    onClose();
  }

  async function handleSaveKey() {
    const value = apiKeyInput.trim();
    if (value.length < 8) {
      setError('请输入有效的 DeepSeek API Key');
      return;
    }
    try {
      await saveApiKey(value);
      setApiKey(value);
      setApiKeyInput('');
      setEditingKey(false);
      setError('');
    } catch {
      setError('API Key 保存失败');
    }
  }

  async function handleDeleteKey() {
    try {
      await deleteApiKey();
      setApiKey(null);
      setApiKeyInput('');
      setEditingKey(true);
      setError('');
    } catch {
      setError('API Key 删除失败');
    }
  }

  function toggleType(type: string) {
    setTypes((current) => (
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    ));
  }

  function handleOverrideToggle() {
    if (overridePrompt) {
      setOverridePrompt(false);
      return;
    }
    // 开启前先弹窗告知当前内置提示词与替换/删除规则
    setPromptConfirmOpen(true);
  }

  function confirmEnableOverride() {
    setOverridePrompt(true);
    setCustomPrompt((current) => current || DEFAULT_STORY_SYSTEM_PROMPT);
    setPromptConfirmOpen(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!apiKey) {
      setError('请先保存 DeepSeek API Key');
      return;
    }
    if (editingKey) {
      setError('请先保存或取消本次 API Key 更换');
      return;
    }

    const context = buildRandomStoryContext(nodes, edges, texts, selection);
    const requestedTypes = [...types];
    const custom = customType.trim();
    if (custom && !requestedTypes.includes(custom)) requestedTypes.push(custom);
    if (!context && !note.trim()) {
      setError('请至少选择一项地图内容或填写备注');
      return;
    }
    if (requestedTypes.length === 0) {
      setError('请至少选择或填写一种故事类型');
      return;
    }

    const request: RandomStoryRequest = {
      context,
      note: note.trim(),
      groups: groupCount,
      types: requestedTypes,
      length,
      ...(overridePrompt ? { systemPrompt: customPrompt } : {}),
    };

    setSubmitting(true);
    setError('');
    try {
      const result = await generateRandomStories(apiKey, request);
      onGenerated(result.encounters);
      handleClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '随机故事生成失败');
    } finally {
      setSubmitting(false);
    }
  }

  function renderOptions(
    title: string,
    kind: 'node' | 'edge' | 'text',
    options: Array<{ id: string; label: string }>,
    selectedIds: string[],
  ) {
    return (
      <fieldset className="random-story__selection-group">
        <legend>{title}</legend>
        {options.length === 0 ? (
          <div className="random-story__empty">暂无内容</div>
        ) : (
          options.map((option) => (
            <label key={option.id} className="random-story__check-row">
              <input
                type="checkbox"
                checked={selectedIds.includes(option.id)}
                onChange={() => selection.toggleSelection(kind, option.id)}
              />
              <span>{option.label}</span>
            </label>
          ))
        )}
      </fieldset>
    );
  }

  return (
    <div className="random-story__backdrop" role="presentation">
      <section
        className="random-story__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="random-story-title"
      >
        <header className="random-story__header">
          <h2 id="random-story-title">随机故事</h2>
          <button
            type="button"
            className="random-story__close"
            onClick={handleClose}
            disabled={submitting}
            aria-label="关闭"
          >
            ✕
          </button>
        </header>

        {keyLoading ? (
          <div className="random-story__loading">
            <span className="random-story__spinner random-story__spinner--ink" aria-hidden="true" />
            正在读取本地设置……
          </div>
        ) : (
          <>
            <div className="random-story__security" role="note">
              <span className="random-story__security-icon" aria-hidden="true">🔒</span>
              <span>请勿在不受信任的设备上保存 API Key</span>
            </div>

            {editingKey || !apiKey ? (
              <div className="random-story__key-form">
                <label htmlFor="random-story-api-key">DeepSeek API Key</label>
                <input
                  id="random-story-api-key"
                  type="password"
                  autoComplete="off"
                  value={apiKeyInput}
                  onChange={(event) => setApiKeyInput(event.target.value)}
                  placeholder="输入 DeepSeek API Key"
                />
                <button type="button" className="random-story__btn-primary" onClick={handleSaveKey}>保存密钥</button>
                {apiKey && (
                  <button type="button" onClick={() => setEditingKey(false)}>取消更换</button>
                )}
              </div>
            ) : (
              <div className="random-story__key-status">
                <span>已读取保存的 API Key</span>
                <button type="button" onClick={() => setEditingKey(true)}>更换</button>
                <button type="button" onClick={handleDeleteKey}>删除</button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="random-story__selections">
                {renderOptions('节点', 'node', groups.nodes, selection.selectedNodeIds)}
                {renderOptions('连线', 'edge', groups.edges, selection.selectedEdgeIds)}
                {renderOptions('文本', 'text', groups.texts, selection.selectedTextIds)}
              </div>

              <label className="random-story__field">
                <span>补充备注（最多 5000 字）</span>
                <textarea
                  maxLength={5000}
                  rows={5}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="也可以只填写备注，不选择地图内容"
                />
              </label>

              <details className="random-story__advanced">
                <summary>高级选项</summary>
                <label className="random-story__field">
                  <span>生成数量</span>
                  <select value={groupCount} onChange={(event) => setGroupCount(Number(event.target.value))}>
                    {[1, 2, 3].map((value) => (
                      <option key={value} value={value}>{value} 组</option>
                    ))}
                  </select>
                  <small className="random-story__hint">每组包含所选类型各一份</small>
                </label>

                <fieldset className="random-story__types">
                  <legend>故事类型</legend>
                  {STORY_TYPES.map((type) => (
                    <label key={type}>
                      <input
                        type="checkbox"
                        checked={types.includes(type)}
                        onChange={() => toggleType(type)}
                      />
                      {type}
                    </label>
                  ))}
                </fieldset>

                <label className="random-story__field">
                  <span>自定义类型</span>
                  <input
                    type="text"
                    maxLength={30}
                    value={customType}
                    onChange={(event) => setCustomType(event.target.value)}
                    placeholder="例如：悬疑、政治阴谋"
                  />
                </label>

                <div className="random-story__field">
                  <label className="random-story__switch">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={overridePrompt}
                      onChange={handleOverrideToggle}
                    />
                    <span className="random-story__switch-track" aria-hidden="true" />
                    <span>替换内置提示词</span>
                  </label>
                  {overridePrompt && (
                    <>
                      <textarea
                        className="random-story__prompt-input"
                        maxLength={8000}
                        rows={6}
                        value={customPrompt}
                        onChange={(event) => setCustomPrompt(event.target.value)}
                        placeholder="留空将删除系统提示词（不发送任何系统提示词）"
                      />
                      <small className="random-story__hint">
                        此内容将替换内置系统提示词；留空相当于删除提示词。
                      </small>
                    </>
                  )}
                </div>

                <label className="random-story__field">
                  <span>篇幅</span>
                  <select value={length} onChange={(event) => setLength(event.target.value as StoryLength)}>
                    <option value="short">短</option>
                    <option value="medium">中</option>
                    <option value="long">长</option>
                  </select>
                </label>
              </details>

              {error && <div className="random-story__error" role="alert">{error}</div>}

              <div className="random-story__actions">
                <button
                  type="submit"
                  className="random-story__submit"
                  disabled={!apiKey || editingKey || submitting}
                >
                  {submitting ? (
                    <>
                      <span className="random-story__spinner" aria-hidden="true" />
                      正在生成……
                    </>
                  ) : (
                    '开始生成'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </section>

      {promptConfirmOpen && (
        <div className="random-story__confirm-backdrop" role="presentation">
          <div
            className="random-story__confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="random-story-confirm-title"
          >
            <h3 id="random-story-confirm-title">替换内置提示词</h3>
            <p>当前内置的系统提示词如下：</p>
            <pre className="random-story__prompt-preview">{DEFAULT_STORY_SYSTEM_PROMPT}</pre>
            <p>
              开启后，下方输入框的内容将<strong>替换</strong>这段提示词一并发送；
              若<strong>留空</strong>，则相当于<strong>删除</strong>系统提示词。
            </p>
            <div className="random-story__confirm-actions">
              <button type="button" onClick={() => setPromptConfirmOpen(false)}>取消</button>
              <button
                type="button"
                className="random-story__btn-primary"
                onClick={confirmEnableOverride}
              >
                确定开启
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

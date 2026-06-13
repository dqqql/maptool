import { useEffect, useMemo, useState } from 'react';
import type {
  Edge,
  GeneratedEncounter,
  MapNode,
  RandomStoryRequest,
  StoryLength,
  TextBox,
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
  const [count, setCount] = useState(3);
  const [types, setTypes] = useState<string[]>(['调查', '战斗', '社交']);
  const [customType, setCustomType] = useState('');
  const [length, setLength] = useState<StoryLength>('medium');
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
      count,
      types: requestedTypes,
      length,
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
                  <select value={count} onChange={(event) => setCount(Number(event.target.value))}>
                    {[1, 2, 3, 4, 5, 6].map((value) => (
                      <option key={value} value={value}>{value} 份</option>
                    ))}
                  </select>
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
    </div>
  );
}

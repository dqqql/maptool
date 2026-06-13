import { useState } from 'react';
import { useWorldStore } from '../store/worldStore';
import type { CustomProp, CustomPropType } from '../types';
import { CustomPropRow } from './CustomPropRow';
import './PropertyPanel.css';

const TYPE_OPTIONS: { value: CustomPropType; label: string }[] = [
  { value: 'text', label: '文本框' },
  { value: 'textarea', label: '多行文本' },
  { value: 'checkbox', label: '复选框' },
  { value: 'select', label: '下拉框' },
  { value: 'number', label: '数字' },
  { value: 'rating', label: '星级' },
  { value: 'progress', label: '进度格' },
];

const TEXT_BG = [
  { label: '羊皮纸', value: 'rgba(255,250,235,0.85)' },
  { label: '深纸', value: '#e7d7b0' },
  { label: '便签黄', value: '#f1e6cd' },
  { label: '朱砂', value: 'rgba(140,58,43,0.14)' },
  { label: '透明', value: 'transparent' },
];

const TEXT_COLORS = [
  { label: '墨色', value: '#241a10' },
  { label: '朱砂', value: '#8c3a2b' },
  { label: '松绿', value: '#355b48' },
  { label: '靛青', value: '#315c78' },
  { label: '黛紫', value: '#6b426f' },
];

function defaultValue(type: CustomPropType, options: string[]): CustomProp['value'] {
  switch (type) {
    case 'checkbox': return false;
    case 'number': case 'rating': case 'progress': return 0;
    case 'select': return options[0] ?? '';
    default: return '';
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <aside className="rail rail--right grain-overlay">
      <div className="rail__head">属性</div>
      <div className="rail__sub">批注与编录</div>
      {children}
    </aside>
  );
}

export function PropertyPanel() {
  const st = useWorldStore();
  const {
    nodes, edges, texts, selectedNodeId, selectedEdgeId, selectedTextId,
    updateNode, removeNode, duplicateNode, bringToFront, sendToBack, bringForward, sendBackward,
    addCustomProp, updateCustomProp, removeCustomProp,
    updateEdge, removeEdge, updateText, removeText,
    selectNode, selectEdge, selectText,
  } = st;

  const node = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const edge = edges.find((e) => e.id === selectedEdgeId) ?? null;
  const text = texts.find((t) => t.id === selectedTextId) ?? null;

  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<CustomPropType>('text');
  const [newOptions, setNewOptions] = useState('');

  function resetAddForm() {
    setAdding(false);
    setNewLabel('');
    setNewType('text');
    setNewOptions('');
  }
  function handleAddProp() {
    if (!node) return;
    const options = newOptions.split(/[,，]/).map((x) => x.trim()).filter(Boolean);
    const prop: CustomProp = {
      id: crypto.randomUUID(),
      label: newLabel.trim() || '新属性',
      type: newType,
      value: defaultValue(newType, options),
      options: newType === 'select' ? (options.length ? options : ['选项一']) : undefined,
    };
    addCustomProp(node.id, prop);
    resetAddForm();
  }

  // —— 连线编辑 ——
  if (edge) {
    const from = nodes.find((n) => n.id === edge.fromNodeId);
    const to = nodes.find((n) => n.id === edge.toNodeId);
    return (
      <Shell>
        <div className="prop-actions">
          <span className="prop-kind">连线</span>
          <button className="prop-act prop-act--danger" onClick={() => removeEdge(edge.id)} title="删除连线">✕</button>
        </div>
        <div className="prop-body">
          <div className="prop-relation">
            <span>{from?.name || '？'}</span>
            <span className="prop-relation__arrow">⟿</span>
            <span>{to?.name || '？'}</span>
          </div>
          <div className="prop-field">
            <label className="prop-label">名称</label>
            <input className="ink-field" value={edge.name} placeholder="如：商道、宿怨……"
              onChange={(e) => updateEdge(edge.id, { name: e.target.value })} />
          </div>
          <div className="prop-field">
            <label className="prop-label">描述</label>
            <textarea className="ink-field prop-textarea" rows={4} value={edge.description}
              placeholder="记下这段关系的来龙去脉……"
              onChange={(e) => updateEdge(edge.id, { description: e.target.value })} />
          </div>
        </div>
      </Shell>
    );
  }

  // —— 文本框编辑 ——
  if (text) {
    return (
      <Shell>
        <div className="prop-actions">
          <span className="prop-kind">文本备注</span>
          <button className="prop-act prop-act--danger" onClick={() => removeText(text.id)} title="删除文本框">✕</button>
        </div>
        <div className="prop-body">
          <div className="prop-field">
            <label className="prop-label">内容</label>
            <textarea className="ink-field prop-textarea" rows={5} value={text.content}
              placeholder="在画布上双击文本框也可直接编辑……"
              onChange={(e) => updateText(text.id, { content: e.target.value })} />
          </div>
          <div className="prop-field">
            <label className="prop-label">文字颜色</label>
            <div className="prop-color-row">
              <div className="prop-swatches">
                {TEXT_COLORS.map((color) => (
                  <button key={color.value} title={color.label} aria-label={color.label}
                    className={`prop-swatch prop-swatch--text ${text.color === color.value ? 'is-on' : ''}`}
                    style={{ background: color.value }}
                    onClick={() => updateText(text.id, { color: color.value })} />
                ))}
              </div>
              <label className="prop-color-custom" title="自定义颜色">
                <input type="color" value={text.color}
                  aria-label="自定义文字颜色"
                  onChange={(e) => updateText(text.id, { color: e.target.value })} />
              </label>
            </div>
          </div>
          <div className="prop-field">
            <label className="prop-label">背景</label>
            <div className="prop-swatches">
              {TEXT_BG.map((bg) => (
                <button key={bg.value} title={bg.label}
                  className={`prop-swatch ${text.background === bg.value ? 'is-on' : ''} ${bg.value === 'transparent' ? 'is-transparent' : ''}`}
                  style={{ background: bg.value === 'transparent' ? undefined : bg.value }}
                  onClick={() => updateText(text.id, { background: bg.value })} />
              ))}
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // —— 节点编辑 ——
  if (node) {
    return (
      <Shell>
        <div className="prop-actions">
          <div className="prop-actions__group" title="层级">
            <button className="prop-act prop-act--layer prop-act--top" onClick={() => bringToFront(node.id)} title="置顶">▲</button>
            <button className="prop-act prop-act--layer" onClick={() => bringForward(node.id)} title="上移一层">▲</button>
            <button className="prop-act prop-act--layer" onClick={() => sendBackward(node.id)} title="下移一层">▼</button>
            <button className="prop-act prop-act--layer prop-act--bottom" onClick={() => sendToBack(node.id)} title="置底">▼</button>
          </div>
          <div className="prop-actions__group">
            <button className="prop-act" onClick={() => duplicateNode(node.id)} title="复制节点">❐</button>
            <button className="prop-act prop-act--danger" onClick={() => removeNode(node.id)} title="删除节点">✕</button>
          </div>
        </div>

        <div className="prop-body">
          <div className="prop-field">
            <label className="prop-label">名称</label>
            <input className="ink-field" value={node.name} maxLength={60} placeholder="为此处起名……"
              onChange={(e) => updateNode(node.id, { name: e.target.value })} />
            <button
              type="button"
              className={`prop-toggle ${node.hideName ? 'is-on' : ''}`}
              role="switch"
              aria-checked={Boolean(node.hideName)}
              onClick={() => updateNode(node.id, { hideName: !node.hideName })}
            >
              <span className="prop-toggle__text">
                <span className="prop-toggle__title">隐藏地图名称</span>
                <span className="prop-toggle__hint">仅隐藏节点下方的名称标签</span>
              </span>
              <span className="prop-toggle__track" aria-hidden="true">
                <span className="prop-toggle__thumb" />
              </span>
            </button>
          </div>
          <div className="prop-field">
            <label className="prop-label">描述</label>
            <textarea className="ink-field prop-textarea" value={node.description} rows={4}
              placeholder="记下它的来历、传说与现状……"
              onChange={(e) => updateNode(node.id, { description: e.target.value })} />
          </div>

          <div className="prop-custom">
            <div className="prop-custom__head">
              <span className="prop-label">自定义属性</span>
              <span className="prop-custom__count">{node.customProps.length}</span>
            </div>
            {node.customProps.length === 0 && !adding && (
              <p className="prop-custom__empty">尚无自定义属性。按需添加你关心的字段。</p>
            )}
            {node.customProps.map((p) => (
              <CustomPropRow key={p.id} prop={p}
                onChange={(patch) => updateCustomProp(node.id, p.id, patch)}
                onRemove={() => removeCustomProp(node.id, p.id)} />
            ))}
            {adding ? (
              <div className="prop-add">
                <label className="prop-label">属性名</label>
                <input className="ink-field" autoFocus value={newLabel} maxLength={20}
                  placeholder="如：阵营、人口、危险度……"
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddProp()} />
                <label className="prop-label">控件类型</label>
                <select className="ink-field" value={newType} onChange={(e) => setNewType(e.target.value as CustomPropType)}>
                  {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {newType === 'select' && (
                  <>
                    <label className="prop-label">选项（逗号分隔）</label>
                    <input className="ink-field" value={newOptions} placeholder="联盟, 中立, 敌对"
                      onChange={(e) => setNewOptions(e.target.value)} />
                  </>
                )}
                <div className="prop-add__actions">
                  <button className="ink-btn ink-btn--ghost ink-btn--sm" onClick={resetAddForm}>取消</button>
                  <button className="ink-btn ink-btn--seal ink-btn--sm" onClick={handleAddProp}>添加</button>
                </div>
              </div>
            ) : (
              <button className="prop-add-btn" onClick={() => setAdding(true)}>＋ 添加自定义属性</button>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  // —— 空：列出全部条目，点选即可编辑 ——
  const isAllEmpty = nodes.length === 0 && edges.length === 0 && texts.length === 0;
  if (isAllEmpty) {
    return (
      <Shell>
        <div className="rail__pending">
          <b>空空如也</b>
          从左侧拖入素材，或用上方工具
          <br />
          添加连线与文本备注。
        </div>
      </Shell>
    );
  }
  return (
    <Shell>
      <div className="prop-list">
        <div className="prop-list__group">
          <div className="prop-list__title">节点 <span>{nodes.length}</span></div>
          {nodes.length === 0 ? (
            <p className="prop-list__empty">尚无节点</p>
          ) : (
            nodes.map((n) => (
              <button key={n.id} className="prop-list__item" onClick={() => selectNode(n.id)}>
                <span className="prop-list__name">{n.name || '未命名节点'}</span>
              </button>
            ))
          )}
        </div>

        <div className="prop-list__group">
          <div className="prop-list__title">连线 <span>{edges.length}</span></div>
          {edges.length === 0 ? (
            <p className="prop-list__empty">尚无连线</p>
          ) : (
            edges.map((e) => {
              const from = nodes.find((n) => n.id === e.fromNodeId);
              const to = nodes.find((n) => n.id === e.toNodeId);
              return (
                <button key={e.id} className="prop-list__item" onClick={() => selectEdge(e.id)}>
                  <span className="prop-list__name">
                    {e.name || `${from?.name || '？'} ⟿ ${to?.name || '？'}`}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="prop-list__group">
          <div className="prop-list__title">文本 <span>{texts.length}</span></div>
          {texts.length === 0 ? (
            <p className="prop-list__empty">尚无文本备注</p>
          ) : (
            texts.map((t) => (
              <button key={t.id} className="prop-list__item" onClick={() => selectText(t.id)}>
                <span className="prop-list__name">{t.content.trim() || '（空白备注）'}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </Shell>
  );
}

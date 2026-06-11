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

function defaultValue(type: CustomPropType, options: string[]): CustomProp['value'] {
  switch (type) {
    case 'checkbox':
      return false;
    case 'number':
    case 'rating':
    case 'progress':
      return 0;
    case 'select':
      return options[0] ?? '';
    default:
      return '';
  }
}

export function PropertyPanel() {
  const nodes = useWorldStore((s) => s.nodes);
  const selectedNodeId = useWorldStore((s) => s.selectedNodeId);
  const updateNode = useWorldStore((s) => s.updateNode);
  const removeNode = useWorldStore((s) => s.removeNode);
  const duplicateNode = useWorldStore((s) => s.duplicateNode);
  const bringToFront = useWorldStore((s) => s.bringToFront);
  const sendToBack = useWorldStore((s) => s.sendToBack);
  const bringForward = useWorldStore((s) => s.bringForward);
  const sendBackward = useWorldStore((s) => s.sendBackward);
  const addCustomProp = useWorldStore((s) => s.addCustomProp);
  const updateCustomProp = useWorldStore((s) => s.updateCustomProp);
  const removeCustomProp = useWorldStore((s) => s.removeCustomProp);

  const node = nodes.find((n) => n.id === selectedNodeId) ?? null;

  // 新增属性表单
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
    const options = newOptions
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
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

  if (!node) {
    return (
      <aside className="rail rail--right grain-overlay">
        <div className="rail__head">属性</div>
        <div className="rail__sub">Annotations</div>
        <div className="rail__pending">
          <b>尚无选中</b>
          在画布上点选一个节点，
          <br />
          即可在此为它命名、描述
          <br />
          并添加自定义属性。
        </div>
      </aside>
    );
  }

  return (
    <aside className="rail rail--right grain-overlay">
      <div className="rail__head">属性</div>
      <div className="rail__sub">Annotations</div>

      {/* 节点操作 */}
      <div className="prop-actions">
        <div className="prop-actions__group" title="层级">
          <button className="prop-act" onClick={() => bringToFront(node.id)} title="置顶">⤒</button>
          <button className="prop-act" onClick={() => bringForward(node.id)} title="上移一层">↑</button>
          <button className="prop-act" onClick={() => sendBackward(node.id)} title="下移一层">↓</button>
          <button className="prop-act" onClick={() => sendToBack(node.id)} title="置底">⤓</button>
        </div>
        <div className="prop-actions__group">
          <button className="prop-act" onClick={() => duplicateNode(node.id)} title="复制节点">⎘</button>
          <button className="prop-act prop-act--danger" onClick={() => removeNode(node.id)} title="删除节点">✕</button>
        </div>
      </div>

      <div className="prop-body">
        {/* 名称 */}
        <div className="prop-field">
          <label className="prop-label">名称</label>
          <input
            className="ink-field"
            value={node.name}
            maxLength={60}
            placeholder="为此处起名……"
            onChange={(e) => updateNode(node.id, { name: e.target.value })}
          />
        </div>

        {/* 描述 */}
        <div className="prop-field">
          <label className="prop-label">描述</label>
          <textarea
            className="ink-field prop-textarea"
            value={node.description}
            rows={4}
            placeholder="记下它的来历、传说与现状……"
            onChange={(e) => updateNode(node.id, { description: e.target.value })}
          />
        </div>

        {/* 自定义属性 */}
        <div className="prop-custom">
          <div className="prop-custom__head">
            <span className="prop-label">自定义属性</span>
            <span className="prop-custom__count">{node.customProps.length}</span>
          </div>

          {node.customProps.length === 0 && !adding && (
            <p className="prop-custom__empty">尚无自定义属性。按需添加你关心的字段。</p>
          )}

          {node.customProps.map((p) => (
            <CustomPropRow
              key={p.id}
              prop={p}
              onChange={(patch) => updateCustomProp(node.id, p.id, patch)}
              onRemove={() => removeCustomProp(node.id, p.id)}
            />
          ))}

          {/* 新增属性表单 */}
          {adding ? (
            <div className="prop-add">
              <label className="prop-label">属性名</label>
              <input
                className="ink-field"
                autoFocus
                value={newLabel}
                placeholder="如：阵营、人口、危险度……"
                maxLength={20}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddProp()}
              />
              <label className="prop-label">控件类型</label>
              <select
                className="ink-field"
                value={newType}
                onChange={(e) => setNewType(e.target.value as CustomPropType)}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {newType === 'select' && (
                <>
                  <label className="prop-label">选项（逗号分隔）</label>
                  <input
                    className="ink-field"
                    value={newOptions}
                    placeholder="联盟, 中立, 敌对"
                    onChange={(e) => setNewOptions(e.target.value)}
                  />
                </>
              )}
              <div className="prop-add__actions">
                <button className="ink-btn ink-btn--ghost ink-btn--sm" onClick={resetAddForm}>取消</button>
                <button className="ink-btn ink-btn--seal ink-btn--sm" onClick={handleAddProp}>添加</button>
              </div>
            </div>
          ) : (
            <button className="prop-add-btn" onClick={() => setAdding(true)}>
              ＋ 添加自定义属性
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

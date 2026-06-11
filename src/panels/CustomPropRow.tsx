import type { CustomProp } from '../types';

interface Props {
  prop: CustomProp;
  onChange: (patch: Partial<CustomProp>) => void;
  onRemove: () => void;
}

const RATING_MAX = 5;
const PROGRESS_MAX = 5;

/** 单行自定义属性：按类型渲染对应控件 */
export function CustomPropRow({ prop, onChange, onRemove }: Props) {
  const num = typeof prop.value === 'number' ? prop.value : 0;

  return (
    <div className="cprop">
      <div className="cprop__top">
        <span className="cprop__label" title={prop.label}>{prop.label}</span>
        <button className="cprop__del" title="移除此属性" onClick={onRemove}>✕</button>
      </div>

      <div className="cprop__ctrl">
        {prop.type === 'text' && (
          <input
            className="ink-field"
            value={String(prop.value)}
            onChange={(e) => onChange({ value: e.target.value })}
          />
        )}

        {prop.type === 'textarea' && (
          <textarea
            className="ink-field prop-textarea"
            rows={3}
            value={String(prop.value)}
            onChange={(e) => onChange({ value: e.target.value })}
          />
        )}

        {prop.type === 'number' && (
          <input
            className="ink-field"
            type="number"
            value={num}
            onChange={(e) => onChange({ value: Number(e.target.value) })}
          />
        )}

        {prop.type === 'checkbox' && (
          <button
            type="button"
            className={`cprop__check ${prop.value ? 'is-on' : ''}`}
            onClick={() => onChange({ value: !prop.value })}
          >
            <span className="cprop__check-box">{prop.value ? '✓' : ''}</span>
            <span className="cprop__check-text">{prop.value ? '是' : '否'}</span>
          </button>
        )}

        {prop.type === 'select' && (
          <select
            className="ink-field"
            value={String(prop.value)}
            onChange={(e) => onChange({ value: e.target.value })}
          >
            {(prop.options ?? []).map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        )}

        {prop.type === 'rating' && (
          <div className="cprop__stars">
            {Array.from({ length: RATING_MAX }, (_, i) => i + 1).map((i) => (
              <button
                key={i}
                type="button"
                className={`cprop__star ${i <= num ? 'is-on' : ''}`}
                onClick={() => onChange({ value: i === num ? i - 1 : i })}
                aria-label={`${i} 星`}
              >
                {i <= num ? '★' : '☆'}
              </button>
            ))}
          </div>
        )}

        {prop.type === 'progress' && (
          <div className="cprop__progress">
            {Array.from({ length: PROGRESS_MAX }, (_, i) => i + 1).map((i) => (
              <button
                key={i}
                type="button"
                className={`cprop__cell ${i <= num ? 'is-on' : ''}`}
                onClick={() => onChange({ value: i === num ? i - 1 : i })}
                aria-label={`进度 ${i}/${PROGRESS_MAX}`}
              />
            ))}
            <span className="cprop__progress-num">{num}/{PROGRESS_MAX}</span>
          </div>
        )}
      </div>
    </div>
  );
}

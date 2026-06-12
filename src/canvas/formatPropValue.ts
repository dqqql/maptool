/* 自定义属性值的展示格式化（编辑器悬浮浮窗与只读 viewer 共用）*/

export function formatPropValue(type: string, value: string | number | boolean): string {
  if (type === 'checkbox') return value ? '是' : '否';
  if (type === 'rating') return `${Number(value) || 0} 星`;
  const str = String(value ?? '').trim();
  return str || '—';
}

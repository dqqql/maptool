import { useEffect, useRef, useState } from 'react';

export interface ExportItem {
  key: string;
  label: string;
  tip?: string;
}

interface Props {
  items: ExportItem[];
  busy?: boolean;
  onSelect: (key: string) => void;
}

/** 画布工具条上的「导出」下拉菜单。 */
export function ExportMenu({ items, busy, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="export-menu" ref={ref}>
      <button
        className="tool tool--export"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        title="导出地图"
      >
        {busy ? '导出中…' : '导出 ▾'}
      </button>
      {open && (
        <div className="export-menu__list" role="menu">
          {items.map((it) => (
            <button
              key={it.key}
              className="export-menu__item"
              role="menuitem"
              title={it.tip}
              onClick={() => {
                setOpen(false);
                onSelect(it.key);
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

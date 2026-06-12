/* =========================================================================
   素材库大窗口：居中弹窗，支持搜索 + 分类筛选。
   - 左键单击素材 → 关闭窗口并交由上层进入「拖曳放置」流程。
   - 选中某分类后，顶部出现该分类「快捷栏」槽位（共 QUICK_SLOT_COUNT 个）：
     从素材网格拖入放置、把槽位拖出或点 ✕ 卸除、槽位之间拖动交换。
   ========================================================================= */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BUILTIN_ASSETS, BUILTIN_GROUPS, QUICK_SLOT_COUNT, builtinByGroup } from '../assets/builtin';
import type { Asset } from '../types';
import './AssetLibraryModal.css';

interface Props {
  open: boolean;
  initialGroup?: string | null;
  quickSlots: Record<string, (string | null)[]>;
  returnFocus: HTMLElement | null;
  onChangeSlots: (group: string, slots: (string | null)[]) => void;
  onResetSlots: (group: string) => void;
  onClose: () => void;
  onPick: (asset: Asset) => void;
}

const ALL = '全部';
const PICK = 'application/x-slot-pick'; // 网格素材 → 槽位（携带 assetId）
const FROM = 'application/x-slot-from'; // 槽位 → 别处（携带源槽位下标）
const FOCUSABLE = [
  'button:not([disabled])',
  'input:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function AssetLibraryModal({
  open,
  initialGroup,
  quickSlots,
  returnFocus,
  onChangeSlots,
  onResetSlots,
  onClose,
  onPick,
}: Props) {
  const [group, setGroup] = useState<string>(ALL);
  const [query, setQuery] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);

  const groups = useMemo(() => builtinByGroup(), []);
  const byId = useMemo(() => new Map(BUILTIN_ASSETS.map((a) => [a.id, a])), []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 每次打开时重置筛选与关键字到入口分类
  useEffect(() => {
    if (open) {
      setGroup(initialGroup ?? ALL);
      setQuery('');
    }
  }, [open, initialGroup]);

  // 隔离背景、锁定焦点，并在关闭后把焦点还给入口。
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const appRoot = document.getElementById('root');
    const rootWasInert = appRoot?.hasAttribute('inert') ?? false;
    appRoot?.setAttribute('inert', '');

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
      if (focusable.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', onKey);
    const focusFrame = requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', onKey);
      if (!rootWasInert) appRoot?.removeAttribute('inert');
      (returnFocus ?? previousFocus)?.focus();
    };
  }, [open, returnFocus]);

  if (!open) return null;

  const editing = group !== ALL;
  const slots = (quickSlots[group] ?? Array(QUICK_SLOT_COUNT).fill(null)).slice(0, QUICK_SLOT_COUNT);

  function placeInSlot(i: number, assetId: string) {
    const next = slots.map((id) => (id === assetId ? null : id)); // 同一素材只占一个槽
    next[i] = assetId;
    onChangeSlots(group, next);
  }
  function clearSlot(i: number) {
    const next = slots.slice();
    next[i] = null;
    onChangeSlots(group, next);
  }
  function swapSlot(i: number, j: number) {
    if (i === j) return;
    const next = slots.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChangeSlots(group, next);
  }
  function onSlotDrop(e: React.DragEvent, i: number) {
    e.preventDefault();
    const pick = e.dataTransfer.getData(PICK);
    const from = e.dataTransfer.getData(FROM);
    if (pick) placeInSlot(i, pick);
    else if (from !== '') swapSlot(i, Number(from));
  }

  const q = query.trim();
  const sections = groups
    .filter((sec) => group === ALL || sec.group === group)
    .map((sec) => ({
      group: sec.group,
      assets: q ? sec.assets.filter((a) => a.name.includes(q)) : sec.assets,
    }))
    .filter((sec) => sec.assets.length > 0);

  const total = sections.reduce((n, s) => n + s.assets.length, 0);

  return createPortal(
    <div className="alib-mask" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="alib"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-library-title"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="alib__head">
          <div>
            <h2 className="alib__title" id="asset-library-title">素材库</h2>
            <p className="alib__sub">单击素材即可取出，移到画布上再次单击落下</p>
          </div>
          <button className="alib__close" onClick={onClose} title="关闭（Esc）">✕</button>
        </header>

        <div className="alib__bar">
          <input
            ref={searchRef}
            className="alib__search"
            placeholder="搜索素材名称…"
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="alib__filters">
            <button className="alib__chip" aria-pressed={group === ALL} onClick={() => setGroup(ALL)}>
              {ALL}
            </button>
            {BUILTIN_GROUPS.map((g) => (
              <button key={g} className="alib__chip" aria-pressed={group === g} onClick={() => setGroup(g)}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {editing && (
          <div className="alib-slots">
            <div className="alib-slots__head">
              <span className="alib-slots__title">「{group}」快捷栏</span>
              <span className="alib-slots__hint">拖动下方素材到槽位放置 · 把槽位拖出或点 ✕ 卸除</span>
              <button className="alib-slots__reset" onClick={() => onResetSlots(group)}>恢复默认</button>
            </div>
            <div className="alib-slots__row">
              {slots.map((id, i) => {
                const a = id ? byId.get(id) : undefined;
                return (
                  <div
                    key={i}
                    className="alib-slot"
                    data-filled={a ? 'true' : 'false'}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onSlotDrop(e, i)}
                  >
                    {a ? (
                      <div
                        className="alib-slot__inner"
                        draggable
                        title={a.name}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(FROM, String(i));
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                      >
                        <img src={a.dataUrl} alt={a.name} draggable={false} />
                        <button
                          className="alib-slot__x"
                          title="卸除"
                          onClick={() => clearSlot(i)}
                          onDragStart={(e) => e.preventDefault()}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className="alib-slot__plus">＋</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          className="alib__body"
          onDragOver={(e) => {
            if (editing && Array.from(e.dataTransfer.types).includes(FROM)) e.preventDefault();
          }}
          onDrop={(e) => {
            const from = e.dataTransfer.getData(FROM);
            if (editing && from !== '') {
              e.preventDefault();
              clearSlot(Number(from));
            }
          }}
        >
          {total === 0 ? (
            <p className="alib__empty">没有匹配「{q}」的素材。</p>
          ) : (
            sections.map((sec) => (
              <section className="alib__section" key={sec.group}>
                <h3 className="alib__cat">
                  {sec.group}
                  <span className="alib__count">{sec.assets.length}</span>
                </h3>
                <div className="alib__grid">
                  {sec.assets.map((asset) => (
                    <button
                      className="alib__item"
                      key={asset.id}
                      title={`单击取出「${asset.name}」，或拖到上方快捷栏`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(PICK, asset.id);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onClick={() => onPick(asset)}
                    >
                      <span className="alib__thumb">
                        <img src={asset.dataUrl} alt={asset.name} draggable={false} />
                      </span>
                      <span className="alib__name">{asset.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

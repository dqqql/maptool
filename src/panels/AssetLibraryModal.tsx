/* =========================================================================
   素材库大窗口：居中弹窗，支持搜索 + 分类筛选。
   左键单击素材 → 关闭窗口并交由上层进入「拖曳放置」流程。
   ========================================================================= */
import { useEffect, useMemo, useState } from 'react';
import { BUILTIN_GROUPS, builtinByGroup } from '../assets/builtin';
import type { Asset } from '../types';
import './AssetLibraryModal.css';

interface Props {
  open: boolean;
  initialGroup?: string | null;
  onClose: () => void;
  onPick: (asset: Asset) => void;
}

const ALL = '全部';

export function AssetLibraryModal({ open, initialGroup, onClose, onPick }: Props) {
  const [group, setGroup] = useState<string>(ALL);
  const [query, setQuery] = useState('');

  const groups = useMemo(() => builtinByGroup(), []);

  // 每次打开时重置筛选与关键字到入口分类
  useEffect(() => {
    if (open) {
      setGroup(initialGroup ?? ALL);
      setQuery('');
    }
  }, [open, initialGroup]);

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim();
  const sections = groups
    .filter((sec) => group === ALL || sec.group === group)
    .map((sec) => ({
      group: sec.group,
      assets: q ? sec.assets.filter((a) => a.name.includes(q)) : sec.assets,
    }))
    .filter((sec) => sec.assets.length > 0);

  const total = sections.reduce((n, s) => n + s.assets.length, 0);

  return (
    <div className="alib-mask" onMouseDown={onClose}>
      <div className="alib" onMouseDown={(e) => e.stopPropagation()}>
        <header className="alib__head">
          <div>
            <h2 className="alib__title">素材库</h2>
            <p className="alib__sub">单击素材即可取出，移到画布上再次单击落下</p>
          </div>
          <button className="alib__close" onClick={onClose} title="关闭（Esc）">✕</button>
        </header>

        <div className="alib__bar">
          <input
            className="alib__search"
            placeholder="搜索素材名称…"
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="alib__filters">
            <button
              className="alib__chip"
              aria-pressed={group === ALL}
              onClick={() => setGroup(ALL)}
            >
              {ALL}
            </button>
            {BUILTIN_GROUPS.map((g) => (
              <button
                key={g}
                className="alib__chip"
                aria-pressed={group === g}
                onClick={() => setGroup(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="alib__body">
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
                      title={`取出「${asset.name}」`}
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
    </div>
  );
}

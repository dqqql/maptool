import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listWorlds, createWorld, deleteWorld } from '../db/idb';
import type { World } from '../types';
import './HomePage.css';

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* —— 装饰：罗盘玫瑰 —— */
function CompassRose() {
  return (
    <svg className="masthead__rose" viewBox="0 0 100 100" fill="none" stroke="currentColor" aria-hidden>
      <g style={{ filter: 'url(#sketch)' }}>
        <circle cx="50" cy="50" r="30" strokeWidth="1.6" />
        <circle cx="50" cy="50" r="38" strokeWidth="1" opacity="0.5" />
        <path d="M50 4 L57 50 L50 96 L43 50 Z" strokeWidth="1.4" fill="rgba(36,26,16,0.08)" />
        <path d="M4 50 L50 43 L96 50 L50 57 Z" strokeWidth="1.4" />
        <path d="M50 8 L54 50 L50 50 Z" fill="var(--seal)" stroke="none" />
      </g>
    </svg>
  );
}

/* —— 装饰：手绘分隔线 —— */
function HandRule() {
  return (
    <svg className="masthead__rule" viewBox="0 0 440 14" fill="none" stroke="currentColor" preserveAspectRatio="none" aria-hidden>
      <g style={{ filter: 'url(#sketch)' }}>
        <path d="M2 7 H190" strokeWidth="1.4" />
        <path d="M438 7 H250" strokeWidth="1.4" />
        <path d="M220 2 L232 7 L220 12 L208 7 Z" strokeWidth="1.2" fill="rgba(36,26,16,0.12)" />
      </g>
    </svg>
  );
}

/* —— 装饰：空状态卷轴 —— */
function EmptyScroll() {
  return (
    <svg className="empty__art" viewBox="0 0 100 100" fill="none" stroke="currentColor" aria-hidden>
      <g style={{ filter: 'url(#sketch)' }} strokeWidth="1.6">
        <path d="M22 18 H78 V82 H22 Z" fill="rgba(255,250,235,0.4)" />
        <path d="M30 34 H70 M30 46 H64 M30 58 H70 M30 70 H52" strokeWidth="1.2" opacity="0.7" />
        <circle cx="50" cy="14" r="5" />
      </g>
    </svg>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const [worlds, setWorlds] = useState<World[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<World | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setWorlds(await listWorlds());
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (creating) setTimeout(() => inputRef.current?.focus(), 30);
  }, [creating]);

  async function handleCreate() {
    const world = await createWorld(newName);
    setCreating(false);
    setNewName('');
    navigate(`/world/${world.id}`);
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    await deleteWorld(pendingDelete.id);
    setPendingDelete(null);
    refresh();
  }

  const isEmpty = worlds !== null && worlds.length === 0;

  return (
    <div className="home parchment-bg grain-overlay">
      <div className="home__inner">
        {/* 报头 */}
        <header className="masthead">
          <CompassRose />
          <h1 className="masthead__title">世界舆图</h1>
          <p className="masthead__sub">Cartographer&apos;s Atlas · A&nbsp;GM&apos;s Worldbook</p>
          <HandRule />
        </header>

        {/* 操作条 */}
        <div className="home__actions">
          <p className="home__count">
            {worlds === null ? '正在展开卷宗……' : (
              <>已记载 <em>{worlds.length}</em> 方天地</>
            )}
          </p>
          <div className="home__action-group">
            <button
              className="ink-btn ink-btn--ghost"
              title="导入舆图文件（阶段 6 启用）"
              disabled
            >
              ↥ 导入舆图
            </button>
            <button className="ink-btn ink-btn--seal" onClick={() => setCreating(true)}>
              ✦ 开辟新世界
            </button>
          </div>
        </div>

        {/* 世界列表 / 空状态 */}
        {worlds === null ? null : isEmpty ? (
          <div className="empty">
            <EmptyScroll />
            <div className="empty__title">尚是一片混沌</div>
            <p className="empty__desc">
              此处空空如也，等待第一笔落墨。
              <br />
              开辟一方新世界，从此山河有名、聚落有迹。
            </p>
            <button className="ink-btn ink-btn--seal" onClick={() => setCreating(true)}>
              ✦ 开辟第一方天地
            </button>
          </div>
        ) : (
          <div className="world-grid">
            {worlds.map((w, i) => (
              <button
                key={w.id}
                className="world-card sketch-border"
                style={{ animationDelay: `${Math.min(i * 60, 480)}ms` }}
                onClick={() => navigate(`/world/${w.id}`)}
              >
                <span className="world-card__kicker">Realm № {String(i + 1).padStart(2, '0')}</span>
                <div className="world-card__name">{w.name}</div>
                <div className="world-card__meta">
                  <span>开辟于&nbsp; <b>{fmtDate(w.createdAt)}</b></span>
                  <span>最后修订&nbsp; <b>{fmtDate(w.updatedAt)}</b></span>
                </div>
                <span
                  className="world-card__del"
                  role="button"
                  aria-label="删除世界"
                  title="删除此世界"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete(w);
                  }}
                >
                  ✕
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 创建弹层 */}
      {creating && (
        <div className="overlay" onMouseDown={() => setCreating(false)}>
          <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
            <h2 className="dialog__title">开辟新世界</h2>
            <p className="dialog__hint">为这方即将诞生的天地起一个名字。日后可在编辑器中续写它的山川风物。</p>
            <label className="dialog__label">世界之名</label>
            <input
              ref={inputRef}
              className="ink-field"
              value={newName}
              placeholder="譬如「灰雾海岸」「九重云梦」……"
              maxLength={40}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setCreating(false);
              }}
            />
            <div className="dialog__actions">
              <button className="ink-btn ink-btn--ghost" onClick={() => setCreating(false)}>
                作罢
              </button>
              <button className="ink-btn ink-btn--seal" onClick={handleCreate}>
                落墨开辟
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹层 */}
      {pendingDelete && (
        <div className="overlay" onMouseDown={() => setPendingDelete(null)}>
          <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
            <h2 className="dialog__title">焚毁此卷？</h2>
            <p className="dialog__hint">
              你将抹去 <span className="dialog__strong">{pendingDelete.name}</span> 的全部记载，山河、聚落与连线皆不复存在。此举无法撤回。
            </p>
            <div className="dialog__actions">
              <button className="ink-btn ink-btn--ghost" onClick={() => setPendingDelete(null)}>
                留它一命
              </button>
              <button className="ink-btn ink-btn--seal" onClick={handleDelete}>
                付之一炬
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

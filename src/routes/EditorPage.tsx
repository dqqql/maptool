import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Canvas } from '../canvas/Canvas';
import { LibraryPanel } from '../panels/LibraryPanel';
import { PropertyPanel } from '../panels/PropertyPanel';
import { useWorldStore, type ToolMode } from '../store/worldStore';
import { useLibraryStore } from '../store/libraryStore';
import { getWorld } from '../db/idb';
import { exportWorld } from '../serialization/worldFile';
import { DEFAULT_VIEWPORT, type Asset } from '../types';
import './EditorPage.css';

const TOOLS: { mode: ToolMode; icon: string; label: string; tip: string }[] = [
  { mode: 'select', icon: '✥', label: '选择', tip: '选择 / 移动 / 缩放节点（空白拖拽平移）' },
  { mode: 'pan', icon: '✋', label: '漫游', tip: '拖拽画布平移' },
  { mode: 'connect', icon: '⟿', label: '连线', tip: '依次点选两个节点建立连线' },
  { mode: 'text', icon: '¶', label: '文本', tip: '在画布空白处点击新建文本备注' },
];

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [worldName, setWorldName] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loaded = useWorldStore((s) => s.loaded);
  const viewport = useWorldStore((s) => s.viewport);
  const nodes = useWorldStore((s) => s.nodes);
  const texts = useWorldStore((s) => s.texts);
  const mode = useWorldStore((s) => s.mode);
  const connectFrom = useWorldStore((s) => s.connectFrom);
  const hasSelection = useWorldStore((s) => !!(s.selectedNodeId || s.selectedEdgeId || s.selectedTextId));
  const load = useWorldStore((s) => s.load);
  const unload = useWorldStore((s) => s.unload);
  const setViewport = useWorldStore((s) => s.setViewport);
  const setMode = useWorldStore((s) => s.setMode);
  const addNode = useWorldStore((s) => s.addNode);

  const loadLibrary = useLibraryStore((s) => s.load);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      const w = await getWorld(id);
      if (!alive) return;
      if (!w) {
        setNotFound(true);
        return;
      }
      setWorldName(w.name);
      await load(id);
    })();
    return () => {
      alive = false;
      unload();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (notFound) navigate('/', { replace: true });
  }, [notFound, navigate]);

  // 快捷键：Delete 删除、Ctrl/⌘+C/V 复制粘贴节点、Ctrl/⌘+D 复制、Esc 退出模式
  useEffect(() => {
    let clipboardNodeId: string | null = null;
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return;
      const store = useWorldStore.getState();
      const mod = e.ctrlKey || e.metaKey;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedNodeId || store.selectedEdgeId || store.selectedTextId) {
          e.preventDefault();
          store.removeSelected();
        }
      } else if (mod && (e.key === 'c' || e.key === 'C')) {
        if (store.selectedNodeId) clipboardNodeId = store.selectedNodeId;
      } else if (mod && (e.key === 'v' || e.key === 'V')) {
        if (clipboardNodeId && store.nodes.some((n) => n.id === clipboardNodeId)) {
          e.preventDefault();
          store.duplicateNode(clipboardNodeId);
        }
      } else if (mod && (e.key === 'd' || e.key === 'D')) {
        if (store.selectedNodeId) {
          e.preventDefault();
          store.duplicateNode(store.selectedNodeId);
        }
      } else if (e.key === 'Escape') {
        store.clearSelection();
        if (store.mode !== 'select') store.setMode('select');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function zoomBy(factor: number) {
    const col = document.querySelector('.canvas-col') as HTMLElement | null;
    const cx = col ? col.clientWidth / 2 : 400;
    const cy = col ? col.clientHeight / 2 : 300;
    const oldScale = viewport.scale;
    const newScale = Math.max(0.2, Math.min(4, oldScale * factor));
    const worldX = (cx - viewport.x) / oldScale;
    const worldY = (cy - viewport.y) / oldScale;
    setViewport({ scale: newScale, x: cx - worldX * newScale, y: cy - worldY * newScale });
  }
  function resetView() {
    setViewport({ ...DEFAULT_VIEWPORT });
  }

  function placeAtCenter(asset: Asset) {
    const col = document.querySelector('.canvas-col') as HTMLElement | null;
    const cx = col ? col.clientWidth / 2 : 400;
    const cy = col ? col.clientHeight / 2 : 300;
    // 级联偏移，避免连续放置完全重叠
    const k = nodes.length % 6;
    const worldX = (cx - viewport.x) / viewport.scale + k * 24;
    const worldY = (cy - viewport.y) / viewport.scale + k * 24;
    addNode(asset.id, asset.name, worldX, worldY);
  }

  async function handleExport() {
    if (!id) return;
    setExporting(true);
    try {
      await exportWorld(id);
    } catch (err) {
      alert('导出失败：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExporting(false);
    }
  }

  const zoomPct = Math.round(viewport.scale * 100);
  const isBlank = nodes.length === 0 && texts.length === 0;

  return (
    <div className="editor parchment-bg">
      <div className="toolbar">
        <button className="toolbar__back" onClick={() => navigate('/')}>← 返回卷宗</button>
        <div className="toolbar__divider" />
        <div className="toolbar__title" title={worldName}>{worldName || '……'}</div>
        <div className="toolbar__spacer" />
        <div className="toolbar__tools">
          {TOOLS.map((t) => (
            <button
              key={t.mode}
              className="tool"
              aria-pressed={mode === t.mode}
              title={t.tip}
              onClick={() => setMode(t.mode)}
            >
              <span className="tool__icon">{t.icon}</span> {t.label}
            </button>
          ))}
          <div className="toolbar__divider" />
          <button className="tool tool--export" onClick={handleExport} disabled={exporting} title="导出为 JSON 存档">
            <span className="tool__icon">⇩</span> {exporting ? '导出中…' : '导出'}
          </button>
        </div>
      </div>

      <div className="editor__body">
        <LibraryPanel onPlace={placeAtCenter} />

        <div className="canvas-col grain-overlay">
          {loaded ? (
            <>
              <Canvas />
              {isBlank && mode === 'select' && (
                <div className="canvas-hint">
                  <div className="canvas-hint__title">空白的羊皮纸</div>
                  <div className="canvas-hint__desc">从左侧素材库拖入山河 · 滚轮缩放 · 拖拽平移</div>
                </div>
              )}

              {mode === 'connect' && (
                <div className="canvas-mode-banner">
                  {connectFrom ? '再点选另一个节点完成连线' : '点选起始节点开始连线'} · Esc 退出
                </div>
              )}
              {mode === 'text' && (
                <div className="canvas-mode-banner">在空白处点击放置文本备注 · Esc 退出</div>
              )}

              <div className="hud">
                <button className="hud__btn" title="缩小" onClick={() => zoomBy(1 / 1.2)}>−</button>
                <span className="hud__zoom" title="重置缩放" onClick={resetView}>{zoomPct}%</span>
                <button className="hud__btn" title="放大" onClick={() => zoomBy(1.2)}>+</button>
                <button className="hud__home" onClick={resetView} title="回到原点">⊹ 回到原点</button>
              </div>

              {hasSelection && mode === 'select' && (
                <div className="canvas-tip">Delete 删除 · Ctrl/⌘+D 复制 · 拖角缩放</div>
              )}
            </>
          ) : (
            <div className="editor__loading">正在铺展羊皮纸……</div>
          )}
        </div>

        <PropertyPanel />
      </div>
    </div>
  );
}

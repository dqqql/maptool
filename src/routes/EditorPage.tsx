import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Canvas } from '../canvas/Canvas';
import { LibraryPanel } from '../panels/LibraryPanel';
import { PropertyPanel } from '../panels/PropertyPanel';
import { useWorldStore } from '../store/worldStore';
import { useLibraryStore } from '../store/libraryStore';
import { getWorld } from '../db/idb';
import { DEFAULT_VIEWPORT, type Asset } from '../types';
import './EditorPage.css';

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [worldName, setWorldName] = useState('');
  const [notFound, setNotFound] = useState(false);

  const loaded = useWorldStore((s) => s.loaded);
  const viewport = useWorldStore((s) => s.viewport);
  const nodes = useWorldStore((s) => s.nodes);
  const selectedNodeId = useWorldStore((s) => s.selectedNodeId);
  const load = useWorldStore((s) => s.load);
  const unload = useWorldStore((s) => s.unload);
  const setViewport = useWorldStore((s) => s.setViewport);
  const addNode = useWorldStore((s) => s.addNode);
  const removeNode = useWorldStore((s) => s.removeNode);
  const duplicateNode = useWorldStore((s) => s.duplicateNode);

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

  // 快捷键：Delete 删除、Ctrl/⌘+D 复制选中节点
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return;
      const sel = useWorldStore.getState().selectedNodeId;
      if (!sel) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeNode(sel);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        duplicateNode(sel);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [removeNode, duplicateNode]);

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

  // 双击素材：落于当前视图中心
  function placeAtCenter(asset: Asset) {
    const col = document.querySelector('.canvas-col') as HTMLElement | null;
    const cx = col ? col.clientWidth / 2 : 400;
    const cy = col ? col.clientHeight / 2 : 300;
    const worldX = (cx - viewport.x) / viewport.scale;
    const worldY = (cy - viewport.y) / viewport.scale;
    addNode(asset.id, asset.name, worldX, worldY);
  }

  const zoomPct = Math.round(viewport.scale * 100);
  const hasNodes = nodes.length > 0;

  return (
    <div className="editor parchment-bg">
      {/* 顶部工具栏 */}
      <div className="toolbar">
        <button className="toolbar__back" onClick={() => navigate('/')}>
          ← 返回卷宗
        </button>
        <div className="toolbar__divider" />
        <div className="toolbar__title" title={worldName}>
          {worldName || '……'}
        </div>
        <div className="toolbar__spacer" />
        <div className="toolbar__tools">
          <button className="tool" aria-pressed="true" title="选择 / 平移（当前可用）">
            <span className="tool__icon">✥</span> 漫游
          </button>
          <button className="tool" disabled title="连线工具（阶段 5）">
            <span className="tool__icon">⟿</span> 连线
          </button>
          <button className="tool" disabled title="文本工具（阶段 5）">
            <span className="tool__icon">¶</span> 文本
          </button>
          <button className="tool" disabled title="导出舆图（阶段 6）">
            <span className="tool__icon">⇩</span> 导出
          </button>
        </div>
      </div>

      {/* 三栏主体 */}
      <div className="editor__body">
        <LibraryPanel onPlace={placeAtCenter} />

        <div className="canvas-col grain-overlay">
          {loaded ? (
            <>
              <Canvas />
              {!hasNodes && (
                <div className="canvas-hint">
                  <div className="canvas-hint__title">空白的羊皮纸</div>
                  <div className="canvas-hint__desc">从左侧素材库拖入山河 · 滚轮缩放 · 拖拽平移</div>
                </div>
              )}
              <div className="hud">
                <button className="hud__btn" title="缩小" onClick={() => zoomBy(1 / 1.2)}>−</button>
                <span className="hud__zoom" title="重置缩放" onClick={resetView}>{zoomPct}%</span>
                <button className="hud__btn" title="放大" onClick={() => zoomBy(1.2)}>+</button>
                <button className="hud__home" onClick={resetView} title="回到原点">⊹ 回到原点</button>
              </div>
              {selectedNodeId && (
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

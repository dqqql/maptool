import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Canvas } from '../canvas/Canvas';
import { useWorldStore } from '../store/worldStore';
import { getWorld } from '../db/idb';
import { DEFAULT_VIEWPORT } from '../types';
import './EditorPage.css';

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [worldName, setWorldName] = useState('');
  const [notFound, setNotFound] = useState(false);

  const { loaded, viewport, load, unload, setViewport } = useWorldStore();

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

  function zoomBy(factor: number) {
    // 以画布中心为锚点缩放
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

  const zoomPct = Math.round(viewport.scale * 100);

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
        {/* 左：素材库（阶段 3）*/}
        <aside className="rail rail--left grain-overlay">
          <div className="rail__head">素材库</div>
          <div className="rail__sub">Material Codex</div>
          <div className="rail__pending">
            <b>山河待引</b>
            内置黑白手绘素材
            <br />
            将在此陈列，拖入画布即成节点。
            <span className="rail__stage-tag">阶段 3 启用</span>
          </div>
        </aside>

        {/* 中：画布 */}
        <div className="canvas-col grain-overlay">
          {loaded ? (
            <>
              <Canvas viewport={viewport} onViewportChange={setViewport} />
              <div className="canvas-hint">
                <div className="canvas-hint__title">空白的羊皮纸</div>
                <div className="canvas-hint__desc">滚轮缩放 · 拖拽平移 · 山河自此落墨</div>
              </div>
              <div className="hud">
                <button className="hud__btn" title="缩小" onClick={() => zoomBy(1 / 1.2)}>
                  −
                </button>
                <span className="hud__zoom" title="重置缩放" onClick={resetView}>
                  {zoomPct}%
                </span>
                <button className="hud__btn" title="放大" onClick={() => zoomBy(1.2)}>
                  +
                </button>
                <button className="hud__home" onClick={resetView} title="回到原点">
                  ⊹ 回到原点
                </button>
              </div>
            </>
          ) : (
            <div className="editor__loading">正在铺展羊皮纸……</div>
          )}
        </div>

        {/* 右：属性面板（阶段 4）*/}
        <aside className="rail rail--right grain-overlay">
          <div className="rail__head">属性</div>
          <div className="rail__sub">Annotations</div>
          <div className="rail__pending">
            <b>尚无选中</b>
            选中节点后，其名称、描述
            <br />
            与自定义属性将在此显现。
            <span className="rail__stage-tag">阶段 4 启用</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

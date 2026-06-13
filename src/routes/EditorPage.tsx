import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Canvas, type CanvasHandle } from '../canvas/Canvas';
import { LibraryPanel } from '../panels/LibraryPanel';
import { PropertyPanel } from '../panels/PropertyPanel';
import { ExportMenu, type ExportItem } from '../components/ExportMenu';
import { useWorldStore, type ToolMode } from '../store/worldStore';
import { useLibraryStore } from '../store/libraryStore';
import { getWorld } from '../db/idb';
import { exportWorld } from '../serialization/worldFile';
import { exportAutoRange, exportCurrentView, downloadBlob } from '../export/exportPng';
import { exportReadonlyHtml } from '../export/exportHtml';
import { DEFAULT_VIEWPORT, type Asset, type GeneratedEncounter, type TextBox } from '../types';
import { RandomStoryDialog } from '../features/randomStory/RandomStoryDialog';
import {
  encounterToMarkdown,
  selectedContentBounds,
} from '../features/randomStory/randomStorySelection';
import { useRandomStoryStore } from '../features/randomStory/randomStoryStore';
import './EditorPage.css';

const EXPORT_ITEMS: ExportItem[] = [
  { key: 'png-auto', label: '高清图片 · 全图', tip: '按所有内容自动框定范围导出 PNG' },
  { key: 'png-view', label: '高清图片 · 当前视图', tip: '导出当前可见画面为 PNG' },
  { key: 'html', label: '只读网页 · 可分享', tip: '导出离线 HTML，他人可查看但不可编辑' },
  { key: 'json', label: 'JSON 存档', tip: '导出 .world.json，可再导入恢复' },
];

const PNG_PIXEL_RATIO = 2;
const STORY_TEXT_WIDTH = 420;
const STORY_TEXT_GAP = 28;
const STORY_PLACEMENT_GAP = 120;

const TOOLS: { mode: ToolMode; label: string; tip: string }[] = [
  { mode: 'select', label: '选择', tip: '选择 / 移动 / 缩放节点（空白拖拽平移）' },
  { mode: 'connect', label: '连线', tip: '依次点选两个节点建立连线' },
  { mode: 'text', label: '文本', tip: '在画布空白处点击新建文本备注' },
];

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [worldName, setWorldName] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [randomStoryOpen, setRandomStoryOpen] = useState(false);
  const canvasRef = useRef<CanvasHandle>(null);

  const [floating, setFloating] = useState<Asset | null>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  const loaded = useWorldStore((s) => s.loaded);
  const viewport = useWorldStore((s) => s.viewport);
  const nodes = useWorldStore((s) => s.nodes);
  const texts = useWorldStore((s) => s.texts);
  const edges = useWorldStore((s) => s.edges);
  const mode = useWorldStore((s) => s.mode);
  const connectFrom = useWorldStore((s) => s.connectFrom);
  const hasSelection = useWorldStore((s) => !!(s.selectedNodeId || s.selectedEdgeId || s.selectedTextId));
  const load = useWorldStore((s) => s.load);
  const unload = useWorldStore((s) => s.unload);
  const setViewport = useWorldStore((s) => s.setViewport);
  const setMode = useWorldStore((s) => s.setMode);
  const addNode = useWorldStore((s) => s.addNode);
  const addGeneratedTexts = useWorldStore((s) => s.addGeneratedTexts);

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

  // 快捷键：删除键删除、复制粘贴快捷键、复制快捷键、退出键退出模式
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

  // —— 大窗口取出后的「拖曳放置」流程 ——
  function startFloat(asset: Asset) {
    setCursor({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    setFloating(asset);
  }
  function placeFloating(e: React.MouseEvent) {
    if (!floating) return;
    const wrap = document.querySelector('.canvas-wrap') as HTMLElement | null;
    if (wrap) {
      const rect = wrap.getBoundingClientRect();
      const vp = useWorldStore.getState().viewport;
      const wx = (e.clientX - rect.left - vp.x) / vp.scale;
      const wy = (e.clientY - rect.top - vp.y) / vp.scale;
      addNode(floating.id, floating.name, wx, wy);
    }
    setFloating(null);
  }
  useEffect(() => {
    if (!floating) return;
    function onMove(e: MouseEvent) {
      setCursor({ x: e.clientX, y: e.clientY });
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFloating(null);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [floating]);

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

  function safeFileBase() {
    return (worldName || '世界').replace(/[\\/:*?"<>|]/g, '_').slice(0, 40) || '世界';
  }

  async function handleExportSelect(key: string) {
    if (!id) return;
    setExporting(true);
    try {
      if (key === 'json') {
        await exportWorld(id);
        return;
      }
      if (key === 'html') {
        await exportReadonlyHtml(id, `${safeFileBase()}.html`);
        return;
      }
      const stage = canvasRef.current?.getStage();
      if (!stage) throw new Error('画布尚未就绪');
      const store = useWorldStore.getState();
      if (key === 'png-auto') {
        const blob = await exportAutoRange(stage, store.nodes, store.texts, { pixelRatio: PNG_PIXEL_RATIO });
        downloadBlob(blob, `${safeFileBase()}.png`);
      } else if (key === 'png-view') {
        const blob = await exportCurrentView(stage, { pixelRatio: PNG_PIXEL_RATIO });
        downloadBlob(blob, `${safeFileBase()}-视图.png`);
      }
    } catch (err) {
      alert('导出失败：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExporting(false);
    }
  }

  function fitGeneratedTexts(boxes: TextBox[]) {
    const col = document.querySelector('.canvas-col') as HTMLElement | null;
    if (!col || boxes.length === 0) return;
    const minX = Math.min(...boxes.map((box) => box.x));
    const minY = Math.min(...boxes.map((box) => box.y));
    const maxX = Math.max(...boxes.map((box) => box.x + box.width));
    const maxY = Math.max(...boxes.map((box) => box.y + box.height));
    const width = maxX - minX;
    const height = maxY - minY;
    const padding = 56;
    const scale = Math.max(
      0.2,
      Math.min(1.2, (col.clientWidth - padding * 2) / width, (col.clientHeight - padding * 2) / height),
    );
    setViewport({
      scale,
      x: col.clientWidth / 2 - (minX + width / 2) * scale,
      y: col.clientHeight / 2 - (minY + height / 2) * scale,
    });
  }

  function handleStoriesGenerated(encounters: GeneratedEncounter[]) {
    const selection = useRandomStoryStore.getState();
    const bounds = selectedContentBounds(nodes, edges, texts, selection);
    const col = document.querySelector('.canvas-col') as HTMLElement | null;
    const centerX = ((col?.clientWidth ?? 800) / 2 - viewport.x) / viewport.scale;
    const centerY = ((col?.clientHeight ?? 600) / 2 - viewport.y) / viewport.scale;
    const x = bounds ? bounds.x + bounds.width + STORY_PLACEMENT_GAP : centerX - STORY_TEXT_WIDTH / 2;
    const y = bounds ? bounds.y : centerY - 100;
    const boxes = addGeneratedTexts(
      encounters.map(encounterToMarkdown),
      x,
      y,
      STORY_TEXT_WIDTH,
      STORY_TEXT_GAP,
    );
    fitGeneratedTexts(boxes);
    alert(`已生成${encounters.length}份随机故事并放置到地图`);
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
      </div>

      <div className="editor__body">
        <LibraryPanel onPlace={placeAtCenter} onFloatPlace={startFloat} />

        <div className="canvas-col grain-overlay">
          {loaded ? (
            <>
              <Canvas ref={canvasRef} />

              <div className="canvas-toolbar">
                {TOOLS.map((t) => (
                  <button
                    key={t.mode}
                    className="tool"
                    aria-pressed={mode === t.mode}
                    title={t.tip}
                    onClick={() => setMode(t.mode)}
                  >
                    {t.label}
                  </button>
                ))}
                <div className="canvas-toolbar__divider" />
                <button
                  className="tool"
                  title="根据地图内容生成随机故事"
                  onClick={() => setRandomStoryOpen(true)}
                >
                  随机故事
                </button>
                <ExportMenu items={EXPORT_ITEMS} busy={exporting} onSelect={handleExportSelect} />
              </div>

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

              {hasSelection && mode === 'select' && !floating && (
                <div className="canvas-tip">Delete 删除 · Ctrl/⌘+D 复制 · 拖角缩放</div>
              )}

              {floating && (
                <div className="place-overlay" onClick={placeFloating}>
                  <div className="place-banner">单击放置「{floating.name}」 · Esc 取消</div>
                </div>
              )}
            </>
          ) : (
            <div className="editor__loading">正在铺展羊皮纸……</div>
          )}
        </div>

        <PropertyPanel />
      </div>

      {floating && (
        <img
          className="place-ghost"
          src={floating.dataUrl}
          alt=""
          draggable={false}
          style={{ left: cursor.x, top: cursor.y }}
        />
      )}

      <RandomStoryDialog
        open={randomStoryOpen}
        nodes={nodes}
        edges={edges}
        texts={texts}
        onClose={() => setRandomStoryOpen(false)}
        onGenerated={handleStoriesGenerated}
      />
    </div>
  );
}

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Line, Circle, Group, Transformer } from 'react-konva';
import type Konva from 'konva';
import { useWorldStore } from '../store/worldStore';
import { NodeShape } from './NodeShape';

const MIN_SCALE = 0.2;
const MAX_SCALE = 4;
const GRID = 80;
const MAJOR_EVERY = 5;

const COLOR_MINOR = 'rgba(120, 95, 55, 0.13)';
const COLOR_MAJOR = 'rgba(96, 74, 40, 0.26)';
const COLOR_AXIS = 'rgba(140, 58, 43, 0.5)';

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * 无限羊皮纸画布。
 * - 纸张纹理由容器 CSS 提供，Konva Stage 透明叠加。
 * - 网格随视口缩放平移；滚轮以鼠标为中心缩放；空白处拖拽平移。
 * - 渲染节点、选中变换（Transformer）、从素材库拖放生成节点。
 */
export function Canvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const nodeRefs = useRef<Map<string, Konva.Group>>(new Map());

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [panning, setPanning] = useState(false);
  const panState = useRef<{ lastX: number; lastY: number } | null>(null);

  const viewport = useWorldStore((s) => s.viewport);
  const setViewport = useWorldStore((s) => s.setViewport);
  const nodes = useWorldStore((s) => s.nodes);
  const selectedNodeId = useWorldStore((s) => s.selectedNodeId);
  const select = useWorldStore((s) => s.select);
  const addNode = useWorldStore((s) => s.addNode);
  const updateNode = useWorldStore((s) => s.updateNode);

  const invScale = 1 / viewport.scale;

  // 自适应容器尺寸
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 节点 ref 登记，供 Transformer 绑定
  const registerRef = useCallback((id: string, ref: Konva.Group | null) => {
    if (ref) nodeRefs.current.set(id, ref);
    else nodeRefs.current.delete(id);
  }, []);

  // 选中变化 → Transformer 绑定到对应节点
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const target = selectedNodeId ? nodeRefs.current.get(selectedNodeId) : null;
    tr.nodes(target ? [target] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedNodeId, nodes]);

  // 可见世界范围 → 网格线
  const grid = useMemo(() => {
    const { x, y, scale } = viewport;
    const { w, h } = size;
    if (w === 0 || h === 0) return { minor: [] as number[][], major: [] as number[][] };
    const left = (0 - x) / scale;
    const top = (0 - y) / scale;
    const right = (w - x) / scale;
    const bottom = (h - y) / scale;
    const startX = Math.floor(left / GRID) * GRID;
    const startY = Math.floor(top / GRID) * GRID;
    const minor: number[][] = [];
    const major: number[][] = [];
    for (let gx = startX; gx <= right; gx += GRID) {
      ((gx / GRID) % MAJOR_EVERY === 0 ? major : minor).push([gx, top, gx, bottom]);
    }
    for (let gy = startY; gy <= bottom; gy += GRID) {
      ((gy / GRID) % MAJOR_EVERY === 0 ? major : minor).push([left, gy, right, gy]);
    }
    return { minor, major };
  }, [viewport, size]);

  const sortedNodes = useMemo(() => [...nodes].sort((a, b) => a.zIndex - b.zIndex), [nodes]);

  // 滚轮缩放（锚定鼠标）
  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const oldScale = viewport.scale;
    const worldX = (pointer.x - viewport.x) / oldScale;
    const worldY = (pointer.y - viewport.y) / oldScale;
    const factor = 1.08;
    const newScale = clamp(e.evt.deltaY > 0 ? oldScale / factor : oldScale * factor, MIN_SCALE, MAX_SCALE);
    setViewport({ scale: newScale, x: pointer.x - worldX * newScale, y: pointer.y - worldY * newScale });
  }

  // 空白处按下 → 取消选中 + 准备平移
  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (e.target !== e.target.getStage()) return;
    select(null);
    const p = stageRef.current?.getPointerPosition();
    if (!p) return;
    panState.current = { lastX: p.x, lastY: p.y };
    setPanning(true);
  }
  function handleMouseMove() {
    if (!panState.current) return;
    const p = stageRef.current?.getPointerPosition();
    if (!p) return;
    const dx = p.x - panState.current.lastX;
    const dy = p.y - panState.current.lastY;
    panState.current = { lastX: p.x, lastY: p.y };
    setViewport({ scale: viewport.scale, x: viewport.x + dx, y: viewport.y + dy });
  }
  function endPan() {
    panState.current = null;
    setPanning(false);
  }

  // 从素材库拖放 → 生成节点
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const assetId = e.dataTransfer.getData('application/x-asset-id');
    const name = e.dataTransfer.getData('application/x-asset-name') || '新节点';
    if (!assetId) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const worldX = (sx - viewport.x) / viewport.scale;
    const worldY = (sy - viewport.y) / viewport.scale;
    addNode(assetId, name, worldX, worldY);
  }

  return (
    <div
      ref={wrapRef}
      className="canvas-wrap"
      style={{ cursor: panning ? 'grabbing' : 'grab' }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {size.w > 0 && (
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          x={viewport.x}
          y={viewport.y}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={endPan}
          onMouseLeave={endPan}
        >
          {/* 网格层 */}
          <Layer listening={false}>
            {grid.minor.map((pts, i) => (
              <Line key={`mi${i}`} points={pts} stroke={COLOR_MINOR} strokeWidth={invScale} />
            ))}
            {grid.major.map((pts, i) => (
              <Line key={`ma${i}`} points={pts} stroke={COLOR_MAJOR} strokeWidth={1.4 * invScale} />
            ))}
            <Group>
              <Line points={[-13, 0, 13, 0]} stroke={COLOR_AXIS} strokeWidth={1.6 * invScale} />
              <Line points={[0, -13, 0, 13]} stroke={COLOR_AXIS} strokeWidth={1.6 * invScale} />
              <Circle x={0} y={0} radius={5 * invScale} stroke={COLOR_AXIS} strokeWidth={1.4 * invScale} />
            </Group>
          </Layer>

          {/* 节点层 */}
          <Layer>
            {sortedNodes.map((n) => (
              <NodeShape
                key={n.id}
                node={n}
                isSelected={n.id === selectedNodeId}
                invScale={invScale}
                onSelect={() => select(n.id)}
                onChange={(patch) => updateNode(n.id, patch)}
                registerRef={registerRef}
              />
            ))}
            <Transformer
              ref={trRef}
              rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
              anchorSize={9}
              anchorCornerRadius={5}
              anchorStroke="#8c3a2b"
              anchorFill="#f4ead0"
              borderStroke="#8c3a2b"
              borderDash={[5, 4]}
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < 28 || newBox.height < 28 ? oldBox : newBox
              }
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}

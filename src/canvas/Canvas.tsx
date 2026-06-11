import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Line, Circle, Group } from 'react-konva';
import type Konva from 'konva';
import type { Viewport } from '../types';

const MIN_SCALE = 0.2;
const MAX_SCALE = 4;
const GRID = 80; // 世界坐标网格间距
const MAJOR_EVERY = 5; // 每 5 格一条主线

const COLOR_MINOR = 'rgba(120, 95, 55, 0.13)';
const COLOR_MAJOR = 'rgba(96, 74, 40, 0.26)';
const COLOR_AXIS = 'rgba(140, 58, 43, 0.5)';

interface Props {
  viewport: Viewport;
  onViewportChange: (vp: Viewport) => void;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * 无限羊皮纸画布。
 * - 纸张纹理由容器 CSS 提供，Konva Stage 透明叠加。
 * - 网格在「世界坐标」绘制，随视口缩放平移（视差感）。
 * - 滚轮以鼠标为中心缩放；空白处拖拽平移。
 */
export function Canvas({ viewport, onViewportChange }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [panning, setPanning] = useState(false);
  const panState = useRef<{ lastX: number; lastY: number } | null>(null);

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

  // 当前可见世界范围 → 生成网格线
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
      const line = [gx, top, gx, bottom];
      ((gx / GRID) % MAJOR_EVERY === 0 ? major : minor).push(line);
    }
    for (let gy = startY; gy <= bottom; gy += GRID) {
      const line = [left, gy, right, gy];
      ((gy / GRID) % MAJOR_EVERY === 0 ? major : minor).push(line);
    }
    return { minor, major };
  }, [viewport, size]);

  // 滚轮缩放（以鼠标为中心）
  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = viewport.scale;
    const worldX = (pointer.x - viewport.x) / oldScale;
    const worldY = (pointer.y - viewport.y) / oldScale;

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1.08;
    const newScale = clamp(oldScale * (direction > 0 ? factor : 1 / factor), MIN_SCALE, MAX_SCALE);

    onViewportChange({
      scale: newScale,
      x: pointer.x - worldX * newScale,
      y: pointer.y - worldY * newScale,
    });
  }

  // 平移（仅在空白处按下）
  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (e.target !== e.target.getStage()) return; // 命中节点时不平移（为阶段3预留）
    const stage = stageRef.current;
    const p = stage?.getPointerPosition();
    if (!p) return;
    panState.current = { lastX: p.x, lastY: p.y };
    setPanning(true);
  }
  function handleMouseMove() {
    if (!panState.current) return;
    const stage = stageRef.current;
    const p = stage?.getPointerPosition();
    if (!p) return;
    const dx = p.x - panState.current.lastX;
    const dy = p.y - panState.current.lastY;
    panState.current = { lastX: p.x, lastY: p.y };
    onViewportChange({ scale: viewport.scale, x: viewport.x + dx, y: viewport.y + dy });
  }
  function endPan() {
    panState.current = null;
    setPanning(false);
  }

  return (
    <div ref={wrapRef} className="canvas-wrap" style={{ cursor: panning ? 'grabbing' : 'grab' }}>
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
          <Layer listening={false}>
            {grid.minor.map((pts, i) => (
              <Line key={`mi${i}`} points={pts} stroke={COLOR_MINOR} strokeWidth={1 / viewport.scale} />
            ))}
            {grid.major.map((pts, i) => (
              <Line key={`ma${i}`} points={pts} stroke={COLOR_MAJOR} strokeWidth={1.4 / viewport.scale} />
            ))}
            {/* 原点标记 */}
            <Group>
              <Line points={[-13, 0, 13, 0]} stroke={COLOR_AXIS} strokeWidth={1.6 / viewport.scale} />
              <Line points={[0, -13, 0, 13]} stroke={COLOR_AXIS} strokeWidth={1.6 / viewport.scale} />
              <Circle x={0} y={0} radius={5 / viewport.scale} stroke={COLOR_AXIS} strokeWidth={1.4 / viewport.scale} />
            </Group>
          </Layer>
        </Stage>
      )}
    </div>
  );
}

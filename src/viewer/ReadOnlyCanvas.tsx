/* =========================================================================
   只读画布：复用编辑器的 NodeShape / EdgeLine / TextShape（readOnly 模式），
   自管 viewport（滚轮缩放 + 拖拽平移），鼠标悬浮节点显示属性浮窗。
   背景羊皮纸纹理由外层 CSS（.parchment-bg/.grain-overlay）提供，Stage 透明叠加。
   ========================================================================= */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { NodeShape } from '../canvas/NodeShape';
import { EdgeLine } from '../canvas/EdgeLine';
import { TextShape } from '../canvas/TextShape';
import { formatPropValue } from '../canvas/formatPropValue';
import type { Asset, MapNode, Viewport, WorldData } from '../types';

const MIN_SCALE = 0.2;
const MAX_SCALE = 4;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const center = (n: MapNode) => ({ x: n.x + n.width / 2, y: n.y + n.height / 2 });
const noop = () => {};

interface Props {
  data: Pick<WorldData, 'nodes' | 'edges' | 'texts' | 'viewport'>;
  resolveAsset: (id: string) => Asset | undefined;
}

export function ReadOnlyCanvas({ data, resolveAsset }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const panState = useRef<{ lastX: number; lastY: number } | null>(null);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [viewport, setViewport] = useState<Viewport>(data.viewport ?? { x: 0, y: 0, scale: 1 });
  const [panning, setPanning] = useState(false);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);

  const invScale = 1 / viewport.scale;
  const nodeById = useMemo(() => new Map(data.nodes.map((n) => [n.id, n])), [data.nodes]);
  const sortedNodes = useMemo(() => [...data.nodes].sort((a, b) => a.zIndex - b.zIndex), [data.nodes]);

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

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;
    const oldScale = viewport.scale;
    const wx = (pointer.x - viewport.x) / oldScale;
    const wy = (pointer.y - viewport.y) / oldScale;
    const factor = 1.08;
    const newScale = clamp(e.evt.deltaY > 0 ? oldScale / factor : oldScale * factor, MIN_SCALE, MAX_SCALE);
    setViewport({ scale: newScale, x: pointer.x - wx * newScale, y: pointer.y - wy * newScale });
  }

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    const onEmpty = e.target === e.target.getStage();
    if (!onEmpty) return;
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

  const hoverNode = !panning && hoverNodeId ? nodeById.get(hoverNodeId) : null;
  const cursor = panning ? 'grabbing' : 'grab';

  return (
    <div ref={wrapRef} className="canvas-wrap" style={{ cursor }}>
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
          {/* 连线层 */}
          <Layer>
            {data.edges.map((edge) => {
              const from = nodeById.get(edge.fromNodeId);
              const to = nodeById.get(edge.toNodeId);
              if (!from || !to) return null;
              return (
                <EdgeLine
                  key={edge.id}
                  edge={edge}
                  from={center(from)}
                  to={center(to)}
                  isSelected={false}
                  invScale={invScale}
                  onSelect={noop}
                  readOnly
                />
              );
            })}
          </Layer>
          {/* 节点 + 文本框层 */}
          <Layer>
            {sortedNodes.map((n) => (
              <NodeShape
                key={n.id}
                node={n}
                isSelected={false}
                invScale={invScale}
                draggable={false}
                connectSource={false}
                onSelect={noop}
                onChange={noop}
                onHover={(hovering) => setHoverNodeId((cur) => (hovering ? n.id : cur === n.id ? null : cur))}
                registerRef={noop}
                readOnly
                resolveAsset={resolveAsset}
              />
            ))}
            {data.texts.map((t) => (
              <TextShape
                key={t.id}
                box={t}
                isSelected={false}
                invScale={invScale}
                onSelect={noop}
                onChange={noop}
                onEdit={noop}
                registerRef={noop}
                readOnly
              />
            ))}
          </Layer>
        </Stage>
      )}

      {hoverNode && (
        <div
          className="node-popover"
          style={{
            left: hoverNode.x * viewport.scale + viewport.x + (hoverNode.width * viewport.scale) / 2,
            top: hoverNode.y * viewport.scale + viewport.y - 10,
          }}
        >
          <div className="node-popover__name">{hoverNode.name || '未命名节点'}</div>
          {hoverNode.description.trim() && (
            <div className="node-popover__desc">{hoverNode.description}</div>
          )}
          {hoverNode.customProps.length > 0 && (
            <div className="node-popover__props">
              {hoverNode.customProps.map((p) => (
                <div className="node-popover__row" key={p.id}>
                  <span className="node-popover__key">{p.label}</span>
                  <span className="node-popover__val">{formatPropValue(p.type, p.value)}</span>
                </div>
              ))}
            </div>
          )}
          {!hoverNode.description.trim() && hoverNode.customProps.length === 0 && (
            <div className="node-popover__empty">暂无属性</div>
          )}
        </div>
      )}
    </div>
  );
}

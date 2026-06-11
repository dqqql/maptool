import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Line, Circle, Group, Transformer } from 'react-konva';
import type Konva from 'konva';
import { useWorldStore } from '../store/worldStore';
import { NodeShape } from './NodeShape';
import { EdgeLine } from './EdgeLine';
import { TextShape } from './TextShape';
import type { MapNode } from '../types';

const MIN_SCALE = 0.2;
const MAX_SCALE = 4;
const GRID = 80;
const MAJOR_EVERY = 5;

const COLOR_MINOR = 'rgba(120, 95, 55, 0.13)';
const COLOR_MAJOR = 'rgba(96, 74, 40, 0.26)';
const COLOR_AXIS = 'rgba(140, 58, 43, 0.5)';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const center = (n: MapNode) => ({ x: n.x + n.width / 2, y: n.y + n.height / 2 });

export function Canvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Map<string, Konva.Group>>(new Map());

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [panning, setPanning] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const panState = useRef<{ lastX: number; lastY: number } | null>(null);

  const s = useWorldStore();
  const {
    viewport, nodes, edges, texts, mode, connectFrom,
    selectedNodeId, selectedEdgeId, selectedTextId,
    setViewport, addNode, updateNode, selectNode, selectEdge, selectText,
    clearSelection, addEdge, setConnectFrom, addText, updateText,
  } = s;

  const invScale = 1 / viewport.scale;

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

  const registerRef = useCallback((id: string, ref: Konva.Group | null) => {
    if (ref) shapeRefs.current.set(id, ref);
    else shapeRefs.current.delete(id);
  }, []);

  // Transformer 绑定选中的节点或文本框
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const id = selectedNodeId ?? selectedTextId;
    const target = id ? shapeRefs.current.get(id) : null;
    tr.nodes(target ? [target] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedNodeId, selectedTextId, nodes, texts]);

  const grid = useMemo(() => {
    const { x, y, scale } = viewport;
    const { w, h } = size;
    if (w === 0 || h === 0) return { minor: [] as number[][], major: [] as number[][] };
    const left = (0 - x) / scale, top = (0 - y) / scale;
    const right = (w - x) / scale, bottom = (h - y) / scale;
    const startX = Math.floor(left / GRID) * GRID, startY = Math.floor(top / GRID) * GRID;
    const minor: number[][] = [], major: number[][] = [];
    for (let gx = startX; gx <= right; gx += GRID)
      ((gx / GRID) % MAJOR_EVERY === 0 ? major : minor).push([gx, top, gx, bottom]);
    for (let gy = startY; gy <= bottom; gy += GRID)
      ((gy / GRID) % MAJOR_EVERY === 0 ? major : minor).push([left, gy, right, gy]);
    return { minor, major };
  }, [viewport, size]);

  const sortedNodes = useMemo(() => [...nodes].sort((a, b) => a.zIndex - b.zIndex), [nodes]);
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  function worldOf(clientX: number, clientY: number) {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewport.x) / viewport.scale,
      y: (clientY - rect.top - viewport.y) / viewport.scale,
    };
  }

  // —— 缩放 ——
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

  // —— 节点点击（模式相关）——
  function handleNodeClick(id: string) {
    if (mode === 'connect') {
      if (!connectFrom) setConnectFrom(id);
      else if (connectFrom !== id) {
        addEdge(connectFrom, id);
        setConnectFrom(null);
      }
    } else if (mode === 'select') {
      selectNode(id);
    }
  }

  // —— 画布按下 ——
  function startPan() {
    const p = stageRef.current?.getPointerPosition();
    if (!p) return;
    panState.current = { lastX: p.x, lastY: p.y };
    setPanning(true);
  }
  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (mode === 'pan') {
      startPan();
      return;
    }
    const onEmpty = e.target === e.target.getStage();
    if (mode === 'text') {
      if (onEmpty) {
        const p = stageRef.current!.getPointerPosition()!;
        const wx = (p.x - viewport.x) / viewport.scale;
        const wy = (p.y - viewport.y) / viewport.scale;
        addText(wx, wy);
      }
      return;
    }
    // select / connect
    if (onEmpty) {
      clearSelection();
      if (mode === 'connect') setConnectFrom(null);
      startPan();
    }
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

  // —— 素材拖放 ——
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const assetId = e.dataTransfer.getData('application/x-asset-id');
    const name = e.dataTransfer.getData('application/x-asset-name') || '新节点';
    if (!assetId) return;
    const { x, y } = worldOf(e.clientX, e.clientY);
    addNode(assetId, name, x, y);
  }

  const dragEnabled = mode === 'select';
  const cursor = mode === 'pan' ? (panning ? 'grabbing' : 'grab') : mode === 'text' ? 'text' : mode === 'connect' ? 'crosshair' : panning ? 'grabbing' : 'default';

  const editingBox = editingTextId ? texts.find((t) => t.id === editingTextId) : null;

  return (
    <div
      ref={wrapRef}
      className="canvas-wrap"
      style={{ cursor }}
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

          {/* 连线层（在节点下方）*/}
          <Layer>
            {edges.map((edge) => {
              const from = nodeById.get(edge.fromNodeId);
              const to = nodeById.get(edge.toNodeId);
              if (!from || !to) return null;
              return (
                <EdgeLine
                  key={edge.id}
                  edge={edge}
                  from={center(from)}
                  to={center(to)}
                  isSelected={edge.id === selectedEdgeId}
                  invScale={invScale}
                  onSelect={() => mode === 'select' && selectEdge(edge.id)}
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
                isSelected={n.id === selectedNodeId}
                invScale={invScale}
                draggable={dragEnabled}
                connectSource={n.id === connectFrom}
                onSelect={() => handleNodeClick(n.id)}
                onChange={(patch) => updateNode(n.id, patch)}
                registerRef={registerRef}
              />
            ))}
            {texts.map((t) => (
              <TextShape
                key={t.id}
                box={t}
                isSelected={t.id === selectedTextId}
                invScale={invScale}
                onSelect={() => mode === 'select' && selectText(t.id)}
                onChange={(patch) => updateText(t.id, patch)}
                onEdit={() => {
                  selectText(t.id);
                  setEditingTextId(t.id);
                }}
                registerRef={registerRef}
              />
            ))}
            <Transformer
              ref={trRef}
              rotateEnabled={!selectedTextId}
              rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
              anchorSize={9}
              anchorCornerRadius={5}
              anchorStroke="#8c3a2b"
              anchorFill="#f4ead0"
              borderStroke="#8c3a2b"
              borderDash={[5, 4]}
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 28 || newBox.height < 28 ? oldBox : newBox)}
            />
          </Layer>
        </Stage>
      )}

      {/* 文本编辑浮层 */}
      {editingBox && (
        <textarea
          className="text-edit-overlay"
          autoFocus
          value={editingBox.content}
          style={{
            left: editingBox.x * viewport.scale + viewport.x,
            top: editingBox.y * viewport.scale + viewport.y,
            width: editingBox.width * viewport.scale,
            height: editingBox.height * viewport.scale,
            fontSize: editingBox.fontSize * viewport.scale,
            background: editingBox.background,
          }}
          onChange={(e) => updateText(editingBox.id, { content: e.target.value })}
          onBlur={() => setEditingTextId(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditingTextId(null);
          }}
        />
      )}
    </div>
  );
}

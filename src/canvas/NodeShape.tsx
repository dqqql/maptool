import { useRef, useEffect } from 'react';
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { Asset, MapNode } from '../types';
import { useLibraryStore } from '../store/libraryStore';
import { useImage } from './useImage';

interface Props {
  node: MapNode;
  isSelected: boolean;
  invScale: number; // 1/viewport.scale，用于保持描边/文字视觉恒定
  draggable: boolean;
  connectSource: boolean; // 连线模式下作为起点高亮
  onSelect: () => void;
  onChange: (patch: Partial<MapNode>) => void;
  onHover: (hovering: boolean) => void;
  registerRef: (id: string, ref: Konva.Group | null) => void;
  readOnly?: boolean; // 只读 viewer：禁用拖拽/选中框，仅保留 hover
  resolveAsset?: (id: string) => Asset | undefined; // 自定义素材解析（viewer 用内嵌素材）
}

/**
 * 单个画布节点：手绘素材图 + 选中外框 + 名称标签。
 * 拖拽移动、缩放（由 Canvas 的 Transformer 接管）后回写坐标/尺寸。
 */
export function NodeShape({ node, isSelected, invScale, draggable, connectSource, onSelect, onChange, onHover, registerRef, readOnly, resolveAsset }: Props) {
  const groupRef = useRef<Konva.Group>(null);
  const storeGetAsset = useLibraryStore((s) => s.getAsset);
  const asset = resolveAsset ? resolveAsset(node.assetId) : storeGetAsset(node.assetId);
  const img = useImage(asset?.dataUrl ?? '');
  const selected = !readOnly && isSelected;

  useEffect(() => {
    registerRef(node.id, groupRef.current);
    return () => registerRef(node.id, null);
  }, [node.id, registerRef]);

  function handleTransformEnd() {
    const g = groupRef.current;
    if (!g) return;
    const scaleX = g.scaleX();
    const scaleY = g.scaleY();
    g.scaleX(1);
    g.scaleY(1);
    onChange({
      x: g.x(),
      y: g.y(),
      width: Math.max(28, node.width * scaleX),
      height: Math.max(28, node.height * scaleY),
      rotation: g.rotation(),
    });
  }

  const pad = 6; // 选中框外扩
  const labelFontSize = Math.min(26, Math.max(15, 15 + (Math.min(node.width, node.height) - 92) * 0.035)) * 1.5;

  return (
    <Group
      ref={groupRef}
      x={node.x}
      y={node.y}
      rotation={node.rotation}
      draggable={!readOnly && draggable}
      onMouseDown={onSelect}
      onTap={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onDragStart={() => {
        onHover(false);
        onSelect();
      }}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={handleTransformEnd}
    >
      {/* 连线起点高亮环 */}
      {!readOnly && connectSource && (
        <Rect
          x={-pad - 2}
          y={-pad - 2}
          width={node.width + (pad + 2) * 2}
          height={node.height + (pad + 2) * 2}
          stroke="#8c3a2b"
          strokeWidth={2.4 * invScale}
          dash={[3 * invScale, 3 * invScale]}
          cornerRadius={6 * invScale}
        />
      )}
      {/* 选中底色 + 手绘外框 */}
      {selected && (
        <Rect
          x={-pad}
          y={-pad}
          width={node.width + pad * 2}
          height={node.height + pad * 2}
          fill="rgba(140,58,43,0.06)"
          stroke="#8c3a2b"
          strokeWidth={1.6 * invScale}
          dash={[6 * invScale, 4 * invScale]}
          cornerRadius={4 * invScale}
        />
      )}
      {img ? (
        <KonvaImage image={img} width={node.width} height={node.height} />
      ) : (
        <Rect width={node.width} height={node.height} fill="rgba(36,26,16,0.05)" />
      )}
      {/* 名称标签 */}
      {!node.hideName && (
        <Text
          text={node.name}
          x={-pad}
          y={node.height + pad + 2}
          width={node.width + pad * 2}
          align="center"
          fontFamily="'Noto Serif SC', serif"
          fontSize={labelFontSize * invScale}
          fontStyle={selected ? 'bold' : 'normal'}
          fill={selected ? '#8c3a2b' : '#4d3c26'}
          listening={false}
        />
      )}
    </Group>
  );
}

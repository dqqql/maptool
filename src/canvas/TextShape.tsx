import { useRef, useEffect } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { TextBox } from '../types';

interface Props {
  box: TextBox;
  isSelected: boolean;
  invScale: number;
  onSelect: () => void;
  onChange: (patch: Partial<TextBox>) => void;
  onEdit: () => void;
  registerRef: (id: string, ref: Konva.Group | null) => void;
}

/** 自由文本备注框：背景纸片 + 文字，可拖拽/缩放，双击进入编辑（HTML 浮层）。 */
export function TextShape({ box, isSelected, invScale, onSelect, onChange, onEdit, registerRef }: Props) {
  const ref = useRef<Konva.Group>(null);

  useEffect(() => {
    registerRef(box.id, ref.current);
    return () => registerRef(box.id, null);
  }, [box.id, registerRef]);

  function handleTransformEnd() {
    const g = ref.current;
    if (!g) return;
    const sx = g.scaleX();
    const sy = g.scaleY();
    g.scaleX(1);
    g.scaleY(1);
    onChange({
      x: g.x(),
      y: g.y(),
      width: Math.max(80, box.width * sx),
      height: Math.max(44, box.height * sy),
    });
  }

  return (
    <Group
      ref={ref}
      x={box.x}
      y={box.y}
      draggable
      onMouseDown={onSelect}
      onTap={onSelect}
      onDragStart={onSelect}
      onDblClick={onEdit}
      onDblTap={onEdit}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={handleTransformEnd}
    >
      <Rect
        width={box.width}
        height={box.height}
        fill={box.background}
        stroke={isSelected ? '#8c3a2b' : '#b39a68'}
        strokeWidth={(isSelected ? 1.8 : 1.3) * invScale}
        cornerRadius={5}
        shadowColor="rgba(50,34,12,0.3)"
        shadowBlur={6}
        shadowOffsetY={2}
        shadowOpacity={isSelected ? 0.5 : 0.3}
        dash={isSelected ? [7 * invScale, 4 * invScale] : undefined}
      />
      <Text
        text={box.content || '双击编辑文本……'}
        x={10}
        y={9}
        width={box.width - 20}
        height={box.height - 18}
        fontFamily="'Noto Serif SC', serif"
        fontSize={box.fontSize}
        lineHeight={1.45}
        fill={box.content ? '#241a10' : '#a08a63'}
        fontStyle={box.content ? 'normal' : 'italic'}
        wrap="word"
        listening={false}
      />
    </Group>
  );
}

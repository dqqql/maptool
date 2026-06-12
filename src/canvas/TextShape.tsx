import { useRef, useEffect } from 'react';
import { Group, Line, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import { DEFAULT_TEXT_COLOR, type TextBox } from '../types';
import { layoutMarkdown, TEXT_MIN_WIDTH, textBoxHeight } from './textMarkdown';

interface Props {
  box: TextBox;
  isSelected: boolean;
  invScale: number;
  onSelect: () => void;
  onChange: (patch: Partial<TextBox>) => void;
  onEdit: () => void;
  registerRef: (id: string, ref: Konva.Group | null) => void;
  readOnly?: boolean; // 只读 viewer：禁用拖拽/编辑/选中框
}

/** 自由文本备注框：背景纸片 + 文字，可拖拽/缩放，双击进入编辑（HTML 浮层）。 */
export function TextShape({ box, isSelected, invScale, onSelect, onChange, onEdit, registerRef, readOnly }: Props) {
  const ref = useRef<Konva.Group>(null);
  const selected = !readOnly && isSelected;
  const textColor = box.color ?? DEFAULT_TEXT_COLOR;

  useEffect(() => {
    registerRef(box.id, ref.current);
    return () => registerRef(box.id, null);
  }, [box.id, registerRef]);

  function handleTransformEnd() {
    const g = ref.current;
    if (!g) return;
    const sx = g.scaleX();
    g.scaleX(1);
    g.scaleY(1);
    const width = Math.max(TEXT_MIN_WIDTH, box.width * sx);
    onChange({
      x: g.x(),
      y: g.y(),
      width,
      height: textBoxHeight(box.content, width, box.fontSize),
    });
  }

  const layout = layoutMarkdown(box.content, box.width, box.fontSize);

  return (
    <Group
      ref={ref}
      x={box.x}
      y={box.y}
      draggable={!readOnly}
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
        stroke={selected ? '#8c3a2b' : '#b39a68'}
        strokeWidth={(selected ? 1.8 : 1.3) * invScale}
        cornerRadius={5}
        shadowColor="rgba(50,34,12,0.3)"
        shadowBlur={6}
        shadowOffsetY={2}
        shadowOpacity={selected ? 0.5 : 0.3}
        dash={selected ? [7 * invScale, 4 * invScale] : undefined}
      />
      {box.content ? (
        <>
          {layout.quotes.map((quote, index) => (
            <Line
              key={`quote-${index}`}
              points={[quote.x, quote.y, quote.x, quote.y + quote.height]}
              stroke="#8c3a2b"
              strokeWidth={2}
              listening={false}
            />
          ))}
          {layout.rows.flatMap((row, rowIndex) => {
            let x = row.x;
            const nodes = [];
            if (row.prefix) {
              nodes.push(
                <Text
                  key={`prefix-${rowIndex}`}
                  text={row.prefix}
                  x={10}
                  y={row.y}
                  width={row.prefixWidth}
                  fontFamily="'Noto Serif SC', serif"
                  fontSize={row.fontSize}
                  lineHeight={1.45}
                  fill={textColor}
                  listening={false}
                />
              );
            }
            row.segments.forEach((segment, segmentIndex) => {
              nodes.push(
                <Text
                  key={`segment-${rowIndex}-${segmentIndex}`}
                  text={segment.text}
                  x={x}
                  y={row.y}
                  fontFamily="'Noto Serif SC', serif"
                  fontSize={row.fontSize}
                  fontStyle={segment.bold ? 'bold' : 'normal'}
                  lineHeight={1.45}
                  fill={textColor}
                  listening={false}
                />
              );
              x += segment.width;
            });
            return nodes;
          })}
        </>
      ) : (
        <Text
          text="双击编辑文本……"
          x={10}
          y={9}
          width={box.width - 20}
          fontFamily="'Noto Serif SC', serif"
          fontSize={box.fontSize}
          lineHeight={1.45}
          fill="#a08a63"
          fontStyle="italic"
          listening={false}
        />
      )}
    </Group>
  );
}

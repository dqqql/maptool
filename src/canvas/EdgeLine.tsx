import { Group, Line, Circle, Rect, Text } from 'react-konva';
import type { Edge } from '../types';

interface Props {
  edge: Edge;
  from: { x: number; y: number };
  to: { x: number; y: number };
  isSelected: boolean;
  invScale: number;
  onSelect: () => void;
  readOnly?: boolean; // 只读 viewer：不响应点选，鼠标穿透以便平移
}

const INK = '#3a2c1a';
const SEAL = '#8c3a2b';

/** 节点间连线：手绘墨线 + 端点 + 中点标签（名称）。随节点移动跟随。 */
export function EdgeLine({ edge, from, to, isSelected, invScale, onSelect, readOnly }: Props) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  // 轻微垂直偏移制造手绘弧度
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const bow = Math.min(len * 0.08, 26);
  const cx = mx + (-dy / len) * bow;
  const cy = my + (dx / len) * bow;

  const selected = !readOnly && isSelected;
  const color = selected ? SEAL : INK;
  const label = edge.name || edge.edgeType;

  return (
    <Group onMouseDown={onSelect} onTap={onSelect} listening={!readOnly}>
      {/* 命中区（透明粗线，便于点选）*/}
      <Line
        points={[from.x, from.y, cx, cy, to.x, to.y]}
        tension={0.5}
        stroke="transparent"
        strokeWidth={16 * invScale}
      />
      {/* 主体墨线 */}
      <Line
        points={[from.x, from.y, cx, cy, to.x, to.y]}
        tension={0.5}
        stroke={color}
        strokeWidth={(selected ? 2.6 : 1.9) * invScale}
        lineCap="round"
        dash={selected ? [8 * invScale, 5 * invScale] : undefined}
      />
      <Circle x={from.x} y={from.y} radius={3.4 * invScale} fill={color} />
      <Circle x={to.x} y={to.y} radius={3.4 * invScale} fill={color} />

      {label && (
        <Group x={cx} y={cy} listening={false}>
          <Rect
            x={-(label.length * 7 + 10) * invScale}
            y={-11 * invScale}
            width={(label.length * 14 + 20) * invScale}
            height={22 * invScale}
            fill="#f1e6cd"
            stroke={color}
            strokeWidth={1.2 * invScale}
            cornerRadius={4 * invScale}
          />
          <Text
            text={label}
            x={-(label.length * 7 + 10) * invScale}
            y={-7 * invScale}
            width={(label.length * 14 + 20) * invScale}
            align="center"
            fontFamily="'Noto Serif SC', serif"
            fontSize={13 * invScale}
            fill={color}
          />
        </Group>
      )}
    </Group>
  );
}

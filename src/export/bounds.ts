/* =========================================================================
   画布内容包围盒：遍历节点（含旋转）与文本框，求世界坐标下的整体范围。
   供「PNG · 自动范围」导出使用。
   ========================================================================= */
import type { MapNode, TextBox } from '../types';

export interface BoundsRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 节点旋转后的四角（Konva Group 绕自身原点 (x,y) 旋转 rotation 度）*/
function rotatedCorners(n: MapNode): { x: number; y: number }[] {
  const rad = (n.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const corners = [
    [0, 0],
    [n.width, 0],
    [n.width, n.height],
    [0, n.height],
  ];
  return corners.map(([px, py]) => ({
    x: n.x + px * cos - py * sin,
    y: n.y + px * sin + py * cos,
  }));
}

/**
 * 计算所有节点 + 文本框的整体包围盒（世界坐标）。空画布返回 null。
 * 名称标签在节点下方，靠导出时的 padding 兜底，这里不额外计入。
 */
export function computeContentBounds(nodes: MapNode[], texts: TextBox[]): BoundsRect | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let has = false;

  for (const n of nodes) {
    has = true;
    for (const c of rotatedCorners(n)) {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x);
      maxY = Math.max(maxY, c.y);
    }
  }
  for (const t of texts) {
    has = true;
    minX = Math.min(minX, t.x);
    minY = Math.min(minY, t.y);
    maxX = Math.max(maxX, t.x + t.width);
    maxY = Math.max(maxY, t.y + t.height);
  }

  if (!has) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

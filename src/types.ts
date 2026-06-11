/* =========================================================================
   全局领域模型
   ========================================================================= */

/** 视口（缩放 + 平移），存的是 Konva Stage 的 scale/position */
export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

/** 自定义属性控件类型 */
export type CustomPropType =
  | 'text'
  | 'checkbox'
  | 'select'
  | 'number'
  | 'rating'
  | 'progress'
  | 'textarea';

export interface CustomProp {
  id: string;
  label: string;
  type: CustomPropType;
  value: string | number | boolean;
  options?: string[];
}

/** 画布节点（由素材拖拽生成）—— 坐标为「画布世界坐标」 */
export interface MapNode {
  id: string;
  assetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  name: string;
  description: string;
  customProps: CustomProp[];
}

/** 节点间连线 */
export interface Edge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  name: string;
  edgeType: string;
  description: string;
}

/** 自由文本备注框 */
export interface TextBox {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  background: string;
  fontSize: number;
}

/** 素材（内置占位 SVG 或用户上传图片）*/
export interface Asset {
  id: string;
  name: string;
  builtin: boolean;
  kind: string; // 类别：山/河/海/森林/村庄...
  dataUrl: string;
}

/** 世界元信息（存 worlds 表）*/
export interface World {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

/** 世界画布内容（按 worldId 存 worldData 表）*/
export interface WorldData {
  worldId: string;
  nodes: MapNode[];
  edges: Edge[];
  texts: TextBox[];
  viewport: Viewport;
}

export const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, scale: 1 };

export function emptyWorldData(worldId: string): WorldData {
  return {
    worldId,
    nodes: [],
    edges: [],
    texts: [],
    viewport: { ...DEFAULT_VIEWPORT },
  };
}

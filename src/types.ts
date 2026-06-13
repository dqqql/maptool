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
  hideName?: boolean;
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
  color: string;
  /** false 时保留固定宽度，仅根据内容重新计算高度。旧数据缺省为自动宽度。 */
  autoSize?: boolean;
}

export type StoryLength = 'short' | 'medium' | 'long';

export interface GeneratedEncounter {
  type: string;
  title: string;
  hook: string;
  scene: string;
  developments: string[];
  cluesOrInteractions: string[];
  resolutions: string[];
}

export interface RandomStoryRequest {
  context: string;
  note: string;
  /** 生成组数（1-3），每组包含所选类型各一份。 */
  groups: number;
  types: string[];
  length: StoryLength;
  /** 自定义系统提示词；提供时（即使为空串）替换内置提示词，空串相当于删除。 */
  systemPrompt?: string;
}

export interface RandomStoryResponse {
  encounters: GeneratedEncounter[];
}

/** 随机故事内置系统提示词（前端展示与后端默认共用同一份）。 */
export const DEFAULT_STORY_SYSTEM_PROMPT =
  '你是富有想象力的 TRPG 游戏主持人遭遇设计助手。请生成可直接使用、具有意外感的随机故事。'
  + '用户选中的地图内容只是灵感种子和氛围参考，不是必须逐项复述或严格围绕的事实。'
  + '可以合理发散，引入地图上尚未出现的地点、人物、组织、传闻、历史与远方事件，'
  + '只需让结果仍能自然接入当前世界。多份故事应尽量采用不同的主题、冲突和转折。'
  + '输出必须是严格 JSON，并完全符合给定结构。不要复述 API Key，也不要输出推理过程。';

export const DEFAULT_TEXT_COLOR = '#241a10';

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

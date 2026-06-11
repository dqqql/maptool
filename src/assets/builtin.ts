/* =========================================================================
   内置占位素材：代码生成的黑白手绘线条 SVG。
   统一笔触：墨色描边、无填充或极淡填充、圆头线帽，贴合手绘地图志风格。
   美术后续可替换为正式素材（保持 kind 不变即可）。
   ========================================================================= */
import type { Asset } from '../types';

const INK = '#241a10';
const FILL = 'rgba(36,26,16,0.06)';

/** 把 SVG 主体包成统一画框 + dataUrl */
function svg(inner: string): string {
  const body = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(body)}`;
}

/** kind → 中文名 + 分组 + 线稿 */
interface Spec {
  kind: string;
  name: string;
  group: string;
  inner: string;
}

const SPECS: Spec[] = [
  {
    kind: 'mountain',
    name: '山岳',
    group: '地形',
    inner: `<path d="M10 78 L34 36 L48 58 L60 40 L90 78 Z" fill="${FILL}"/><path d="M30 44 L34 50 L40 44"/><path d="M56 47 L60 53 L66 46"/>`,
  },
  {
    kind: 'hill',
    name: '丘陵',
    group: '地形',
    inner: `<path d="M8 74 Q30 50 50 72 Q66 52 92 74" fill="${FILL}"/><path d="M30 70 q4 -6 8 0" stroke-width="1.6"/><path d="M58 70 q4 -6 8 0" stroke-width="1.6"/>`,
  },
  {
    kind: 'forest',
    name: '森林',
    group: '地形',
    inner: `<path d="M50 14 L66 50 L58 50 L72 78 L28 78 L42 50 L34 50 Z" fill="${FILL}"/><path d="M50 78 L50 90"/>`,
  },
  {
    kind: 'river',
    name: '河流',
    group: '水文',
    inner: `<path d="M20 14 Q44 32 30 52 Q16 72 44 86" /><path d="M30 16 Q52 34 40 54 Q28 74 54 88" stroke-width="1.6" opacity="0.6"/>`,
  },
  {
    kind: 'lake',
    name: '湖泊',
    group: '水文',
    inner: `<path d="M22 50 Q20 32 44 30 Q72 26 80 48 Q84 70 56 74 Q26 76 22 50 Z" fill="${FILL}"/><path d="M40 58 q8 5 18 0" stroke-width="1.5" opacity="0.6"/>`,
  },
  {
    kind: 'sea',
    name: '海洋',
    group: '水文',
    inner: `<path d="M12 40 q10 -10 20 0 t20 0 t20 0 t16 0" stroke-width="2"/><path d="M12 58 q10 -10 20 0 t20 0 t20 0 t16 0" stroke-width="2"/><path d="M12 76 q10 -10 20 0 t20 0 t20 0 t16 0" stroke-width="2"/>`,
  },
  {
    kind: 'road',
    name: '道路',
    group: '人文',
    inner: `<path d="M24 88 L44 12" stroke-width="2.6"/><path d="M68 88 L52 12" stroke-width="2.6"/><path d="M40 30 L56 30 M37 50 L60 50 M33 70 L64 70" stroke-width="1.6" stroke-dasharray="1 7" opacity="0.7"/>`,
  },
  {
    kind: 'village',
    name: '村庄',
    group: '聚落',
    inner: `<path d="M22 80 L22 56 L36 44 L50 56 L50 80 Z" fill="${FILL}"/><path d="M50 80 L50 62 L62 52 L74 62 L74 80 Z" fill="${FILL}"/><path d="M30 80 L30 68 L38 68 L38 80"/>`,
  },
  {
    kind: 'castle',
    name: '城堡',
    group: '聚落',
    inner: `<path d="M22 82 L22 44 L30 44 L30 36 L38 36 L38 44 L46 44 L46 36 L54 36 L54 44 L62 44 L62 82 Z" fill="${FILL}"/><path d="M38 82 L38 64 L46 64 L46 82"/><path d="M62 82 L78 82 L78 54 L70 54" /><path d="M70 54 L70 46 L76 46 L76 54"/>`,
  },
  {
    kind: 'ruin',
    name: '遗迹',
    group: '聚落',
    inner: `<path d="M24 82 L28 40 L36 40 L36 64" fill="${FILL}"/><path d="M48 82 L48 30 L56 30 L56 58"/><path d="M68 82 L66 48 L74 48 L76 70"/><path d="M20 82 L82 82"/>`,
  },
  {
    kind: 'port',
    name: '港口',
    group: '人文',
    inner: `<path d="M50 16 L50 64"/><path d="M38 28 L62 28"/><path d="M30 56 Q50 78 70 56" fill="${FILL}"/><circle cx="50" cy="20" r="4"/>`,
  },
  {
    kind: 'marker',
    name: '标记',
    group: '标记',
    inner: `<path d="M50 86 C30 60 30 40 50 18 C70 40 70 60 50 86 Z" fill="${FILL}"/><circle cx="50" cy="42" r="9"/>`,
  },
];

export const BUILTIN_GROUPS = ['地形', '水文', '聚落', '人文', '标记'] as const;

export const BUILTIN_ASSETS: Asset[] = SPECS.map((s) => ({
  id: `builtin:${s.kind}`,
  name: s.name,
  builtin: true,
  kind: s.kind,
  dataUrl: svg(s.inner),
}));

/** 分组后的内置素材，供素材库面板分类展示 */
export function builtinByGroup(): { group: string; assets: Asset[] }[] {
  return BUILTIN_GROUPS.map((group) => ({
    group,
    assets: SPECS.filter((s) => s.group === group).map(
      (s) => BUILTIN_ASSETS.find((a) => a.id === `builtin:${s.kind}`)!
    ),
  }));
}

const NAME_BY_KIND = new Map(SPECS.map((s) => [s.kind, s.name]));
export function defaultNodeName(kind: string): string {
  return NAME_BY_KIND.get(kind) ?? '新节点';
}

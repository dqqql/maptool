/* =========================================================================
   内置正式素材：代码生成的手绘线条 SVG（地图志风格）。
   统一画框 viewBox 0 0 100 100，墨色描边、圆头线帽，局部以淡彩点缀。
   四大类各 25 张，注重形态 / 色彩 / 走势差异，避免雷同。
   ========================================================================= */
import type { Asset } from '../types';
import { UNIVERSAL_ITEMS } from './universal';

/* 调色：墨为主，淡彩为辅，皆压暗以贴合羊皮纸基调 */
const INK = '#241a10';
const FILL = 'rgba(36,26,16,0.06)';
const GREEN = '#5f7a3f', GREEN_F = 'rgba(95,122,63,0.16)';
const BLUE = '#3f6280', BLUE_F = 'rgba(63,98,128,0.15)';
const RED = '#9c4632', RED_F = 'rgba(156,70,50,0.14)';
const GOLD = '#a87a2f', GOLD_F = 'rgba(168,122,47,0.16)';
const STONE = '#6b5a44', STONE_F = 'rgba(107,90,68,0.14)';
const SAND_F = 'rgba(168,122,47,0.12)';
const SNOW_F = 'rgba(255,255,255,0.55)';
const SHADE = 'rgba(36,26,16,0.45)';

/** 把 SVG 主体包成统一画框 + dataUrl（根描边为墨色，inner 可覆盖）*/
function svg(inner: string): string {
  const body = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(body)}`;
}

interface Spec {
  kind: string;
  name: string;
  group: string;
  inner: string;
}
type Item = Omit<Spec, 'group'>;
const grp = (group: string, items: Item[]): Spec[] => items.map((i) => ({ ...i, group }));

/* —— 地形自然 —— */
const TERRAIN: Item[] = [
  { kind: 'peak', name: '山岳', inner: `<path d="M12 80 L40 30 L54 52 L66 34 L90 80 Z" fill="${FILL}"/><path d="M34 42 l6 8 l8 -8"/>` },
  { kind: 'range', name: '山脉', inner: `<path d="M6 80 L26 44 L40 62 L56 38 L70 60 L84 46 L96 80 Z" fill="${STONE_F}" stroke="${STONE}"/>` },
  { kind: 'snow-mtn', name: '雪山', inner: `<path d="M14 82 L42 28 L58 50 L70 34 L88 82 Z" fill="${FILL}"/><path d="M34 41 L42 28 L49 41 L44 47 L40 42 L36 47 Z" fill="${SNOW_F}" stroke="none"/><path d="M62 44 L70 34 L77 46 L72 50 L68 45 Z" fill="${SNOW_F}" stroke="none"/>` },
  { kind: 'volcano', name: '火山', inner: `<path d="M18 82 L38 42 L62 42 L82 82 Z" fill="${FILL}"/><path d="M38 42 q12 7 24 0" stroke="${RED}"/><path d="M44 38 q-3 -12 3 -20 M52 36 q3 -10 -1 -18 M58 40 q5 -8 3 -16" stroke="${RED}" stroke-width="1.8"/>` },
  { kind: 'hill', name: '丘陵', inner: `<path d="M6 76 Q28 50 50 74 Q68 52 94 76" fill="${GREEN_F}" stroke="${GREEN}"/><path d="M28 70 q5 -7 10 0 M60 70 q5 -7 10 0" stroke-width="1.5"/>` },
  { kind: 'plateau', name: '高原', inner: `<path d="M16 80 L22 46 L78 46 L84 80 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M22 56 L78 56" stroke-width="1.4" opacity="0.6"/>` },
  { kind: 'canyon', name: '峡谷', inner: `<path d="M10 24 L34 78 L40 78 L24 24 Z" fill="${FILL}"/><path d="M90 24 L66 78 L60 78 L76 24 Z" fill="${FILL}"/><path d="M42 78 q8 6 16 0" stroke="${BLUE}" stroke-width="1.6"/>` },
  { kind: 'forest', name: '森林', inner: `<path d="M28 16 L40 46 L34 46 L46 70 L10 70 L22 46 L16 46 Z" fill="${GREEN_F}" stroke="${GREEN}"/><path d="M28 70 L28 80"/><path d="M70 28 L82 56 L76 56 L86 76 L54 76 L64 56 L58 56 Z" fill="${GREEN_F}" stroke="${GREEN}"/><path d="M70 76 L70 84"/>` },
  { kind: 'pine', name: '松林', inner: `<path d="M50 12 L60 34 L54 34 L64 52 L58 52 L70 72 L30 72 L42 52 L36 52 L46 34 L40 34 Z" fill="${GREEN_F}" stroke="${GREEN}"/><path d="M50 72 L50 84"/>` },
  { kind: 'broadleaf', name: '阔叶林', inner: `<ellipse cx="50" cy="40" rx="24" ry="18" fill="${GREEN_F}" stroke="${GREEN}"/><path d="M50 57 L50 82 M50 66 L38 56 M50 62 L62 50" stroke="${STONE}"/>` },
  { kind: 'dead-tree', name: '枯木', inner: `<path d="M50 84 L50 30"/><path d="M50 50 L34 36 M50 44 L66 32 M50 62 L40 54 M50 38 L60 26 M50 56 L62 50"/>` },
  { kind: 'grassland', name: '草原', inner: `<path d="M16 78 q-2 -16 -6 -22 M24 78 q0 -18 4 -24 M22 78 q4 -14 10 -20" stroke="${GREEN}"/><path d="M50 78 q-2 -16 -6 -22 M58 78 q0 -18 4 -24 M56 78 q4 -14 10 -20" stroke="${GREEN}"/><path d="M82 78 q-2 -14 -6 -20 M88 78 q2 -14 6 -18" stroke="${GREEN}"/>` },
  { kind: 'swamp', name: '沼泽', inner: `<path d="M14 64 q10 -8 20 0 t20 0 t20 0" stroke="${BLUE}"/><path d="M14 76 q10 -8 20 0 t20 0 t20 0" stroke="${BLUE}"/><path d="M34 64 q-2 -18 -4 -26 M42 64 q2 -18 6 -24 M68 64 q-2 -16 -4 -24" stroke="${GREEN}" stroke-width="1.8"/>` },
  { kind: 'desert', name: '荒漠', inner: `<path d="M8 70 Q34 52 56 70 Q74 56 92 70" fill="${SAND_F}" stroke="${GOLD}"/><circle cx="72" cy="32" r="9" stroke="${GOLD}"/>` },
  { kind: 'gobi', name: '戈壁', inner: `<path d="M14 78 L26 78 L30 64 L20 60 L12 70 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M40 80 L70 80 L78 62 L58 54 L42 66 Z" fill="${STONE_F}" stroke="${STONE}"/>` },
  { kind: 'dune', name: '沙丘', inner: `<path d="M10 74 Q40 40 70 60 Q82 66 90 74 Z" fill="${SAND_F}" stroke="${GOLD}"/><path d="M30 66 q14 -8 26 -2" stroke-width="1.4" opacity="0.6"/>` },
  { kind: 'cave', name: '洞穴', inner: `<path d="M14 80 Q14 40 50 38 Q86 40 86 80 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M38 80 Q38 56 50 56 Q62 56 62 80 Z" fill="${SHADE}" stroke="${INK}"/>` },
  { kind: 'rock', name: '岩石', inner: `<path d="M24 78 L18 54 L34 40 L58 38 L74 52 L70 78 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M34 40 L44 60 L70 52 M44 60 L40 78" stroke-width="1.4" opacity="0.7"/>` },
  { kind: 'cliff', name: '峭壁', inner: `<path d="M22 18 L22 82 L70 82 L70 60 L56 60 L56 40 L40 40 L40 18 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M22 36 L40 36 M22 54 L56 54 M22 70 L70 70" stroke-width="1.3" opacity="0.6"/>` },
  { kind: 'plain', name: '平原', inner: `<path d="M10 62 L90 62" stroke="${GREEN}"/><path d="M20 62 q-2 -8 -4 -12 M30 62 q1 -9 3 -12 M64 62 q-1 -8 -3 -11 M74 62 q2 -8 4 -11" stroke="${GREEN}" stroke-width="1.5"/><path d="M44 80 L50 62 L56 80" stroke-width="1.5" opacity="0.6"/>` },
  { kind: 'flower-field', name: '花田', inner: `<circle cx="28" cy="44" r="6" fill="${RED_F}" stroke="${RED}"/><path d="M28 50 L28 78" stroke="${GREEN}" stroke-width="1.6"/><circle cx="54" cy="34" r="6" fill="${GOLD_F}" stroke="${GOLD}"/><path d="M54 40 L54 78" stroke="${GREEN}" stroke-width="1.6"/><circle cx="74" cy="48" r="6" fill="${RED_F}" stroke="${RED}"/><path d="M74 54 L74 78" stroke="${GREEN}" stroke-width="1.6"/>` },
  { kind: 'bamboo', name: '竹林', inner: `<path d="M34 84 L34 18 M50 84 L50 14 M66 84 L66 20" stroke="${GREEN}"/><path d="M30 40 L38 40 M30 60 L38 60 M46 34 L54 34 M46 56 L54 56 M62 44 L70 44 M62 64 L70 64" stroke="${GREEN}" stroke-width="1.4"/><path d="M50 30 q12 -6 18 -2 M34 50 q-12 -4 -16 0" stroke="${GREEN}" stroke-width="1.3"/>` },
  { kind: 'oasis', name: '绿洲', inner: `<path d="M50 78 L52 44" stroke="${STONE}"/><path d="M52 44 q-16 -10 -24 -4 M52 44 q16 -10 24 -4 M52 44 q-8 -16 -2 -22 M52 44 q10 -14 18 -10" stroke="${GREEN}" stroke-width="1.8"/><path d="M22 82 q28 12 56 0" fill="${BLUE_F}" stroke="${BLUE}"/>` },
  { kind: 'glacier', name: '冰川', inner: `<path d="M16 80 L30 44 L46 60 L58 38 L76 64 L86 80 Z" fill="${BLUE_F}" stroke="${BLUE}"/><path d="M30 44 L38 64 M58 38 L62 62" stroke-width="1.3" opacity="0.7"/>` },
  { kind: 'hotspring', name: '温泉', inner: `<path d="M24 70 q26 16 52 0 q2 12 -26 12 q-28 0 -26 -12 Z" fill="${BLUE_F}" stroke="${BLUE}"/><path d="M40 60 q-4 -8 0 -14 q4 -6 0 -12 M56 60 q4 -8 0 -14 q-4 -6 0 -12" stroke="${RED}" stroke-width="1.6" opacity="0.7"/>` },
];

/* —— 水域交通 —— */
const WATER: Item[] = [
  { kind: 'river', name: '河流', inner: `<path d="M22 12 Q46 32 30 52 Q14 72 44 88" stroke="${BLUE}"/><path d="M34 14 Q56 34 42 54 Q30 74 56 90" stroke="${BLUE}" stroke-width="1.6" opacity="0.55"/>` },
  { kind: 'stream', name: '溪流', inner: `<path d="M30 14 q14 18 0 36 q-14 18 6 36" stroke="${BLUE}" stroke-width="1.9"/><circle cx="48" cy="32" r="3" fill="${STONE_F}" stroke="${STONE}"/><circle cx="22" cy="58" r="3" fill="${STONE_F}" stroke="${STONE}"/>` },
  { kind: 'lake', name: '湖泊', inner: `<path d="M22 50 Q20 30 46 28 Q74 24 82 48 Q86 72 56 76 Q24 78 22 50 Z" fill="${BLUE_F}" stroke="${BLUE}"/><path d="M40 58 q10 5 20 0" stroke="${BLUE}" stroke-width="1.4" opacity="0.6"/>` },
  { kind: 'sea', name: '海洋', inner: `<path d="M10 38 q10 -9 20 0 t20 0 t20 0 t14 0" stroke="${BLUE}"/><path d="M10 56 q10 -9 20 0 t20 0 t20 0 t14 0" stroke="${BLUE}"/><path d="M10 74 q10 -9 20 0 t20 0 t20 0 t14 0" stroke="${BLUE}"/>` },
  { kind: 'waterfall', name: '瀑布', inner: `<path d="M20 18 L20 50 L80 50 L80 18" stroke="${STONE}"/><path d="M30 50 L30 80 M42 50 L42 82 M54 50 L54 80 M66 50 L66 82" stroke="${BLUE}" stroke-width="1.8"/><path d="M24 84 q26 8 52 0" stroke="${BLUE}" stroke-width="1.5"/>` },
  { kind: 'pond', name: '池塘', inner: `<ellipse cx="50" cy="56" rx="30" ry="20" fill="${BLUE_F}" stroke="${BLUE}"/><circle cx="42" cy="52" r="5" fill="${GREEN_F}" stroke="${GREEN}"/><path d="M60 60 q6 -2 8 2" stroke="${GREEN}" stroke-width="1.4"/>` },
  { kind: 'island', name: '岛屿', inner: `<path d="M16 70 q34 18 68 0" stroke="${BLUE}"/><path d="M30 70 q20 -16 40 0 Z" fill="${SAND_F}" stroke="${GOLD}"/><path d="M50 58 L50 44 M50 44 q-8 -4 -12 -1 M50 44 q8 -4 12 -1" stroke="${GREEN}" stroke-width="1.6"/>` },
  { kind: 'archipelago', name: '群岛', inner: `<path d="M10 78 q40 14 80 0" stroke="${BLUE}"/><path d="M16 78 q10 -12 22 0 Z" fill="${SAND_F}" stroke="${GOLD}"/><path d="M48 78 q8 -10 18 0 Z" fill="${SAND_F}" stroke="${GOLD}"/><path d="M70 78 q6 -8 14 0 Z" fill="${SAND_F}" stroke="${GOLD}"/>` },
  { kind: 'bay', name: '海湾', inner: `<path d="M18 20 Q26 50 50 52 Q74 54 82 84" fill="${BLUE_F}" stroke="${BLUE}"/><path d="M30 30 q6 18 22 20" stroke="${BLUE}" stroke-width="1.3" opacity="0.55"/>` },
  { kind: 'marsh', name: '沼池', inner: `<path d="M16 70 q12 -8 24 0 t24 0" stroke="${BLUE}"/><path d="M28 70 l-2 -22 M48 72 l0 -26 M68 70 l2 -22" stroke="${GREEN}" stroke-width="1.8"/><path d="M26 48 l-4 -6 M48 46 l0 -7 M70 48 l4 -6" stroke="${GREEN}" stroke-width="1.6"/>` },
  { kind: 'bridge', name: '桥梁', inner: `<path d="M14 50 L86 50 M20 50 L20 64 M80 50 L80 64" stroke="${STONE}"/><path d="M14 50 L24 40 L76 40 L86 50" fill="${STONE_F}" stroke="${STONE}"/><path d="M14 74 q36 10 72 0" stroke="${BLUE}" stroke-width="1.6"/>` },
  { kind: 'arch-bridge', name: '拱桥', inner: `<path d="M12 64 L88 64 M12 64 Q12 38 36 38 M88 64 Q88 38 64 38 M36 38 Q50 30 64 38" stroke="${STONE}"/><path d="M30 64 Q50 44 70 64 Z" fill="${BLUE_F}" stroke="${BLUE}"/>` },
  { kind: 'road', name: '道路', inner: `<path d="M30 84 L46 14 M70 84 L54 14" stroke="${STONE}" stroke-width="2.6"/><path d="M50 24 L50 32 M50 44 L50 52 M50 64 L50 72" stroke="${GOLD}" stroke-width="1.6" opacity="0.7"/>` },
  { kind: 'path', name: '小径', inner: `<path d="M28 84 Q60 64 40 44 Q20 24 56 12" stroke="${STONE}" stroke-width="2.2" stroke-dasharray="2 6"/>` },
  { kind: 'highway', name: '大道', inner: `<path d="M26 84 L44 14 M74 84 L56 14" stroke="${STONE}" stroke-width="3"/><path d="M50 14 L50 84" stroke="${GOLD}" stroke-width="1.6" stroke-dasharray="3 6" opacity="0.7"/>` },
  { kind: 'ferry', name: '渡口', inner: `<path d="M16 60 L42 60 L34 72 L24 72 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M16 80 q34 10 68 0" stroke="${BLUE}"/><path d="M48 64 L84 64" stroke="${STONE}" stroke-width="1.6" stroke-dasharray="3 5" opacity="0.7"/>` },
  { kind: 'port', name: '港口', inner: `<path d="M50 18 L50 66" stroke="${INK}"/><circle cx="50" cy="20" r="5" stroke="${INK}"/><path d="M38 30 L62 30"/><path d="M30 56 Q50 80 70 56" fill="${BLUE_F}" stroke="${BLUE}"/>` },
  { kind: 'dock', name: '码头', inner: `<path d="M16 44 L70 44 L70 52 L16 52 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M28 52 L28 70 M48 52 L48 70 M68 52 L68 70" stroke="${STONE}"/><path d="M14 78 q40 8 74 0" stroke="${BLUE}" stroke-width="1.6"/>` },
  { kind: 'lighthouse', name: '灯塔', inner: `<path d="M40 80 L44 34 L56 34 L60 80 Z" fill="${FILL}"/><path d="M44 34 L40 26 L60 26 L56 34" fill="${RED_F}" stroke="${RED}"/><path d="M44 48 L56 48 M43 62 L57 62" stroke="${RED}" stroke-width="1.6"/><path d="M40 30 L24 24 M60 30 L76 24" stroke="${GOLD}" stroke-width="1.4"/>` },
  { kind: 'ship', name: '船只', inner: `<path d="M16 60 L84 60 L74 78 L26 78 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M36 60 L36 44 L64 44 L64 60"/><path d="M44 44 L44 34 L58 34" stroke="${RED}"/>` },
  { kind: 'sailboat', name: '帆船', inner: `<path d="M22 70 L78 70 L70 82 L30 82 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M50 66 L50 16"/><path d="M50 20 L50 60 L24 60 Z" fill="${SNOW_F}" stroke="${INK}"/><path d="M54 24 L54 60 L74 60 Z" fill="${RED_F}" stroke="${RED}"/>` },
  { kind: 'pass', name: '关隘', inner: `<path d="M10 80 L30 36 L44 64 L48 80 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M90 80 L70 36 L56 64 L52 80 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M44 80 L44 56 L56 56 L56 80 M44 56 L56 56" stroke="${INK}"/><path d="M40 52 L60 52 L56 44 L44 44 Z" fill="${RED_F}" stroke="${RED}"/>` },
  { kind: 'post-station', name: '驿站', inner: `<path d="M24 80 L24 50 L48 34 L72 50 L72 80 Z" fill="${FILL}"/><path d="M40 80 L40 60 L56 60 L56 80"/><path d="M24 34 L24 16 L38 22 L24 28" fill="${RED_F}" stroke="${RED}"/><path d="M24 34 L24 50" stroke="${STONE}"/>` },
  { kind: 'crossroads', name: '十字路口', inner: `<path d="M50 14 L50 86 M14 50 L86 50" stroke="${STONE}" stroke-width="3"/><path d="M60 28 L80 28 L76 23 M80 28 L76 33" stroke="${INK}" stroke-width="1.6"/>` },
  { kind: 'canal', name: '运河', inner: `<path d="M30 14 L30 86 M70 14 L70 86" stroke="${BLUE}"/><path d="M30 30 L70 30 M30 54 L70 54 M30 78 L70 78" stroke="${STONE}" stroke-width="1.6"/><path d="M40 40 q10 -6 20 0 M40 64 q10 -6 20 0" stroke="${BLUE}" stroke-width="1.3" opacity="0.6"/>` },
];

/* —— 聚落建筑 —— */
const SETTLE: Item[] = [
  { kind: 'village', name: '村庄', inner: `<path d="M20 80 L20 56 L36 44 L52 56 L52 80 Z" fill="${FILL}"/><path d="M52 80 L52 62 L64 52 L78 62 L78 80 Z" fill="${FILL}"/><path d="M28 80 L28 68 L38 68 L38 80"/>` },
  { kind: 'town', name: '城镇', inner: `<path d="M14 82 L14 60 L30 60 L30 82 M14 60 L22 50 L30 60" fill="${FILL}"/><path d="M36 82 L36 52 L54 52 L54 82 M36 52 L45 42 L54 52" fill="${FILL}"/><path d="M60 82 L60 62 L80 62 L80 82 M60 62 L70 52 L80 62" fill="${FILL}"/>` },
  { kind: 'castle', name: '城堡', inner: `<path d="M20 82 L20 44 L28 44 L28 36 L36 36 L36 44 L44 44 L44 36 L52 36 L52 44 L60 44 L60 82 Z" fill="${FILL}"/><path d="M36 82 L36 62 L44 62 L44 82"/><path d="M60 82 L80 82 L80 52 L72 52 L72 44 L78 44 L78 52" stroke="${STONE}"/>` },
  { kind: 'capital', name: '都城', inner: `<path d="M16 82 L16 50 L24 50 L24 42 L30 42 L30 50 L40 50 L40 38 L48 32 L56 38 L56 50 L66 50 L66 42 L72 42 L72 50 L84 50 L84 82 Z" fill="${FILL}"/><path d="M44 82 L44 60 L52 60 L52 82"/><path d="M48 32 L48 22 L60 26 L48 30" fill="${RED_F}" stroke="${RED}"/>` },
  { kind: 'house', name: '房屋', inner: `<path d="M26 80 L26 50 L50 32 L74 50 L74 80 Z" fill="${FILL}"/><path d="M42 80 L42 60 L58 60 L58 80"/><path d="M60 46 L60 56 L68 56 L68 46 Z" stroke-width="1.6"/>` },
  { kind: 'hut', name: '茅屋', inner: `<path d="M28 80 L32 56 L68 56 L72 80 Z" fill="${FILL}"/><path d="M24 56 Q50 28 76 56 Z" fill="${SAND_F}" stroke="${GOLD}"/><path d="M44 80 L44 64 L56 64 L56 80"/>` },
  { kind: 'tower', name: '塔楼', inner: `<path d="M38 82 L38 36 L62 36 L62 82 Z" fill="${FILL}"/><path d="M34 36 L50 22 L66 36 Z" fill="${RED_F}" stroke="${RED}"/><path d="M44 50 L56 50 M44 62 L56 62" stroke-width="1.5"/><path d="M44 82 L44 70 L56 70 L56 82"/>` },
  { kind: 'wall', name: '城墙', inner: `<path d="M12 80 L12 50 L20 50 L20 42 L28 42 L28 50 L36 50 L36 42 L44 42 L44 50 L52 50 L52 42 L60 42 L60 50 L68 50 L68 42 L76 42 L76 50 L84 50 L84 80 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M28 80 L28 64 L40 64 L40 80" stroke="${INK}"/>` },
  { kind: 'gate', name: '城门', inner: `<path d="M22 82 L22 40 L30 40 L30 32 L40 32 L40 40 L60 40 L60 32 L70 32 L70 40 L78 40 L78 82 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M40 82 L40 56 Q50 46 60 56 L60 82 Z" fill="${SHADE}" stroke="${INK}"/>` },
  { kind: 'temple', name: '神庙', inner: `<path d="M20 44 L50 22 L80 44 Z" fill="${FILL}"/><path d="M26 44 L26 76 M40 44 L40 76 M60 44 L60 76 M74 44 L74 76" stroke="${STONE}"/><path d="M20 76 L80 76 M22 50 L78 50"/>` },
  { kind: 'church', name: '教堂', inner: `<path d="M34 82 L34 44 L58 44 L58 82 Z" fill="${FILL}"/><path d="M58 82 L58 36 L72 36 L72 82"/><path d="M65 36 L65 22 M60 28 L70 28" stroke="${RED}"/><path d="M40 82 L40 62 Q46 54 52 62 L52 82 Z" stroke="${INK}"/>` },
  { kind: 'pagoda', name: '宝塔', inner: `<path d="M50 14 L50 24 M30 32 L70 32 L62 24 L38 24 Z M34 32 L34 46 M66 32 L66 46 M28 50 L72 50 L66 44 L34 44 Z M36 50 L36 64 M64 50 L64 64 M26 68 L74 68 L68 62 L32 62 Z M40 68 L40 82 L60 82 L60 68" fill="${RED_F}" stroke="${RED}"/>` },
  { kind: 'market', name: '集市', inner: `<path d="M22 80 L22 48 L78 48 L78 80 Z" fill="${FILL}"/><path d="M18 48 L26 36 L74 36 L82 48 Z" fill="${RED_F}" stroke="${RED}"/><path d="M30 48 L30 36 M42 48 L42 36 M54 48 L54 36 M66 48 L66 36" stroke="${RED}" stroke-width="1.4"/><path d="M40 80 L40 62 L60 62 L60 80"/>` },
  { kind: 'smithy', name: '铁匠铺', inner: `<path d="M26 60 L62 60 L62 66 L52 66 L50 76 L38 76 L40 66 L26 66 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M62 56 L78 40 M70 32 L84 46 L78 52 L64 38 Z" fill="${STONE_F}" stroke="${STONE}"/>` },
  { kind: 'inn', name: '旅店', inner: `<path d="M26 82 L26 52 L50 36 L74 52 L74 82 Z" fill="${FILL}"/><path d="M40 82 L40 64 L54 64 L54 82"/><path d="M58 50 L58 62 L70 62 L70 50 Z M70 52 L74 52 L74 58 L70 58" stroke="${GOLD}" stroke-width="1.6"/>` },
  { kind: 'granary', name: '谷仓', inner: `<path d="M22 80 L22 50 L46 50 L46 80 Z M22 50 L34 38 L46 50" fill="${FILL}"/><path d="M58 80 L58 46 Q58 36 70 36 Q82 36 82 46 L82 80 Z" fill="${GOLD_F}" stroke="${GOLD}"/><path d="M58 56 L82 56 M58 68 L82 68" stroke-width="1.3" opacity="0.6"/>` },
  { kind: 'windmill', name: '风车', inner: `<path d="M40 82 L44 48 L56 48 L60 82 Z" fill="${FILL}"/><path d="M50 48 L50 32 M36 18 L64 46 M36 46 L64 18" stroke="${STONE}" stroke-width="1.8"/><circle cx="50" cy="32" r="3"/>` },
  { kind: 'watermill', name: '水车', inner: `<circle cx="38" cy="52" r="20" stroke="${STONE}"/><path d="M38 32 L38 72 M18 52 L58 52 M24 38 L52 66 M24 66 L52 38" stroke="${STONE}" stroke-width="1.4"/><path d="M60 50 L78 50 L78 80 L60 80 Z" fill="${FILL}"/><path d="M16 84 q34 8 68 0" stroke="${BLUE}" stroke-width="1.6"/>` },
  { kind: 'mine', name: '矿场', inner: `<path d="M24 82 L24 52 Q24 40 46 40 Q68 40 68 52 L68 82 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M36 82 L36 58 Q46 50 56 58 L56 82 Z" fill="${SHADE}" stroke="${INK}"/><path d="M70 28 L86 44 M70 44 L86 28" stroke="${INK}" stroke-width="2"/>` },
  { kind: 'farm', name: '农田', inner: `<path d="M16 70 L84 70 L84 78 L16 78 Z M16 56 L84 56 L84 64 L16 64 Z M16 42 L84 42 L84 50 L16 50 Z" fill="${GREEN_F}" stroke="${GREEN}"/><path d="M30 42 L30 78 M50 42 L50 78 M70 42 L70 78" stroke="${GREEN}" stroke-width="1.2" opacity="0.6"/>` },
  { kind: 'graveyard', name: '墓地', inner: `<path d="M22 80 L22 54 Q22 44 32 44 Q42 44 42 54 L42 80 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M28 56 L36 56 M32 50 L32 64" stroke="${INK}" stroke-width="1.4"/><path d="M54 80 L54 50 L70 50 L70 80 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M62 44 L62 58 M56 50 L68 50" stroke="${INK}" stroke-width="1.4"/><path d="M16 80 L84 80"/>` },
  { kind: 'ruins', name: '遗迹', inner: `<path d="M24 82 L26 44 L34 44 L34 64" fill="${STONE_F}" stroke="${STONE}"/><path d="M46 82 L46 32 L54 32 L54 56" stroke="${STONE}"/><path d="M66 82 L64 50 L72 50 L74 70" stroke="${STONE}"/><path d="M18 82 L82 82"/>` },
  { kind: 'camp', name: '营地', inner: `<path d="M16 76 L34 40 L52 76 Z" fill="${FILL}"/><path d="M34 40 L34 76"/><path d="M52 76 L66 48 L80 76 Z" fill="${RED_F}" stroke="${RED}"/><path d="M66 48 L66 76" stroke="${RED}"/><path d="M12 76 L86 76"/>` },
  { kind: 'palace', name: '宫殿', inner: `<path d="M24 82 L24 54 L76 54 L76 82 Z" fill="${FILL}"/><path d="M30 54 L30 82 M50 54 L50 82 M70 54 L70 82" stroke="${GOLD}" stroke-width="1.4" opacity="0.6"/><path d="M34 54 Q34 30 50 30 Q66 30 66 54 Z" fill="${GOLD_F}" stroke="${GOLD}"/><path d="M50 30 L50 20 M46 24 L54 24" stroke="${GOLD}"/>` },
  { kind: 'watchtower', name: '瞭望塔', inner: `<path d="M36 80 L42 40 L58 40 L64 80 M40 60 L60 60 M38 70 L62 70" stroke="${STONE}"/><path d="M32 40 L68 40 L60 28 L40 28 Z" fill="${FILL}"/><path d="M50 28 L50 18 L62 22 L50 26" fill="${RED_F}" stroke="${RED}"/>` },
];

/* —— 事件标记 —— */
const EVENT: Item[] = [
  { kind: 'pin', name: '标记', inner: `<path d="M50 86 C30 60 30 40 50 18 C70 40 70 60 50 86 Z" fill="${RED_F}" stroke="${RED}"/><circle cx="50" cy="42" r="9" stroke="${RED}"/>` },
  { kind: 'flag', name: '旗帜', inner: `<path d="M34 84 L34 16" stroke="${INK}"/><path d="M34 20 L74 28 L62 38 L74 48 L34 44 Z" fill="${RED_F}" stroke="${RED}"/>` },
  { kind: 'treasure', name: '宝藏', inner: `<path d="M22 50 Q22 38 50 38 Q78 38 78 50 L78 78 L22 78 Z" fill="${GOLD_F}" stroke="${GOLD}"/><path d="M22 56 L78 56" stroke="${GOLD}"/><path d="M46 56 L46 68 L54 68 L54 56 Z M50 60 L50 64" stroke="${INK}" stroke-width="1.6"/>` },
  { kind: 'battle', name: '战斗', inner: `<path d="M26 24 L60 58 M74 24 L40 58" stroke="${INK}" stroke-width="2.4"/><path d="M58 54 L72 68 M64 60 L60 64 M42 54 L28 68 M36 60 L40 64" stroke="${INK}" stroke-width="1.8"/><path d="M22 28 L32 22 M78 28 L68 22" stroke="${GOLD}" stroke-width="2"/>` },
  { kind: 'danger', name: '危险', inner: `<path d="M30 46 Q30 24 50 24 Q70 24 70 46 Q70 58 62 62 L62 72 L38 72 L38 62 Q30 58 30 46 Z" fill="${FILL}"/><circle cx="42" cy="46" r="5" fill="${INK}" stroke="none"/><circle cx="58" cy="46" r="5" fill="${INK}" stroke="none"/><path d="M50 54 L46 62 L54 62 Z" fill="${INK}" stroke="none"/><path d="M42 72 L42 78 M50 72 L50 78 M58 72 L58 78"/>` },
  { kind: 'quest', name: '任务', inner: `<circle cx="50" cy="50" r="30" fill="${GOLD_F}" stroke="${GOLD}"/><path d="M50 30 L50 56" stroke="${GOLD}" stroke-width="4"/><circle cx="50" cy="66" r="3" fill="${GOLD}" stroke="none"/>` },
  { kind: 'mystery', name: '谜题', inner: `<circle cx="50" cy="50" r="30" fill="${FILL}"/><path d="M40 42 Q40 30 52 30 Q64 30 62 42 Q60 50 50 52 L50 60" stroke="${INK}" stroke-width="3"/><circle cx="50" cy="70" r="3" fill="${INK}" stroke="none"/>` },
  { kind: 'star', name: '星标', inner: `<path d="M50 16 L59 40 L85 40 L64 56 L72 82 L50 66 L28 82 L36 56 L15 40 L41 40 Z" fill="${GOLD_F}" stroke="${GOLD}"/>` },
  { kind: 'campfire', name: '营火', inner: `<path d="M50 60 q-14 -8 -8 -24 q6 6 8 2 q4 -10 -2 -18 q18 8 12 28 q-2 8 -10 12 Z" fill="${RED_F}" stroke="${RED}"/><path d="M26 74 L74 66 M74 74 L26 66" stroke="${STONE}" stroke-width="2.4"/>` },
  { kind: 'gem', name: '宝石', inner: `<path d="M30 38 L70 38 L84 52 L50 84 L16 52 Z" fill="${BLUE_F}" stroke="${BLUE}"/><path d="M30 38 L40 52 L16 52 M70 38 L60 52 L84 52 M40 52 L50 84 L60 52 M40 52 L60 52" stroke="${BLUE}" stroke-width="1.4"/>` },
  { kind: 'key', name: '钥匙', inner: `<circle cx="36" cy="38" r="14" stroke="${GOLD}"/><circle cx="36" cy="38" r="5" stroke="${GOLD}"/><path d="M46 48 L74 76 M66 68 L74 60 M58 60 L66 52" stroke="${GOLD}" stroke-width="2.2"/>` },
  { kind: 'shield', name: '盾牌', inner: `<path d="M50 16 L80 26 L80 50 Q80 74 50 86 Q20 74 20 50 L20 26 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M50 16 L50 86 M20 44 L80 44" stroke="${STONE}" stroke-width="1.6" opacity="0.7"/>` },
  { kind: 'bow', name: '弓箭', inner: `<path d="M30 18 Q72 50 30 82" stroke="${STONE}"/><path d="M30 18 L30 82" stroke="${STONE}" stroke-width="1.4"/><path d="M22 50 L82 50 M74 44 L82 50 L74 56 M22 50 L30 46 M22 50 L30 54" stroke="${INK}" stroke-width="1.8"/>` },
  { kind: 'magic', name: '魔法', inner: `<path d="M28 78 L66 36" stroke="${STONE}" stroke-width="2.4"/><path d="M72 20 L72 32 M66 26 L78 26" stroke="${GOLD}" stroke-width="1.8"/><path d="M44 18 L44 28 M39 23 L49 23" stroke="${GOLD}" stroke-width="1.5"/><path d="M82 50 L82 58 M78 54 L86 54" stroke="${GOLD}" stroke-width="1.5"/>` },
  { kind: 'scroll', name: '卷轴', inner: `<path d="M28 28 Q22 28 22 36 Q22 44 28 44 L72 44 Q78 44 78 36 Q78 28 72 28 Z" fill="${FILL}"/><path d="M28 44 L28 70 Q28 78 36 78 L72 78 Q66 78 66 70 L66 44" fill="${FILL}"/><path d="M36 54 L60 54 M36 62 L56 62" stroke="${INK}" stroke-width="1.4"/>` },
  { kind: 'book', name: '书籍', inner: `<path d="M22 28 L48 34 L48 80 L22 74 Z M78 28 L52 34 L52 80 L78 74 Z" fill="${FILL}"/><path d="M48 34 L52 34 M48 80 L52 80" stroke="${INK}"/><path d="M28 44 L42 47 M28 54 L42 57 M58 44 L72 41 M58 54 L72 51" stroke="${INK}" stroke-width="1.2" opacity="0.6"/>` },
  { kind: 'coin', name: '钱财', inner: `<circle cx="40" cy="44" r="16" fill="${GOLD_F}" stroke="${GOLD}"/><circle cx="60" cy="58" r="16" fill="${GOLD_F}" stroke="${GOLD}"/><path d="M40 38 L40 50 M36 41 Q40 38 44 41 M44 47 Q40 50 36 47" stroke="${GOLD}" stroke-width="1.4"/>` },
  { kind: 'trap', name: '陷阱', inner: `<path d="M20 60 L30 44 L40 60 L50 44 L60 60 L70 44 L80 60 Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M20 64 L80 64 L76 72 L24 72 Z" fill="${STONE_F}" stroke="${STONE}"/>` },
  { kind: 'crown', name: '王冠', inner: `<path d="M24 70 L20 36 L36 52 L50 30 L64 52 L80 36 L76 70 Z" fill="${GOLD_F}" stroke="${GOLD}"/><path d="M24 70 L76 70" stroke="${GOLD}"/><circle cx="20" cy="34" r="3" fill="${RED_F}" stroke="${RED}"/><circle cx="80" cy="34" r="3" fill="${RED_F}" stroke="${RED}"/><circle cx="50" cy="28" r="3" fill="${RED_F}" stroke="${RED}"/>` },
  { kind: 'heart', name: '生命', inner: `<path d="M50 80 C20 56 22 30 40 30 Q50 30 50 42 Q50 30 60 30 C78 30 80 56 50 80 Z" fill="${RED_F}" stroke="${RED}"/>` },
  { kind: 'potion', name: '药水', inner: `<path d="M42 22 L58 22 M44 22 L44 38 L32 62 Q28 78 50 78 Q72 78 68 62 L56 38 L56 22" fill="${GREEN_F}" stroke="${GREEN}"/><path d="M34 58 Q50 50 66 58" stroke="${GREEN}" stroke-width="1.4"/><circle cx="44" cy="66" r="2.5" fill="${GREEN}" stroke="none"/><circle cx="56" cy="70" r="2" fill="${GREEN}" stroke="none"/>` },
  { kind: 'anchor', name: '锚', inner: `<circle cx="50" cy="22" r="7" stroke="${BLUE}"/><path d="M50 29 L50 80 M34 44 L66 44" stroke="${BLUE}"/><path d="M24 60 Q26 80 50 80 Q74 80 76 60 M24 60 L18 64 M24 60 L30 66 M76 60 L82 64 M76 60 L70 66" stroke="${BLUE}"/>` },
  { kind: 'compass', name: '罗盘', inner: `<circle cx="50" cy="50" r="32" fill="${FILL}"/><path d="M50 26 L58 50 L50 74 L42 50 Z" fill="${RED_F}" stroke="${RED}"/><circle cx="50" cy="50" r="3" fill="${INK}" stroke="none"/><path d="M50 18 L50 24 M50 76 L50 82 M18 50 L24 50 M76 50 L82 50" stroke-width="1.6"/>` },
  { kind: 'eye', name: '瞭望', inner: `<path d="M18 50 Q50 26 82 50 Q50 74 18 50 Z" fill="${FILL}"/><circle cx="50" cy="50" r="11" stroke="${INK}"/><circle cx="50" cy="50" r="4" fill="${INK}" stroke="none"/>` },
  { kind: 'boss', name: '强敌', inner: `<path d="M28 50 Q22 30 36 26 Q34 16 44 22 M72 50 Q78 30 64 26 Q66 16 56 22" stroke="${RED}" stroke-width="1.8"/><path d="M32 50 Q32 28 50 28 Q68 28 68 50 Q68 60 60 64 L60 72 L40 72 L40 64 Q32 60 32 50 Z" fill="${RED_F}" stroke="${RED}"/><circle cx="42" cy="48" r="5" fill="${RED}" stroke="none"/><circle cx="58" cy="48" r="5" fill="${RED}" stroke="none"/><path d="M50 56 L46 64 L54 64 Z" fill="${RED}" stroke="none"/>` },
];

const SPECS: Spec[] = [
  ...grp('地形自然', TERRAIN),
  ...grp('水域交通', WATER),
  ...grp('聚落建筑', SETTLE),
  ...grp('事件标记', EVENT),
  ...grp('通用组件', UNIVERSAL_ITEMS),
];

export const BUILTIN_GROUPS = ['地形自然', '水域交通', '聚落建筑', '事件标记', '通用组件'] as const;

export const BUILTIN_ASSETS: Asset[] = SPECS.map((s) => ({
  id: `builtin:${s.kind}`,
  name: s.name,
  builtin: true,
  kind: s.kind,
  dataUrl: svg(s.inner),
}));

/** 分组后的内置素材，供素材库面板分类展示 */
export function builtinByGroup(): { group: string; assets: Asset[] }[] {
  const byId = new Map(BUILTIN_ASSETS.map((a) => [a.id, a]));
  return BUILTIN_GROUPS.map((group) => ({
    group,
    assets: SPECS.filter((s) => s.group === group).map((s) => byId.get(`builtin:${s.kind}`)!),
  }));
}

const NAME_BY_KIND = new Map(SPECS.map((s) => [s.kind, s.name]));
export function defaultNodeName(kind: string): string {
  return NAME_BY_KIND.get(kind) ?? '新节点';
}

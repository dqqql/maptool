/* =========================================================================
   通用组件（积木式拼搭件）：可在标记之间铺路、围墙、接管线，或组合出
   各类场景。覆盖通用 / 奇幻 / 科幻 / 恐怖等风格，供用户自由发挥。
   可拼接段统一让笔触抵达画框边缘中点（x=50 或 y=50），相邻摆放即可衔接。
   ========================================================================= */

const INK = '#241a10';
const FILL = 'rgba(36,26,16,0.06)';
const STONE = '#6b5a44', STONE_F = 'rgba(107,90,68,0.16)';
const GREEN = '#5f7a3f', GREEN_F = 'rgba(95,122,63,0.18)';
const BLUE = '#3f6280', BLUE_F = 'rgba(63,98,128,0.18)';
const RED = '#9c4632', RED_F = 'rgba(156,70,50,0.16)';
const GOLD = '#a87a2f', GOLD_F = 'rgba(168,122,47,0.18)';
const STEEL = '#5a6a72', STEEL_F = 'rgba(90,106,114,0.18)';
const CYAN = '#2f7c80';
const PURP = '#6a4a78', PURP_F = 'rgba(106,74,120,0.20)';
const BONE = '#9a8a6a';
const SAND_F = 'rgba(168,122,47,0.16)';
const SHADE = 'rgba(36,26,16,0.45)';
const ROAD = '#c9b48c';

export interface UItem {
  kind: string;
  name: string;
  inner: string;
}

/* —— 可拼接段：方向工具 —— */
type Dir = 'N' | 'S' | 'E' | 'W';
const EDGE: Record<Dir, [number, number]> = { N: [50, 0], S: [50, 100], E: [100, 50], W: [0, 50] };
const dStr = (vertical: boolean) => (vertical ? 'M50 0L50 100' : 'M0 50L100 50');
const dCorner = (a: Dir, b: Dir) => `M${EDGE[a][0]} ${EDGE[a][1]}Q50 50 ${EDGE[b][0]} ${EDGE[b][1]}`;
const dStub = (d: Dir) => `M${EDGE[d][0]} ${EDGE[d][1]}L50 50`;
const dT = (dirs: Dir[]) => dirs.map(dStub).join('');
const DCROSS = 'M50 0L50 100M0 50L100 50';
const P = (d: string, stroke: string, w: number, dash?: string) =>
  `<path d="${d}" stroke="${stroke}" stroke-width="${w}" fill="none"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;

/* 各类拼接段的“横截面”渲染（吃同一条路径 d，叠加描边形成质感）*/
const rRoad = (d: string) => P(d, STONE, 20) + P(d, ROAD, 14) + P(d, '#8a7350', 2, '5 9');
const rDirt = (d: string) => P(d, '#7a5a32', 12, '11 8');
const rCobble = (d: string) => P(d, STONE, 16) + P(d, '#463726', 16, '1.5 7');
const rRiver = (d: string) => P(d, BLUE, 15) + P(d, '#7fa1ba', 5);
const rStream = (d: string) => P(d, BLUE, 6) + P(d, BLUE, 2, '3 6');
const rPipe = (d: string) => P(d, STEEL, 14) + P(d, '#9aa8ae', 7);
const rConduit = (d: string) => P(d, STEEL, 10) + P(d, CYAN, 4, '2 5');
const rWall = (d: string) => P(d, STONE, 12) + P(d, '#463726', 12, '1 9');
const rHedge = (d: string) => P(d, GREEN, 16) + P(d, '#7a9456', 16, '1 6');
const rFence = (d: string) => P(d, '#7a5a32', 2.2) + P(d, '#5a4326', 7, '2 12');

/** 为某渲染函数生成「直·横 / 直·竖 / 四向弯 / 三岔 / 十字 / 尽头」变体 */
function family(prefix: string, base: string, r: (d: string) => string, variants: string): UItem[] {
  const set = new Set(variants.split(''));
  const out: UItem[] = [];
  const add = (k: string, n: string, d: string, extra = '') => out.push({ kind: `${prefix}-${k}`, name: `${base}·${n}`, inner: r(d) + extra });
  if (set.has('v')) add('v', '竖', dStr(true));
  if (set.has('h')) add('h', '横', dStr(false));
  if (set.has('1')) add('ne', '右上弯', dCorner('N', 'E'));
  if (set.has('2')) add('nw', '左上弯', dCorner('N', 'W'));
  if (set.has('3')) add('se', '右下弯', dCorner('S', 'E'));
  if (set.has('4')) add('sw', '左下弯', dCorner('S', 'W'));
  if (set.has('t')) add('t', '三岔', dT(['N', 'S', 'E']));
  if (set.has('x')) add('x', '十字', DCROSS);
  if (set.has('e')) add('end', '尽头', dStub('S'));
  return out;
}

const CONNECT: UItem[] = [
  ...family('u-road', '石板路', rRoad, 'vh1234txe'),
  ...family('u-dirt', '土路', rDirt, 'vh14x'),
  ...family('u-cobble', '碎石路', rCobble, 'vh1x'),
  ...family('u-river', '河道', rRiver, 'vh1234tx'),
  { kind: 'u-river-source', name: '河道·源头', inner: rRiver(dStub('S')) + `<circle cx="50" cy="50" r="10" fill="${BLUE_F}" stroke="${BLUE}" stroke-width="2.4"/>` },
  { kind: 'u-river-mouth', name: '河道·河口', inner: rRiver(dStub('N')) + `<path d="M26 100 L50 58 L74 100" fill="${BLUE_F}" stroke="${BLUE}" stroke-width="2.4"/>` },
  ...family('u-stream', '溪流', rStream, 'vh1x'),
  ...family('u-pipe', '管道', rPipe, 'vh1x'),
  { kind: 'u-pipe-valve', name: '管道·阀门', inner: rPipe(dStr(false)) + `<circle cx="50" cy="50" r="11" fill="${STEEL_F}" stroke="${INK}" stroke-width="2.4"/><path d="M50 39V61M39 50H61" stroke="${INK}" stroke-width="2.4"/>` },
  ...family('u-conduit', '能量导管', rConduit, 'vh1x'),
  ...family('u-wall', '城墙', rWall, 'vh1234tx'),
  { kind: 'u-wall-door', name: '城墙·门', inner: P('M0 50H34', STONE, 12) + P('M66 50H100', STONE, 12) + `<path d="M34 56 A20 20 0 0 1 54 36" stroke="${RED}" stroke-width="2.4" fill="none"/><path d="M34 44V56" stroke="${INK}" stroke-width="3"/>` },
  { kind: 'u-wall-window', name: '城墙·窗', inner: rWall(dStr(false)) + `<rect x="40" y="42" width="20" height="16" fill="${BLUE_F}" stroke="${INK}" stroke-width="2.2"/><path d="M50 42V58" stroke="${INK}" stroke-width="1.6"/>` },
  { kind: 'u-wall-slit', name: '城墙·箭孔', inner: rWall(dStr(false)) + `<path d="M50 41V59" stroke="${SHADE}" stroke-width="4"/>` },
  { kind: 'u-wall-ruin', name: '城墙·残垣', inner: P('M0 50H20', STONE, 12) + P('M32 50H50', STONE, 12) + P('M64 50H80', STONE, 12) + P('M90 50H100', STONE, 12) + `<path d="M24 58 L28 48 L34 56 Z" fill="${STONE_F}" stroke="${STONE}" stroke-width="1.6"/>` },
  { kind: 'u-wall-end', name: '城墙·端柱', inner: rWall(dStub('S')) + `<rect x="40" y="40" width="20" height="20" fill="${STONE_F}" stroke="${INK}" stroke-width="2.4"/>` },
  ...family('u-fence', '木栅栏', rFence, 'vh1'),
  { kind: 'u-fence-gate', name: '木栅栏·门', inner: P('M0 50H32', '#7a5a32', 2.2) + P('M0 50H32', '#5a4326', 7, '2 12') + P('M68 50H100', '#7a5a32', 2.2) + P('M68 50H100', '#5a4326', 7, '2 12') + `<path d="M34 42 L62 58 M34 58 L62 42" stroke="#7a5a32" stroke-width="2.2"/>` },
  ...family('u-hedge', '树篱', rHedge, 'vh1'),
];

/* —— 填充地块（满幅纹理，可铺成片）—— */
const tile = (fill: string, marks: string) => `<rect x="0" y="0" width="100" height="100" fill="${fill}" stroke="none"/>${marks}`;
const TILES: UItem[] = [
  { kind: 'u-tile-grass', name: '草地块', inner: tile(GREEN_F, `<path d="M22 70q-2-10-5-15M40 80q0-12 3-18M62 66q2-10 6-14M78 82q-1-11 2-16M30 40q-2-9 2-13" stroke="${GREEN}" stroke-width="2"/>`) },
  { kind: 'u-tile-forest', name: '林地块', inner: tile(GREEN_F, `<path d="M26 40l8 16h-5l9 14H21l9-14h-5z" fill="${GREEN_F}" stroke="${GREEN}" stroke-width="2"/><path d="M70 24l8 16h-5l9 14H62l9-14h-5z" fill="${GREEN_F}" stroke="${GREEN}" stroke-width="2"/><path d="M48 60l7 14h-4l8 12H45l8-12h-4z" fill="${GREEN_F}" stroke="${GREEN}" stroke-width="2"/>`) },
  { kind: 'u-tile-mountain', name: '山地块', inner: tile(STONE_F, `<path d="M14 70l16-26 12 18 10-14 18 22M58 56l10-12 16 24" fill="none" stroke="${STONE}" stroke-width="2.4"/>`) },
  { kind: 'u-tile-water', name: '水面块', inner: tile(BLUE_F, `<path d="M10 30q10-7 20 0t20 0 20 0 20 0M10 52q10-7 20 0t20 0 20 0 20 0M10 74q10-7 20 0t20 0 20 0 20 0" stroke="${BLUE}" stroke-width="2"/>`) },
  { kind: 'u-tile-swamp', name: '沼泽块', inner: tile('rgba(80,100,70,0.18)', `<path d="M16 60q12-6 24 0t24 0M16 76q12-6 24 0t24 0" stroke="${BLUE}" stroke-width="1.8"/><path d="M30 60l-2-18M52 62l0-20M74 60l2-16" stroke="${GREEN}" stroke-width="2"/>`) },
  { kind: 'u-tile-sand', name: '沙地块', inner: tile(SAND_F, `<path d="M12 40q14-7 28 0t28 0 20 0M16 64q14-7 28 0t28 0M10 84q14-7 28 0t28 0 18 0" stroke="${GOLD}" stroke-width="1.8" opacity="0.7"/>`) },
  { kind: 'u-tile-snow', name: '雪地块', inner: tile('rgba(255,255,255,0.5)', `<path d="M30 30l4 4 4-4M62 24l4 4 4-4M44 58l4 4 4-4M72 64l4 4 4-4M22 70l4 4 4-4" stroke="${STONE}" stroke-width="1.8" opacity="0.6"/>`) },
  { kind: 'u-tile-rubble', name: '碎石块', inner: tile(STONE_F, `<path d="M22 30l10-4 6 8-8 6-10-3z" fill="none" stroke="${STONE}" stroke-width="2"/><path d="M58 58l12-3 5 9-9 7-11-4z" fill="none" stroke="${STONE}" stroke-width="2"/><path d="M30 70l9 2-2 8-8-1z" fill="none" stroke="${STONE}" stroke-width="1.8"/>`) },
  { kind: 'u-tile-lava', name: '熔岩块', inner: tile(RED_F, `<path d="M0 30q26-10 50 0t50 0M0 56q26-10 50 0t50 0M0 82q26-10 50 0t50 0" stroke="${RED}" stroke-width="2.4"/><path d="M28 30v26M68 56v26" stroke="${GOLD}" stroke-width="1.8"/>`) },
  { kind: 'u-tile-farm', name: '农田块', inner: tile(GREEN_F, `<path d="M14 22v62M30 22v62M46 22v62M62 22v62M78 22v62" stroke="${GREEN}" stroke-width="2.2"/><path d="M8 22h84M8 84h84" stroke="${STONE}" stroke-width="2"/>`) },
  { kind: 'u-tile-cave', name: '洞窟地块', inner: tile('rgba(36,26,16,0.22)', `<circle cx="30" cy="34" r="2" fill="${INK}"/><circle cx="64" cy="28" r="2.4" fill="${INK}"/><circle cx="46" cy="58" r="2" fill="${INK}"/><circle cx="74" cy="66" r="2.6" fill="${INK}"/><circle cx="24" cy="74" r="2" fill="${INK}"/>`) },
  { kind: 'u-tile-void', name: '虚空块', inner: tile('rgba(30,24,40,0.45)', `<path d="M30 30l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="rgba(255,255,255,0.6)" stroke="none"/><path d="M68 62l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="rgba(255,255,255,0.5)" stroke="none"/><circle cx="60" cy="32" r="1.6" fill="rgba(255,255,255,0.6)"/><circle cx="34" cy="70" r="1.6" fill="rgba(255,255,255,0.6)"/>`) },
  { kind: 'u-tile-crack', name: '裂地块', inner: tile('rgba(168,140,100,0.14)', `<path d="M0 40l24 8 14-10 22 12 16-8 24 6M30 0l4 30-10 20 8 24-6 26" stroke="${STONE}" stroke-width="2"/>`) },
  { kind: 'u-tile-cobblestone', name: '鹅卵石块', inner: tile(STONE_F, `<circle cx="26" cy="28" r="9" fill="none" stroke="${STONE}" stroke-width="2"/><circle cx="54" cy="34" r="10" fill="none" stroke="${STONE}" stroke-width="2"/><circle cx="76" cy="26" r="8" fill="none" stroke="${STONE}" stroke-width="2"/><circle cx="34" cy="58" r="10" fill="none" stroke="${STONE}" stroke-width="2"/><circle cx="62" cy="62" r="9" fill="none" stroke="${STONE}" stroke-width="2"/><circle cx="44" cy="82" r="9" fill="none" stroke="${STONE}" stroke-width="2"/><circle cx="80" cy="80" r="8" fill="none" stroke="${STONE}" stroke-width="2"/>`) },
  { kind: 'u-tile-moss', name: '苔藓块', inner: tile('rgba(95,122,63,0.20)', `<circle cx="28" cy="32" r="4" fill="none" stroke="${GREEN}" stroke-width="1.8"/><circle cx="62" cy="40" r="5" fill="none" stroke="${GREEN}" stroke-width="1.8"/><circle cx="44" cy="66" r="4" fill="none" stroke="${GREEN}" stroke-width="1.8"/><circle cx="74" cy="70" r="4.5" fill="none" stroke="${GREEN}" stroke-width="1.8"/>`) },
  { kind: 'u-tile-brick', name: '砖石地块', inner: tile(STONE_F, `<path d="M0 33h100M0 67h100" stroke="${STONE}" stroke-width="2"/><path d="M33 0v33M67 0v33M16 33v34M50 33v34M84 33v34M33 67v33M67 67v33" stroke="${STONE}" stroke-width="2"/>`) },
  { kind: 'u-tile-wood', name: '木板地块', inner: tile('rgba(122,90,50,0.16)', `<path d="M0 25h100M0 50h100M0 75h100" stroke="#7a5a32" stroke-width="2"/><path d="M40 0v25M70 25v25M30 50v25M64 75v25" stroke="#7a5a32" stroke-width="1.6"/>`) },
  { kind: 'u-tile-checker', name: '棋格地块', inner: tile('none', `<rect x="0" y="0" width="33" height="33" fill="${STONE_F}"/><rect x="67" y="0" width="33" height="33" fill="${STONE_F}"/><rect x="33" y="33" width="34" height="34" fill="${STONE_F}"/><rect x="0" y="67" width="33" height="33" fill="${STONE_F}"/><rect x="67" y="67" width="33" height="33" fill="${STONE_F}"/>`) },
  { kind: 'u-tile-metal', name: '金属板块', inner: tile(STEEL_F, `<path d="M8 8h84v84H8z" fill="none" stroke="${STEEL}" stroke-width="2"/><path d="M0 50h100M50 0v100" stroke="${STEEL}" stroke-width="1.4" opacity="0.6"/><circle cx="16" cy="16" r="2" fill="${STEEL}"/><circle cx="84" cy="16" r="2" fill="${STEEL}"/><circle cx="16" cy="84" r="2" fill="${STEEL}"/><circle cx="84" cy="84" r="2" fill="${STEEL}"/>`) },
  { kind: 'u-tile-grate', name: '格栅地块', inner: tile(STEEL_F, `<path d="M20 0v100M40 0v100M60 0v100M80 0v100M0 20h100M0 40h100M0 60h100M0 80h100" stroke="${STEEL}" stroke-width="1.8"/>`) },
];

/* —— 独立道具 —— */
const PROPS: UItem[] = [
  /* 结构 / 物件 */
  { kind: 'u-bridge', name: '桥段', inner: `<path d="M8 38H92M8 62H92" stroke="${STONE}" stroke-width="2.6"/><path d="M18 38V62M34 38V62M50 38V62M66 38V62M82 38V62" stroke="${STONE}" stroke-width="2"/>` },
  { kind: 'u-stairs', name: '楼梯', inner: `<path d="M30 18H70V82H30Z" fill="${FILL}"/><path d="M30 30H70M30 42H70M30 54H70M30 66H70" stroke="${INK}" stroke-width="2"/><path d="M44 18 L40 12 H60 L56 18" stroke="${STONE}"/>` },
  { kind: 'u-spiral-stairs', name: '螺旋梯', inner: `<circle cx="50" cy="50" r="30" fill="${FILL}"/><circle cx="50" cy="50" r="7" fill="${STONE_F}" stroke="${INK}"/><path d="M50 50L50 20M50 50L78 58M50 50L34 76M50 50L24 38M50 50L70 26" stroke="${INK}" stroke-width="2"/>` },
  { kind: 'u-arch', name: '拱门', inner: `<path d="M22 84V46Q22 22 50 22Q78 22 78 46V84" fill="none" stroke="${STONE}" stroke-width="3"/><path d="M30 84V48Q30 30 50 30Q70 30 70 48V84" fill="${SHADE}" stroke="${INK}" stroke-width="2"/>` },
  { kind: 'u-pillar', name: '立柱', inner: `<path d="M38 30H62V74H38Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M32 30H68L64 22H36Z M32 74H68L64 82H36Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M44 30V74M56 30V74" stroke="${STONE}" stroke-width="1.4" opacity="0.6"/>` },
  { kind: 'u-well', name: '水井', inner: `<circle cx="50" cy="58" r="22" fill="${STONE_F}" stroke="${STONE}"/><circle cx="50" cy="58" r="12" fill="${BLUE_F}" stroke="${BLUE}"/><path d="M24 36H76M50 36V16M40 22H60" stroke="${STONE}"/>` },
  { kind: 'u-fountain', name: '喷泉', inner: `<circle cx="50" cy="62" r="26" fill="${BLUE_F}" stroke="${BLUE}"/><circle cx="50" cy="62" r="8" fill="${STONE_F}" stroke="${STONE}"/><path d="M50 54V30M50 30q-10 4-12 14M50 30q10 4 12 14" stroke="${BLUE}" stroke-width="1.8"/>` },
  { kind: 'u-statue', name: '雕像', inner: `<path d="M40 84H60V74H40Z" fill="${STONE_F}" stroke="${STONE}"/><circle cx="50" cy="30" r="8" fill="${STONE_F}" stroke="${STONE}"/><path d="M42 40Q50 36 58 40L60 70H40Z" fill="${STONE_F}" stroke="${STONE}"/>` },
  { kind: 'u-obelisk', name: '方尖碑', inner: `<path d="M44 80L46 24L50 16L54 24L56 80Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M50 36V60M44 48H56" stroke="${GOLD}" stroke-width="1.6"/>` },
  { kind: 'u-signpost', name: '路牌', inner: `<path d="M50 84V24" stroke="${STONE}" stroke-width="3"/><path d="M50 32H78L84 40L78 48H50Z" fill="${FILL}" stroke="${INK}"/><path d="M50 54H26L20 62L26 70H50Z" fill="${FILL}" stroke="${INK}"/>` },
  { kind: 'u-milestone', name: '界碑', inner: `<path d="M34 82V46Q34 34 50 34Q66 34 66 46V82Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M42 52H58M42 62H58M42 72H54" stroke="${INK}" stroke-width="1.6"/>` },
  { kind: 'u-lamppost', name: '路灯', inner: `<path d="M50 84V32" stroke="${INK}" stroke-width="3"/><path d="M38 32H62L58 20H42Z" fill="${GOLD_F}" stroke="${GOLD}"/><path d="M50 84H62" stroke="${INK}"/><circle cx="50" cy="26" r="3" fill="${GOLD}" stroke="none"/>` },
  { kind: 'u-torch', name: '火把', inner: `<path d="M48 84L46 44H54L52 84Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M50 44q-12-6-7-22q5 5 7 1q3-9-2-15q14 7 9 24q-2 8-7 12Z" fill="${RED_F}" stroke="${RED}"/>` },
  { kind: 'u-gate', name: '大门', inner: `<path d="M18 82V34H82V82Z" fill="${FILL}" stroke="${STONE}"/><path d="M50 34V82" stroke="${STONE}" stroke-width="2.4"/><path d="M30 50V66M70 50V66" stroke="${INK}" stroke-width="1.6"/><path d="M14 34H86L78 22H22Z" fill="${STONE_F}" stroke="${STONE}"/>` },
  { kind: 'u-portcullis', name: '吊闸', inner: `<path d="M22 22H78V78H22Z" fill="none" stroke="${STONE}"/><path d="M34 22V78M50 22V78M66 22V78M22 40H78M22 58H78" stroke="${STONE}" stroke-width="2"/><path d="M34 78l-4 8M50 78v8M66 78l4 8" stroke="${INK}" stroke-width="2"/>` },
  { kind: 'u-barrel', name: '木桶', inner: `<path d="M32 28Q24 50 32 72H68Q76 50 68 28Z" fill="${FILL}" stroke="${STONE}"/><ellipse cx="50" cy="28" rx="18" ry="5" fill="${STONE_F}" stroke="${STONE}"/><path d="M28 42H72M28 58H72" stroke="${STONE}" stroke-width="1.6"/>` },
  { kind: 'u-crate', name: '板条箱', inner: `<path d="M24 30H76V78H24Z" fill="${FILL}" stroke="${STONE}"/><path d="M24 30L76 78M76 30L24 78M24 30H76V78H24Z" stroke="${STONE}" stroke-width="1.6"/>` },
  { kind: 'u-sack', name: '麻袋', inner: `<path d="M36 36Q30 78 50 80Q70 78 64 36L58 28H42Z" fill="${SAND_F}" stroke="${GOLD}"/><path d="M40 30L42 22M60 30L58 22M42 22q8-4 16 0" stroke="${STONE}" stroke-width="1.8"/>` },
  { kind: 'u-cart', name: '货车', inner: `<path d="M20 40H72L66 62H26Z" fill="${FILL}" stroke="${STONE}"/><path d="M72 52H84" stroke="${STONE}"/><circle cx="34" cy="72" r="8" fill="none" stroke="${INK}"/><circle cx="58" cy="72" r="8" fill="none" stroke="${INK}"/>` },
  { kind: 'u-ladder', name: '梯子', inner: `<path d="M38 16V84M62 16V84" stroke="${STONE}" stroke-width="2.6"/><path d="M38 28H62M38 42H62M38 56H62M38 70H62" stroke="${STONE}" stroke-width="2"/>` },
  { kind: 'u-tent', name: '帐篷', inner: `<path d="M16 78L50 24L84 78Z" fill="${FILL}" stroke="${STONE}"/><path d="M50 24V78M40 78Q50 56 60 78" stroke="${STONE}"/>` },
  { kind: 'u-firepit', name: '篝火堆', inner: `<ellipse cx="50" cy="68" rx="26" ry="10" fill="none" stroke="${STONE}"/><path d="M50 60q-10-6-6-20q4 4 6 1q3-7-1-13q12 6 8 22q-2 6-7 10Z" fill="${RED_F}" stroke="${RED}"/><path d="M30 70l40-6M70 70l-40-6" stroke="${STONE}" stroke-width="2"/>` },
  { kind: 'u-flagpole', name: '旗杆', inner: `<path d="M40 84V16" stroke="${INK}" stroke-width="3"/><path d="M40 20H74L66 32L74 44H40Z" fill="${RED_F}" stroke="${RED}"/><path d="M30 84H50" stroke="${INK}"/>` },
  { kind: 'u-banner', name: '横幅', inner: `<path d="M26 20H74" stroke="${STONE}" stroke-width="2.6"/><path d="M34 22V74L42 66L50 74L58 66L66 74V22Z" fill="${RED_F}" stroke="${RED}"/><circle cx="50" cy="44" r="7" fill="none" stroke="${GOLD}" stroke-width="1.8"/>` },

  /* 自然 */
  { kind: 'u-tree', name: '落叶树', inner: `<ellipse cx="50" cy="40" rx="22" ry="20" fill="${GREEN_F}" stroke="${GREEN}"/><path d="M50 58V84M50 70L38 60M50 64L62 54" stroke="${STONE}"/>` },
  { kind: 'u-pine2', name: '松树', inner: `<path d="M50 14L62 40H56L66 60H58L68 78H32L42 60H34L44 40H38Z" fill="${GREEN_F}" stroke="${GREEN}"/><path d="M50 78V88" stroke="${STONE}"/>` },
  { kind: 'u-deadtree', name: '枯树', inner: `<path d="M50 86V30M50 52L34 38M50 46L66 34M50 64L40 56M50 40L60 28" stroke="${STONE}" stroke-width="2.6"/>` },
  { kind: 'u-bush', name: '灌木', inner: `<path d="M24 70Q16 52 32 50Q34 36 50 42Q66 34 70 50Q86 52 76 70Z" fill="${GREEN_F}" stroke="${GREEN}"/>` },
  { kind: 'u-boulder', name: '巨石', inner: `<path d="M22 78L16 52L36 36L62 36L80 54L74 78Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M36 36L46 58L74 54" stroke="${STONE}" stroke-width="1.6" opacity="0.7"/>` },
  { kind: 'u-rockpile', name: '岩堆', inner: `<path d="M18 80L26 60L40 64L36 80Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M42 80L52 56L70 62L66 80Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M30 56L40 46L52 54" fill="${STONE_F}" stroke="${STONE}"/>` },
  { kind: 'u-log', name: '倒木', inner: `<path d="M14 46H78Q90 46 90 58Q90 70 78 70H14Z" fill="${FILL}" stroke="${STONE}"/><ellipse cx="14" cy="58" rx="6" ry="12" fill="${STONE_F}" stroke="${STONE}"/><circle cx="14" cy="58" r="4" fill="none" stroke="${STONE}" stroke-width="1.4"/>` },
  { kind: 'u-stump', name: '树桩', inner: `<ellipse cx="50" cy="46" rx="24" ry="12" fill="${STONE_F}" stroke="${STONE}"/><path d="M26 46V70Q26 80 50 80Q74 80 74 70V46" fill="${FILL}" stroke="${STONE}"/><ellipse cx="50" cy="46" rx="14" ry="7" fill="none" stroke="${STONE}" stroke-width="1.4"/>` },
  { kind: 'u-mushrooms', name: '蘑菇丛', inner: `<path d="M30 70V54" stroke="${STONE}" stroke-width="3"/><path d="M18 54Q30 40 42 54Z" fill="${RED_F}" stroke="${RED}"/><path d="M58 74V60" stroke="${STONE}" stroke-width="2.4"/><path d="M48 60Q58 48 68 60Z" fill="${RED_F}" stroke="${RED}"/>` },
  { kind: 'u-reeds', name: '芦苇', inner: `<path d="M34 84V30M50 84V22M66 84V34" stroke="${GREEN}" stroke-width="2.4"/><path d="M34 30q-6-2-8-8M50 22q6-2 8-8M66 34q-6-2-8-8" stroke="${GREEN}" stroke-width="2"/>` },
  { kind: 'u-cactus', name: '仙人掌', inner: `<path d="M44 84V34Q44 26 56 26Q56 26 56 84" fill="${GREEN_F}" stroke="${GREEN}"/><path d="M44 56H32Q26 56 26 46V40M56 50H68Q74 50 74 60V66" fill="none" stroke="${GREEN}" stroke-width="2.6"/>` },
  { kind: 'u-vines', name: '藤蔓', inner: `<path d="M30 14Q46 34 32 52Q18 70 36 86" stroke="${GREEN}" stroke-width="2.4"/><path d="M37 28q8-2 10 4M30 46q-8-2-10 4M35 66q8-2 10 4" stroke="${GREEN}" stroke-width="2"/>` },
  { kind: 'u-stalagmite', name: '石笋', inner: `<path d="M30 84L38 40L46 84Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M54 84L62 52L70 84Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M44 16L50 44L56 16" fill="${STONE_F}" stroke="${STONE}"/>` },
  { kind: 'u-crystals', name: '水晶簇', inner: `<path d="M40 82L34 44L46 30L52 50L46 82Z" fill="${PURP_F}" stroke="${PURP}"/><path d="M52 82L56 48L66 38L70 58L62 82Z" fill="${PURP_F}" stroke="${PURP}"/>` },
  { kind: 'u-lilypad', name: '睡莲', inner: `<path d="M50 40A22 22 0 1 1 46 40L50 50Z" fill="${GREEN_F}" stroke="${GREEN}"/><path d="M58 58q6-4 4-10q-8 0-8 8Z" fill="${RED_F}" stroke="${RED}"/>` },
  { kind: 'u-coral', name: '珊瑚', inner: `<path d="M50 84V50M50 60L34 44M50 56L66 42M34 44V30M66 42V28M50 50V24" stroke="${RED}" stroke-width="2.6"/><circle cx="34" cy="30" r="3" fill="none" stroke="${RED}"/><circle cx="66" cy="28" r="3" fill="none" stroke="${RED}"/><circle cx="50" cy="24" r="3" fill="none" stroke="${RED}"/>` },

  /* 奇幻 */
  { kind: 'u-magiccircle', name: '魔法阵', inner: `<circle cx="50" cy="50" r="32" fill="${PURP_F}" stroke="${PURP}"/><circle cx="50" cy="50" r="22" fill="none" stroke="${PURP}" stroke-width="1.6"/><path d="M50 18L68 72L22 38H78L32 72Z" fill="none" stroke="${PURP}" stroke-width="1.6"/>` },
  { kind: 'u-runestone', name: '符文石', inner: `<path d="M34 84V40Q34 26 50 24Q66 26 66 40V84Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M50 38V64M42 46L50 52L58 46M42 60H58" stroke="${PURP}" stroke-width="2"/>` },
  { kind: 'u-portal', name: '传送门', inner: `<ellipse cx="50" cy="50" rx="22" ry="32" fill="${PURP_F}" stroke="${PURP}" stroke-width="3"/><ellipse cx="50" cy="50" rx="12" ry="22" fill="none" stroke="${PURP}" stroke-width="1.6" opacity="0.7"/><path d="M50 22V78" stroke="rgba(255,255,255,0.5)" stroke-width="1.4"/>` },
  { kind: 'u-altar', name: '祭坛', inner: `<path d="M26 78H74V64H26Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M34 64V48H66V64" fill="${STONE_F}" stroke="${STONE}"/><path d="M30 48H70" stroke="${STONE}"/><path d="M50 44q-8-6-4-16q4 3 4 0q3-6-1-10q9 6 6 16q-1 6-5 10Z" fill="${RED_F}" stroke="${RED}"/>` },
  { kind: 'u-henge', name: '巨石阵', inner: `<path d="M22 80V46H36V80ZM64 80V46H78V80Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M18 46H82V34H18Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M46 80V54H54V80Z" fill="${STONE_F}" stroke="${STONE}"/>` },
  { kind: 'u-leyline', name: '灵脉节点', inner: `<path d="M50 14V86M14 50H86M26 26L74 74M74 26L26 74" stroke="${PURP}" stroke-width="1.6" opacity="0.6"/><circle cx="50" cy="50" r="12" fill="${PURP_F}" stroke="${PURP}" stroke-width="2.4"/>` },
  { kind: 'u-fairyring', name: '蘑菇圈', inner: `<ellipse cx="50" cy="54" rx="34" ry="22" fill="none" stroke="${GREEN}" stroke-width="1.6" stroke-dasharray="2 6"/><path d="M22 54l4-6 4 6ZM50 32l4-6 4 6ZM74 54l4-6 4 6ZM40 74l4-6 4 6ZM62 74l4-6 4 6Z" fill="${RED_F}" stroke="${RED}" stroke-width="1.4"/>` },
  { kind: 'u-glyph', name: '符印', inner: `<path d="M28 28H72V72H28Z" fill="none" stroke="${PURP}" stroke-width="1.6"/><path d="M50 30V70M30 50H70M38 38L62 62M62 38L38 62" stroke="${PURP}" stroke-width="2"/><circle cx="50" cy="50" r="6" fill="${PURP_F}" stroke="${PURP}"/>` },

  /* 科幻 */
  { kind: 'u-console', name: '控制台', inner: `<path d="M22 70H78L72 44H28Z" fill="${STEEL_F}" stroke="${STEEL}"/><path d="M22 70V80H78V70" fill="none" stroke="${STEEL}"/><path d="M36 52H46M54 52H64M36 60H64" stroke="${CYAN}" stroke-width="2"/>` },
  { kind: 'u-terminal', name: '终端', inner: `<path d="M30 22H70V64H30Z" fill="${STEEL_F}" stroke="${STEEL}"/><path d="M38 32H62M38 40H62M38 48H54" stroke="${CYAN}" stroke-width="2"/><path d="M42 64V78H58V64M34 78H66" stroke="${STEEL}" stroke-width="2"/>` },
  { kind: 'u-landingpad', name: '起降坪', inner: `<circle cx="50" cy="50" r="32" fill="${STEEL_F}" stroke="${STEEL}"/><path d="M40 36L60 64M60 36L40 64M50 30V70" stroke="${CYAN}" stroke-width="2.4"/><circle cx="50" cy="50" r="32" fill="none" stroke="${CYAN}" stroke-width="1.4" stroke-dasharray="4 6"/>` },
  { kind: 'u-antenna', name: '天线', inner: `<path d="M50 84V40" stroke="${STEEL}" stroke-width="3"/><path d="M30 30Q50 14 70 30Q50 46 30 30Z" fill="${STEEL_F}" stroke="${STEEL}"/><path d="M50 40L50 30" stroke="${STEEL}"/><path d="M38 84H62" stroke="${STEEL}"/>` },
  { kind: 'u-reactor', name: '反应堆', inner: `<circle cx="50" cy="50" r="30" fill="${STEEL_F}" stroke="${STEEL}"/><circle cx="50" cy="50" r="10" fill="${CYAN}" stroke="${CYAN}"/><path d="M50 20V36M50 64V80M20 50H36M64 50H80" stroke="${CYAN}" stroke-width="3"/>` },
  { kind: 'u-solar', name: '太阳能板', inner: `<path d="M20 30H80L72 64H28Z" fill="${STEEL_F}" stroke="${STEEL}"/><path d="M34 30L30 64M50 30V64M66 30L70 64M24 47H76" stroke="${STEEL}" stroke-width="1.6"/><path d="M50 64V82M40 82H60" stroke="${STEEL}" stroke-width="2"/>` },
  { kind: 'u-hologram', name: '全息台', inner: `<ellipse cx="50" cy="76" rx="24" ry="7" fill="${STEEL_F}" stroke="${STEEL}"/><path d="M50 70V40" stroke="${CYAN}" stroke-width="1.4" opacity="0.5"/><path d="M36 28L50 20L64 28L50 36Z" fill="none" stroke="${CYAN}" stroke-width="2"/><path d="M36 28V44L50 52L64 44V28" fill="none" stroke="${CYAN}" stroke-width="2"/>` },
  { kind: 'u-airlock', name: '气闸门', inner: `<circle cx="50" cy="50" r="30" fill="${STEEL_F}" stroke="${STEEL}"/><circle cx="50" cy="50" r="20" fill="none" stroke="${STEEL}" stroke-width="2"/><path d="M50 30V50L66 58" stroke="${STEEL}" stroke-width="2"/><circle cx="50" cy="50" r="4" fill="${STEEL}"/><path d="M50 20V14M80 50H86M50 80V86M20 50H14" stroke="${STEEL}" stroke-width="2.4"/>` },

  /* 恐怖 */
  { kind: 'u-grave', name: '墓碑', inner: `<path d="M34 82V44Q34 30 50 30Q66 30 66 44V82Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M42 46V58M36 52H48" stroke="${INK}" stroke-width="2.4"/><path d="M28 82H72" stroke="${STONE}"/>` },
  { kind: 'u-coffin', name: '棺材', inner: `<path d="M42 16H58L66 36L62 84H38L34 36Z" fill="${FILL}" stroke="${STONE}"/><path d="M50 30V52M42 41H58" stroke="${INK}" stroke-width="2.4"/>` },
  { kind: 'u-bones', name: '骸骨堆', inner: `<circle cx="38" cy="54" r="12" fill="${FILL}" stroke="${BONE}"/><circle cx="34" cy="54" r="2.4" fill="${INK}"/><circle cx="42" cy="54" r="2.4" fill="${INK}"/><path d="M36 62q4 4 8 0" stroke="${INK}" stroke-width="1.4"/><path d="M54 40L78 64M54 64L78 40" stroke="${BONE}" stroke-width="3"/><circle cx="54" cy="40" r="3" fill="none" stroke="${BONE}"/><circle cx="78" cy="64" r="3" fill="none" stroke="${BONE}"/>` },
  { kind: 'u-blood', name: '血迹', inner: `<path d="M34 40Q24 56 38 66Q56 74 62 58Q70 42 56 36Q44 30 34 40Z" fill="${RED_F}" stroke="${RED}"/><circle cx="70" cy="72" r="4" fill="${RED_F}" stroke="${RED}"/><circle cx="28" cy="70" r="3" fill="${RED_F}" stroke="${RED}"/>` },
  { kind: 'u-cobweb', name: '蛛网', inner: `<path d="M14 14L70 70M14 14V44M14 14H44" stroke="${STONE}" stroke-width="1.6"/><path d="M14 30Q26 26 30 14M14 44Q34 38 44 14M22 54Q44 44 54 22" fill="none" stroke="${STONE}" stroke-width="1.4"/>` },
  { kind: 'u-ironfence', name: '铁栅栏', inner: `<path d="M24 84V34M40 84V34M56 84V34M72 84V34" stroke="${INK}" stroke-width="2.4"/><path d="M24 30L24 24M40 30L40 24M56 30L56 24M72 30L72 24" stroke="${INK}" stroke-width="2.4"/><path d="M18 46H78M18 62H78" stroke="${INK}" stroke-width="2"/>` },
  { kind: 'u-candle', name: '仪式蜡烛', inner: `<path d="M42 82V42H58V82Z" fill="${FILL}" stroke="${STONE}"/><path d="M50 42V30" stroke="${INK}"/><path d="M50 30q-5-4-2-10q4 4 4-2q3 5 0 10Z" fill="${GOLD_F}" stroke="${GOLD}"/><path d="M34 82H66" stroke="${STONE}"/>` },
  { kind: 'u-chains', name: '锁链', inner: `<ellipse cx="34" cy="26" rx="7" ry="10" fill="none" stroke="${STEEL}" stroke-width="2.4"/><ellipse cx="46" cy="44" rx="7" ry="10" fill="none" stroke="${STEEL}" stroke-width="2.4"/><ellipse cx="58" cy="62" rx="7" ry="10" fill="none" stroke="${STEEL}" stroke-width="2.4"/><ellipse cx="70" cy="80" rx="7" ry="10" fill="none" stroke="${STEEL}" stroke-width="2.4"/>` },
  { kind: 'u-crypt', name: '陵墓门', inner: `<path d="M24 84V40Q24 20 50 20Q76 20 76 40V84Z" fill="${STONE_F}" stroke="${STONE}"/><path d="M36 84V46Q36 32 50 32Q64 32 64 46V84Z" fill="${SHADE}" stroke="${INK}"/><path d="M50 32V84M44 56H56" stroke="${INK}" stroke-width="2"/>` },
];

/* —— 补充件 —— */
const EXTRA: UItem[] = [
  { kind: 'u-road-round', name: '石板路·环岛', inner: rRoad(DCROSS) + `<circle cx="50" cy="50" r="15" fill="${ROAD}" stroke="${STONE}" stroke-width="3"/><circle cx="50" cy="50" r="6" fill="${GREEN_F}" stroke="${GREEN}" stroke-width="1.6"/>` },
  { kind: 'u-stepstones', name: '汀步', inner: `<ellipse cx="50" cy="14" rx="11" ry="8" fill="${STONE_F}" stroke="${STONE}"/><ellipse cx="44" cy="38" rx="12" ry="9" fill="${STONE_F}" stroke="${STONE}"/><ellipse cx="56" cy="62" rx="12" ry="9" fill="${STONE_F}" stroke="${STONE}"/><ellipse cx="48" cy="86" rx="11" ry="8" fill="${STONE_F}" stroke="${STONE}"/>` },
  { kind: 'u-forcefield', name: '力场段', inner: P(dStr(true), CYAN, 4) + P('M42 0V100M58 0V100', CYAN, 1.6, '3 7') + `<path d="M42 18H58M42 50H58M42 82H58" stroke="${CYAN}" stroke-width="1.4" opacity="0.6"/>` },
  { kind: 'u-pentagram', name: '五芒星阵', inner: `<circle cx="50" cy="50" r="32" fill="${RED_F}" stroke="${RED}"/><path d="M50 20L61 70L21 39H79L39 70Z" fill="none" stroke="${RED}" stroke-width="2"/>` },
];

export const UNIVERSAL_ITEMS: UItem[] = [...CONNECT, ...TILES, ...PROPS, ...EXTRA];

/* 端到端验证「优美导出」：PNG（全图/背景色）+ 只读 HTML（离线渲染/悬浮属性）。
   需先 `npm run build`，再启动 `npm run preview`（默认 4173），然后 node scripts/verify-export.mjs */
import { chromium } from 'playwright';
import { mkdtempSync, rmSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.BASE || 'http://localhost:4173';
const TEMP = mkdtempSync(join(tmpdir(), 'maptool-verify-'));
const pngPath = join(TEMP, 'out.png');
const htmlPath = join(TEMP, 'out.html');

let failed = 0;
function assert(cond, msg) {
  if (cond) console.log('  ✓ ' + msg);
  else {
    console.error('  ✗ ' + msg);
    failed++;
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));

console.log('建世界 + 放节点...');
await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
await page.evaluate(() => indexedDB.deleteDatabase('trpg-maptool'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.getByText('开辟第一方天地').click();
await page.waitForTimeout(250);
await page.locator('.ink-field').first().fill('灰雾海岸');
await page.getByText('落墨开辟').click();
await page.waitForSelector('.canvas-wrap');
await page.waitForTimeout(700);
await page.locator('.lib__item').nth(0).dblclick();
await page.waitForTimeout(300);
await page.locator('.lib__item').nth(2).dblclick();
await page.waitForTimeout(300);

async function exportVia(itemText, savePath) {
  const dl = await Promise.all([
    page.waitForEvent('download'),
    (async () => {
      await page.getByRole('button', { name: /导出/ }).click();
      await page.getByText(itemText).click();
    })(),
  ]).then(([d]) => d);
  await dl.saveAs(savePath);
}

console.log('导出 PNG · 全图...');
await exportVia('高清图片 · 全图', pngPath);
const buf = readFileSync(pngPath);
assert(buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47, 'PNG magic 正确');
assert(buf.length > 2000, `PNG 体积 ${buf.length}B > 2KB`);
const pw = buf.readUInt32BE(16);
const ph = buf.readUInt32BE(20);
console.log(`    PNG 尺寸 ${pw}x${ph}`);
assert(pw > 100 && ph > 100, 'PNG 尺寸合理');
const corner = await page.evaluate(async (du) => {
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = du;
  });
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return Array.from(ctx.getImageData(3, 3, 1, 1).data);
}, 'data:image/png;base64,' + buf.toString('base64'));
console.log('    角落像素 rgba=', corner);
assert(
  Math.abs(corner[0] - 236) < 14 && Math.abs(corner[1] - 224) < 14 && Math.abs(corner[2] - 192) < 14,
  '角落为羊皮纸底色 #ece0c0（背景层生效）',
);

console.log('导出只读 HTML...');
await exportVia('只读网页 · 可分享', htmlPath);
const htmlText = readFileSync(htmlPath, 'utf8');
const htmlSize = statSync(htmlPath).size;
console.log(`    HTML 体积 ${(htmlSize / 1024).toFixed(0)}KB`);
assert(htmlSize > 400 * 1024, 'HTML 自包含（>400KB）');
assert(!htmlText.includes('__WORLD_DATA_PLACEHOLDER__'), '数据占位符已被替换');
assert(!htmlText.includes('/@vite/client'), 'HTML 不含 Vite 开发客户端');
assert(
  !htmlText.includes('<script type="module" src="/src/viewer/viewer.tsx"></script>'),
  'HTML 不依赖查看器源码脚本',
);

console.log('离线 file:// 打开只读 HTML...');
const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs2 = [];
page2.on('console', (m) => m.type() === 'error' && errs2.push(m.text()));
page2.on('pageerror', (e) => errs2.push('PAGEERROR ' + e.message));
await page2.goto('file://' + htmlPath);
await page2.waitForSelector('.canvas-wrap', { timeout: 6000 });
await page2.waitForTimeout(1000);
const canvasCount = await page2.locator('.canvas-wrap canvas').count();
assert(canvasCount > 0, `viewer 渲染了 Konva canvas（${canvasCount} 个）`);

const pt = await page2.evaluate(() => {
  const data = JSON.parse(document.getElementById('world-data').textContent);
  const n = data.data.nodes[0];
  const vp = data.data.viewport;
  const wrap = document.querySelector('.canvas-wrap').getBoundingClientRect();
  return {
    x: wrap.left + n.x * vp.scale + vp.x + (n.width * vp.scale) / 2,
    y: wrap.top + n.y * vp.scale + vp.y + (n.height * vp.scale) / 2,
  };
});
await page2.mouse.move(pt.x, pt.y);
await page2.waitForTimeout(400);
assert((await page2.locator('.node-popover').count()) > 0, 'hover 节点显示属性浮窗');
assert(errs2.length === 0, 'viewer 离线无 JS 错误' + (errs2.length ? ': ' + JSON.stringify(errs2) : ''));

await browser.close();
rmSync(TEMP, { recursive: true, force: true });
assert(errors.length === 0, '编辑器无控制台错误' + (errors.length ? ': ' + JSON.stringify(errors) : ''));

console.log(failed ? `\n✗ ${failed} 项失败` : '\n✓ 全部通过');
process.exit(failed ? 1 : 0);

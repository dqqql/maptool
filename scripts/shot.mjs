// 端到端截图核对：阶段 1-7 全流程。需先 npm run dev 起在 5173。
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));

const shot = async (name) => {
  await page.waitForTimeout(420);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('  · ' + name);
};
const NODE = { x: 699, y: 478 };

// 清空 IndexedDB，保证可重复
await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
await page.evaluate(() => indexedDB.deleteDatabase('trpg-maptool'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await shot('01-home-empty');

console.log('创建世界…');
await page.getByText('开辟第一方天地').click();
await page.waitForTimeout(250);
await page.locator('.ink-field').first().fill('灰雾海岸');
await page.getByText('落墨开辟').click();
await page.waitForSelector('.canvas-wrap');
await page.waitForTimeout(700);
await shot('02-editor-empty');

console.log('放置并散开两个节点…');
await page.locator('.lib__item', { hasText: '城堡' }).dblclick();
await page.waitForTimeout(200);
await page.mouse.move(NODE.x, NODE.y);
await page.mouse.down();
await page.mouse.move(520, 470, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(150);
await page.locator('.lib__item', { hasText: '港口' }).dblclick();
await page.waitForTimeout(200);
await page.mouse.move(NODE.x + 24, NODE.y + 24);
await page.mouse.down();
await page.mouse.move(880, 470, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(150);
await shot('03-two-nodes');

console.log('连线…');
await page.getByRole('button', { name: /连线/ }).click();
await page.mouse.click(520, 470);
await page.waitForTimeout(200);
await page.mouse.click(880, 470);
await page.waitForTimeout(250);
await shot('04-edge');

console.log('编辑连线属性…');
await page.getByRole('button', { name: /选择/ }).click();
await page.mouse.click(700, 470); // 连线中点附近
await page.waitForTimeout(200);
await shot('05-edge-selected');

console.log('文本备注…');
await page.getByRole('button', { name: /文本/ }).click();
await page.mouse.click(720, 660);
await page.waitForTimeout(250);
await page.mouse.dblclick(720, 660);
await page.waitForTimeout(200);
await page.keyboard.type('灰雾常年不散，\n商船多在此折返。');
await page.waitForTimeout(150);
await shot('06-text');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

console.log('上传用户素材（生成一个 SVG 文件）…');
const svgPath = '/tmp/test-asset.svg';
const { writeFileSync } = await import('node:fs');
writeFileSync(svgPath, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="none" stroke="#241a10" stroke-width="4"/><path d="M30 50h40M50 30v40" stroke="#8c3a2b" stroke-width="4"/></svg>');
await page.getByRole('button', { name: /选择/ }).click();
await page.locator('input[type=file]').first().setInputFiles(svgPath);
await page.waitForTimeout(400);
await shot('07-user-asset');

console.log('导出…');
const dl = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: /导出/ }).click(),
]).then((r) => r[0]);
const exportPath = '/tmp/exported.world.json';
await dl.saveAs(exportPath);
const parsed = JSON.parse(readFileSync(exportPath, 'utf8'));
console.log('  导出校验：nodes=%d edges=%d texts=%d assets=%d',
  parsed.data.nodes.length, parsed.data.edges.length, parsed.data.texts.length, parsed.assets.length);

console.log('返回首页 + 导入…');
await page.getByText('返回卷宗').click();
await page.waitForTimeout(600);
await shot('08-home-one-world');
await page.locator('input[type=file]').first().setInputFiles(exportPath);
await page.waitForSelector('.canvas-wrap');
await page.waitForTimeout(800);
await shot('09-imported-editor');

await browser.close();
console.log('\n控制台错误：', errors.length ? errors : '无');

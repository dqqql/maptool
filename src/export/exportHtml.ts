/* =========================================================================
   只读 HTML 导出：取同域的 viewer.html 自包含模板，把世界数据注入占位符，
   生成一个离线可双击打开的单文件 HTML（他人可查看，不可编辑）。
   模板由 vite.viewer.config.ts 经 singlefile 构建；生产环境读取 dist/viewer.html，
   开发环境由 vite.config.ts 的中间件在同一路径动态提供内联模板。
   ========================================================================= */
import { buildWorldFile } from '../serialization/worldFile';
import { downloadBlob } from './exportPng';

const PLACEHOLDER = '__WORLD_DATA_PLACEHOLDER__';
let templateCache: string | null = null;

async function loadTemplate(): Promise<string> {
  if (templateCache) return templateCache;
  const url = new URL('viewer.html', document.baseURI).href;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`无法加载查看器模板（HTTP ${res.status}）`);
  const html = await res.text();
  if (!html.includes(PLACEHOLDER)) {
    throw new Error('查看器模板缺少数据占位符，请重新构建后再试');
  }
  templateCache = html;
  return html;
}

/** 导出某世界为自包含只读 HTML 并触发下载。 */
export async function exportReadonlyHtml(worldId: string, filename: string): Promise<void> {
  const [template, file] = await Promise.all([loadTemplate(), buildWorldFile(worldId)]);
  // 注入 <script type="application/json"> 内，转义 </ 防止提前闭合 script 标签
  const json = JSON.stringify(file).replace(/<\//g, '<\\/');
  // 用函数式替换，避免 json 中的 $& 等被当作特殊替换模式
  const html = template.replace(PLACEHOLDER, () => json);
  const blob = new Blob([html], { type: 'text/html' });
  downloadBlob(blob, filename);
}

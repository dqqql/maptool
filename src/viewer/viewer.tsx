/* =========================================================================
   只读查看器入口：从内嵌的 <script id="world-data"> 读取世界数据并渲染。
   由 vite.viewer.config.ts 经 singlefile 构建为自包含的 dist/viewer.html 模板，
   导出时 src/export/exportHtml.ts 把真实数据注入占位符。
   ========================================================================= */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ReadOnlyCanvas } from './ReadOnlyCanvas';
import { makeViewerAssetResolver } from './viewerAsset';
import type { WorldFile } from '../serialization/worldFile';
import '../styles/global.css';
import './viewer.css';

function readData(): WorldFile | null {
  const el = document.getElementById('world-data');
  const raw = el?.textContent?.trim();
  if (!raw || raw.startsWith('__WORLD_DATA')) return null; // 未注入数据（模板态）
  try {
    return JSON.parse(raw) as WorldFile;
  } catch {
    return null;
  }
}

function App() {
  const file = readData();
  if (!file || !file.data) {
    return <div className="viewer__empty">未能加载世界数据。</div>;
  }
  const resolveAsset = makeViewerAssetResolver(file.assets ?? []);
  return (
    <div className="viewer parchment-bg">
      <header className="viewer__bar">
        <span className="viewer__title">{file.world?.name || '世界舆图'}</span>
        <span className="viewer__badge">只读 · 世界舆图</span>
      </header>
      <div className="viewer__canvas grain-overlay">
        <ReadOnlyCanvas data={file.data} resolveAsset={resolveAsset} />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

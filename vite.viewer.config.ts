import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 单独构建只读查看器：把 React/Konva/渲染器全部内联进一个自包含的 dist/viewer.html。
// 该文件作为模板，导出时由 src/export/exportHtml.ts 注入世界数据。
// 与主 app 同目录输出且 emptyOutDir:false，需在主 app 构建之后运行（见 package.json build）。
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    rollupOptions: { input: 'viewer.html' },
    outDir: 'dist',
    emptyOutDir: false,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 5000,
  },
});

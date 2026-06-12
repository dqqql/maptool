import { build, defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const VIEWER_TEMPLATE_PATH = '/viewer.html';

function fileUrlToPath(fileUrl: string): string {
  const pathname = decodeURIComponent(fileUrl.replace(/^file:\/\//, ''));
  return /^\/[A-Za-z]:\//.test(pathname) ? pathname.slice(1) : pathname;
}

function viewerTemplatePlugin(): Plugin {
  let templatePromise: Promise<string> | null = null;

  async function buildTemplate(): Promise<string> {
    const result = await build({
      configFile: fileUrlToPath(new URL('vite.viewer.config.ts', import.meta.url).href),
      build: { write: false },
    });
    const outputs = Array.isArray(result) ? result : [result];

    for (const output of outputs) {
      if (!('output' in output)) continue;
      const html = output.output.find(
        (item) => item.type === 'asset' && item.fileName === 'viewer.html',
      );
      if (html?.type === 'asset') {
        if (typeof html.source === 'string') return html.source;
        throw new Error('viewer.html was emitted as binary data');
      }
    }
    throw new Error('viewer build did not emit viewer.html');
  }

  return {
    name: 'maptool-viewer-template',
    apply: 'serve',
    configureServer(server) {
      const invalidate = () => {
        templatePromise = null;
      };
      server.watcher.on('change', invalidate);
      server.watcher.on('add', invalidate);
      server.watcher.on('unlink', invalidate);

      server.middlewares.use(VIEWER_TEMPLATE_PATH, async (_req, res) => {
        try {
          templatePromise ??= buildTemplate();
          const html = await templatePromise;
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        } catch (error) {
          templatePromise = null;
          server.config.logger.error(
            `Failed to build readonly viewer template: ${
              error instanceof Error ? error.stack ?? error.message : String(error)
            }`,
          );
          res.statusCode = 500;
          res.end('Failed to build readonly viewer template');
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), viewerTemplatePlugin()],
  server: {
    port: 5173,
    open: true,
  },
});

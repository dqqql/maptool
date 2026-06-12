/* =========================================================================
   画布 PNG 导出：把 Konva 舞台的指定世界范围渲染为高分辨率 PNG。
   命令式操作现有 stage（不经过 React / store），截图后立即恢复原状。
   ========================================================================= */
import Konva from 'konva';
import type { MapNode, TextBox } from '../types';
import { computeContentBounds, type BoundsRect } from './bounds';

export const PAPER_BG = '#ece0c0'; // 与 --paper-1 一致的羊皮纸底色

export interface PngOptions {
  pixelRatio?: number; // 像素密度，默认 2
  padding?: number; // 范围四周留白（世界单位），默认 48
  background?: string; // 背景填充色，默认羊皮纸底
}

/**
 * 把 stage 上某个世界坐标矩形导出为 PNG Blob。
 * 过程：保存原变换 → 隐藏网格层 / 清空 Transformer / 铺背景层 → scale=1 平移到该范围
 * → toCanvas 取独立位图 → 同步恢复 stage → 再异步 toBlob（恢复后再编码，避免闪烁）。
 */
export async function exportStageRegion(
  stage: Konva.Stage,
  worldRect: BoundsRect,
  opts: PngOptions = {},
): Promise<Blob> {
  const pixelRatio = opts.pixelRatio ?? 2;
  const pad = opts.padding ?? 48;
  const background = opts.background ?? PAPER_BG;

  const outW = worldRect.width + pad * 2;
  const outH = worldRect.height + pad * 2;

  // 保存原状
  const saved = {
    x: stage.x(),
    y: stage.y(),
    scaleX: stage.scaleX(),
    scaleY: stage.scaleY(),
    width: stage.width(),
    height: stage.height(),
  };
  const gridLayer = stage.getLayers()[0]; // 第一层为网格层
  const transformers = stage.find('Transformer') as unknown as Konva.Transformer[];
  const trSaved = transformers.map((tr) => ({ tr, nodes: tr.nodes() }));

  const bgLayer = new Konva.Layer({ listening: false });
  const bgRect = new Konva.Rect({
    x: worldRect.x - pad,
    y: worldRect.y - pad,
    width: outW,
    height: outH,
    fill: background,
    listening: false,
  });

  let canvas: HTMLCanvasElement;
  try {
    gridLayer?.hide();
    trSaved.forEach(({ tr }) => tr.nodes([]));
    stage.add(bgLayer);
    bgLayer.add(bgRect);
    bgLayer.moveToBottom();

    // 把 worldRect 左上角映射到画布 (pad, pad)，世界坐标 1:1
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: -worldRect.x + pad, y: -worldRect.y + pad });
    stage.size({ width: outW, height: outH });
    stage.draw();

    canvas = stage.toCanvas({ pixelRatio });
  } finally {
    // 同步恢复（在异步 toBlob 之前），保证用户视图不闪动
    bgLayer.destroy();
    gridLayer?.show();
    trSaved.forEach(({ tr, nodes }) => tr.nodes(nodes));
    stage.size({ width: saved.width, height: saved.height });
    stage.scale({ x: saved.scaleX, y: saved.scaleY });
    stage.position({ x: saved.x, y: saved.y });
    stage.draw();
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('生成 PNG 失败'))),
      'image/png',
    );
  });
}

/** 自动范围：按所有节点+文本框的包围盒导出。空画布抛错。 */
export async function exportAutoRange(
  stage: Konva.Stage,
  nodes: MapNode[],
  texts: TextBox[],
  opts: PngOptions = {},
): Promise<Blob> {
  const bounds = computeContentBounds(nodes, texts);
  if (!bounds) throw new Error('画布为空，没有可导出的内容');
  return exportStageRegion(stage, bounds, opts);
}

/** 当前视图：导出舞台当前可见区域。 */
export async function exportCurrentView(stage: Konva.Stage, opts: PngOptions = {}): Promise<Blob> {
  const sx = stage.scaleX() || 1;
  const pos = stage.position();
  const worldRect: BoundsRect = {
    x: -pos.x / sx,
    y: -pos.y / sx,
    width: stage.width() / sx,
    height: stage.height() / sx,
  };
  return exportStageRegion(stage, worldRect, { padding: 0, ...opts });
}

/** 触发浏览器下载一个 Blob。 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

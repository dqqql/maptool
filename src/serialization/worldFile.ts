/* =========================================================================
   世界存档：导出 / 导入为单个 JSON（用户素材以 base64/dataUrl 内嵌）
   ========================================================================= */
import type { World, WorldData, Asset } from '../types';
import {
  getWorld, getWorldData, listAssets, putAsset, createWorld, putWorldData,
} from '../db/idb';

export const WORLD_FILE_FORMAT = 'trpg-world';
export const WORLD_FILE_VERSION = 1;

export interface WorldFile {
  format: typeof WORLD_FILE_FORMAT;
  version: number;
  exportedAt: number;
  world: Pick<World, 'name' | 'createdAt' | 'updatedAt'>;
  data: Omit<WorldData, 'worldId'>;
  assets: Asset[]; // 用到的用户素材（内置不导出）
}

/** 导出某世界为 JSON 并触发下载 */
export async function exportWorld(worldId: string): Promise<void> {
  const world = await getWorld(worldId);
  if (!world) throw new Error('世界不存在');
  const data = await getWorldData(worldId);

  // 收集节点用到的用户素材（id 非 builtin: 前缀）
  const usedAssetIds = new Set(data.nodes.map((n) => n.assetId).filter((id) => !id.startsWith('builtin:')));
  const allAssets = await listAssets();
  const assets = allAssets.filter((a) => !a.builtin && usedAssetIds.has(a.id));

  const file: WorldFile = {
    format: WORLD_FILE_FORMAT,
    version: WORLD_FILE_VERSION,
    exportedAt: Date.now(),
    world: { name: world.name, createdAt: world.createdAt, updatedAt: world.updatedAt },
    data: { nodes: data.nodes, edges: data.edges, texts: data.texts, viewport: data.viewport },
    assets,
  };

  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safe = world.name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40) || 'world';
  a.download = `${safe}.world.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function isWorldFile(v: unknown): v is WorldFile {
  if (!v || typeof v !== 'object') return false;
  const f = v as Partial<WorldFile>;
  return f.format === WORLD_FILE_FORMAT && !!f.data && Array.isArray(f.data.nodes);
}

/** 从 JSON 文本导入为新世界，返回新世界。 */
export async function importWorldFromText(text: string): Promise<World> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('文件不是合法的 JSON');
  }
  if (!isWorldFile(parsed)) throw new Error('不是有效的世界存档文件');
  const file = parsed;

  // 1) 还原用户素材（保留原 id，使节点引用仍然有效）
  for (const asset of file.assets ?? []) {
    await putAsset({ ...asset, builtin: false });
  }

  // 2) 新建世界并写入画布数据
  const world = await createWorld(file.world?.name || '导入的世界');
  const data: WorldData = {
    worldId: world.id,
    nodes: file.data.nodes ?? [],
    edges: file.data.edges ?? [],
    texts: file.data.texts ?? [],
    viewport: file.data.viewport ?? { x: 0, y: 0, scale: 1 },
  };
  await putWorldData(data);
  return world;
}

/** 读取 File 对象并导入 */
export async function importWorldFromFile(file: File): Promise<World> {
  const text = await file.text();
  return importWorldFromText(text);
}

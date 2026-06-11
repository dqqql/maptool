/* =========================================================================
   IndexedDB 封装（基于 idb 库）
   表：worlds / worldData / assets
   ========================================================================= */
import { openDB, type IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, type MapToolDB } from './schema';
import type { World, WorldData, Asset } from '../types';
import { emptyWorldData } from '../types';

let dbPromise: Promise<IDBPDatabase<MapToolDB>> | null = null;

function getDB(): Promise<IDBPDatabase<MapToolDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MapToolDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('worlds')) {
          const worlds = db.createObjectStore('worlds', { keyPath: 'id' });
          worlds.createIndex('by-updatedAt', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('worldData')) {
          db.createObjectStore('worldData', { keyPath: 'worldId' });
        }
        if (!db.objectStoreNames.contains('assets')) {
          db.createObjectStore('assets', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

/* —— worlds —— */

export async function listWorlds(): Promise<World[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('worlds', 'by-updatedAt');
  return all.reverse(); // 最近更新在前
}

export async function getWorld(id: string): Promise<World | undefined> {
  const db = await getDB();
  return db.get('worlds', id);
}

export async function putWorld(world: World): Promise<void> {
  const db = await getDB();
  await db.put('worlds', world);
}

/** 创建一个新世界（含空画布数据），返回 World */
export async function createWorld(name: string): Promise<World> {
  const now = Date.now();
  const world: World = {
    id: crypto.randomUUID(),
    name: name.trim() || '无名之地',
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDB();
  const tx = db.transaction(['worlds', 'worldData'], 'readwrite');
  await tx.objectStore('worlds').put(world);
  await tx.objectStore('worldData').put(emptyWorldData(world.id));
  await tx.done;
  return world;
}

/** 删除世界（同时删画布数据）*/
export async function deleteWorld(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['worlds', 'worldData'], 'readwrite');
  await tx.objectStore('worlds').delete(id);
  await tx.objectStore('worldData').delete(id);
  await tx.done;
}

/** 触碰更新时间 */
export async function touchWorld(id: string): Promise<void> {
  const db = await getDB();
  const world = await db.get('worlds', id);
  if (world) {
    world.updatedAt = Date.now();
    await db.put('worlds', world);
  }
}

/* —— worldData —— */

export async function getWorldData(worldId: string): Promise<WorldData> {
  const db = await getDB();
  const data = await db.get('worldData', worldId);
  return data ?? emptyWorldData(worldId);
}

export async function putWorldData(data: WorldData): Promise<void> {
  const db = await getDB();
  await db.put('worldData', data);
}

/* —— assets（阶段 3+ 使用，先备好 CRUD）—— */

export async function listAssets(): Promise<Asset[]> {
  const db = await getDB();
  return db.getAll('assets');
}

export async function putAsset(asset: Asset): Promise<void> {
  const db = await getDB();
  await db.put('assets', asset);
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('assets', id);
}

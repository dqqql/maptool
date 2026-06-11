/* =========================================================================
   IndexedDB schema 定义
   ========================================================================= */
import type { DBSchema } from 'idb';
import type { World, WorldData, Asset } from '../types';

export const DB_NAME = 'trpg-maptool';
export const DB_VERSION = 1;

export interface MapToolDB extends DBSchema {
  worlds: {
    key: string; // World.id
    value: World;
    indexes: { 'by-updatedAt': number };
  };
  worldData: {
    key: string; // WorldData.worldId
    value: WorldData;
  };
  assets: {
    key: string; // Asset.id
    value: Asset;
  };
}

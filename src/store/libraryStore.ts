/* =========================================================================
   素材库状态（Zustand）
   内置素材为代码生成（不入库）；用户素材存 assets 表。
   ========================================================================= */
import { create } from 'zustand';
import type { Asset } from '../types';
import { BUILTIN_ASSETS } from '../assets/builtin';
import { listAssets, putAsset, deleteAsset } from '../db/idb';

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

interface LibraryState {
  builtin: Asset[];
  user: Asset[];
  loaded: boolean;
  load: () => Promise<void>;
  getAsset: (id: string) => Asset | undefined;
  uploadFiles: (files: FileList | File[]) => Promise<number>;
  renameUserAsset: (id: string, name: string) => Promise<void>;
  removeUserAsset: (id: string) => Promise<void>;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('读取失败'));
    r.readAsDataURL(file);
  });
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  builtin: BUILTIN_ASSETS,
  user: [],
  loaded: false,

  async load() {
    const stored = await listAssets();
    set({ user: stored.filter((a) => !a.builtin), loaded: true });
  },

  getAsset(id) {
    const { builtin, user } = get();
    return builtin.find((a) => a.id === id) ?? user.find((a) => a.id === id);
  },

  async uploadFiles(files) {
    let count = 0;
    for (const file of Array.from(files)) {
      if (!ACCEPTED.includes(file.type)) continue;
      const dataUrl = await readAsDataUrl(file);
      const asset: Asset = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^.]+$/, '').slice(0, 30) || '素材',
        builtin: false,
        kind: 'user',
        dataUrl,
      };
      await putAsset(asset);
      count++;
    }
    if (count) await get().load();
    return count;
  },

  async renameUserAsset(id, name) {
    const asset = get().user.find((a) => a.id === id);
    if (!asset) return;
    await putAsset({ ...asset, name: name.trim() || asset.name });
    await get().load();
  },

  async removeUserAsset(id) {
    await deleteAsset(id);
    await get().load();
  },
}));

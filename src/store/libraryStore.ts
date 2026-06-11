/* =========================================================================
   素材库状态（Zustand）
   内置素材为代码生成（不入库）；用户素材（阶段 6）从 assets 表加载。
   ========================================================================= */
import { create } from 'zustand';
import type { Asset } from '../types';
import { BUILTIN_ASSETS } from '../assets/builtin';
import { listAssets } from '../db/idb';

interface LibraryState {
  builtin: Asset[];
  user: Asset[];
  loaded: boolean;
  load: () => Promise<void>;
  getAsset: (id: string) => Asset | undefined;
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
}));

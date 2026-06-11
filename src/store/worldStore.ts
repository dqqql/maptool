/* =========================================================================
   当前打开世界的画布状态（Zustand）
   所有变更走 store → 防抖写 IndexedDB，刷新不丢数据。
   阶段 2 先接入 viewport，nodes/edges/texts 在后续阶段填充。
   ========================================================================= */
import { create } from 'zustand';
import type { Viewport, WorldData } from '../types';
import { DEFAULT_VIEWPORT, emptyWorldData } from '../types';
import { getWorldData, putWorldData, touchWorld } from '../db/idb';

interface WorldState {
  worldId: string | null;
  loaded: boolean;
  viewport: Viewport;

  /** 载入某个世界的画布数据 */
  load: (worldId: string) => Promise<void>;
  /** 卸载（离开编辑器）*/
  unload: () => void;
  /** 更新视口（缩放/平移），触发防抖保存 */
  setViewport: (vp: Viewport) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(getState: () => WorldState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const s = getState();
    if (!s.worldId) return;
    const data: WorldData = {
      ...emptyWorldData(s.worldId),
      viewport: s.viewport,
    };
    await putWorldData(data);
    await touchWorld(s.worldId);
  }, 500);
}

export const useWorldStore = create<WorldState>((set, get) => ({
  worldId: null,
  loaded: false,
  viewport: { ...DEFAULT_VIEWPORT },

  async load(worldId) {
    set({ loaded: false, worldId });
    const data = await getWorldData(worldId);
    set({
      worldId,
      loaded: true,
      viewport: data.viewport ?? { ...DEFAULT_VIEWPORT },
    });
  },

  unload() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    set({ worldId: null, loaded: false, viewport: { ...DEFAULT_VIEWPORT } });
  },

  setViewport(vp) {
    set({ viewport: vp });
    scheduleSave(get);
  },
}));

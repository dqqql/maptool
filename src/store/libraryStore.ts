/* =========================================================================
   素材库状态（Zustand）
   内置素材为代码生成（不入库）；用户素材存 assets 表。
   ========================================================================= */
import { create } from 'zustand';
import type { Asset } from '../types';
import {
  BUILTIN_ASSETS,
  BUILTIN_ID_SET,
  QUICK_SLOT_COUNT,
  defaultQuickSlots,
  getBuiltinAsset,
} from '../assets/builtin';
import { listAssets, putAsset, deleteAsset, listAssetUsages } from '../db/idb';

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

/** 快捷栏配置：分类 → 长度固定为 QUICK_SLOT_COUNT 的 id 数组（null 表示空槽）*/
type QuickSlots = Record<string, (string | null)[]>;
const QS_KEY = 'maptool.quickslots.v1';

function loadQuickSlots(): QuickSlots {
  const def = defaultQuickSlots();
  try {
    const raw = JSON.parse(localStorage.getItem(QS_KEY) ?? 'null');
    if (raw && typeof raw === 'object') {
      for (const group of Object.keys(def)) {
        const saved = (raw as Record<string, unknown>)[group];
        if (Array.isArray(saved)) {
          const arr = saved
            .slice(0, QUICK_SLOT_COUNT)
            .map((v) => (typeof v === 'string' && BUILTIN_ID_SET.has(v) ? v : null));
          while (arr.length < QUICK_SLOT_COUNT) arr.push(null);
          def[group] = arr;
        }
      }
    }
  } catch {
    /* 配置损坏则回退默认 */
  }
  return def;
}

function saveQuickSlots(qs: QuickSlots) {
  try {
    localStorage.setItem(QS_KEY, JSON.stringify(qs));
  } catch {
    /* 忽略写入失败 */
  }
}

interface LibraryState {
  builtin: Asset[];
  user: Asset[];
  loaded: boolean;
  quickSlots: QuickSlots;
  load: () => Promise<void>;
  getAsset: (id: string) => Asset | undefined;
  uploadFiles: (files: FileList | File[]) => Promise<number>;
  renameUserAsset: (id: string, name: string) => Promise<void>;
  removeUserAsset: (id: string) => Promise<void>;
  setQuickSlots: (group: string, slots: (string | null)[]) => void;
  resetQuickSlots: (group: string) => void;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('读取失败'));
    r.readAsDataURL(file);
  });
}

function buildAssetInUseMessage(usages: Awaited<ReturnType<typeof listAssetUsages>>) {
  const totalRefs = usages.reduce((sum, usage) => sum + usage.nodeCount, 0);
  const preview = usages
    .slice(0, 3)
    .map((usage) => `${usage.worldName}（${usage.nodeCount} 个节点）`)
    .join('、');
  const suffix = usages.length > 3 ? ` 等 ${usages.length} 个世界` : '';
  return `该素材仍被 ${totalRefs} 个节点引用：${preview}${suffix}。请先替换或删除这些节点，再移除素材。`;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  builtin: BUILTIN_ASSETS,
  user: [],
  loaded: false,
  quickSlots: loadQuickSlots(),

  async load() {
    const stored = await listAssets();
    set({ user: stored.filter((a) => !a.builtin), loaded: true });
  },

  getAsset(id) {
    return getBuiltinAsset(id) ?? get().user.find((a) => a.id === id);
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
    const usages = await listAssetUsages(id);
    if (usages.length > 0) {
      throw new Error(buildAssetInUseMessage(usages));
    }
    await deleteAsset(id);
    await get().load();
  },

  setQuickSlots(group, slots) {
    const arr = slots.slice(0, QUICK_SLOT_COUNT);
    while (arr.length < QUICK_SLOT_COUNT) arr.push(null);
    const next = { ...get().quickSlots, [group]: arr };
    saveQuickSlots(next);
    set({ quickSlots: next });
  },

  resetQuickSlots(group) {
    const def = defaultQuickSlots()[group] ?? Array(QUICK_SLOT_COUNT).fill(null);
    const next = { ...get().quickSlots, [group]: def };
    saveQuickSlots(next);
    set({ quickSlots: next });
  },
}));

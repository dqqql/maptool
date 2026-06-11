/* =========================================================================
   当前打开世界的画布状态（Zustand）
   所有变更走 store → 防抖写 IndexedDB，刷新不丢数据。
   ========================================================================= */
import { create } from 'zustand';
import type { Viewport, WorldData, MapNode, Edge, TextBox, CustomProp } from '../types';
import { DEFAULT_VIEWPORT } from '../types';
import { getWorldData, putWorldData, touchWorld } from '../db/idb';

const NODE_DEFAULT_SIZE = 92;

interface WorldState {
  worldId: string | null;
  loaded: boolean;
  viewport: Viewport;
  nodes: MapNode[];
  edges: Edge[];
  texts: TextBox[];
  selectedNodeId: string | null;

  load: (worldId: string) => Promise<void>;
  unload: () => void;
  setViewport: (vp: Viewport) => void;

  // —— 节点 ——
  addNode: (assetId: string, name: string, x: number, y: number) => string;
  updateNode: (id: string, patch: Partial<MapNode>) => void;
  removeNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  select: (id: string | null) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;

  // —— 节点自定义属性（阶段 4）——
  addCustomProp: (nodeId: string, prop: CustomProp) => void;
  updateCustomProp: (nodeId: string, propId: string, patch: Partial<CustomProp>) => void;
  removeCustomProp: (nodeId: string, propId: string) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(get: () => WorldState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const s = get();
    if (!s.worldId) return;
    const data: WorldData = {
      worldId: s.worldId,
      nodes: s.nodes,
      edges: s.edges,
      texts: s.texts,
      viewport: s.viewport,
    };
    await putWorldData(data);
    await touchWorld(s.worldId);
  }, 500);
}

function maxZ(nodes: MapNode[]): number {
  return nodes.reduce((m, n) => Math.max(m, n.zIndex), 0);
}
function minZ(nodes: MapNode[]): number {
  return nodes.reduce((m, n) => Math.min(m, n.zIndex), 0);
}

export const useWorldStore = create<WorldState>((set, get) => {
  const mutate = (fn: (s: WorldState) => Partial<WorldState>) => {
    set(fn(get()));
    scheduleSave(get);
  };

  return {
    worldId: null,
    loaded: false,
    viewport: { ...DEFAULT_VIEWPORT },
    nodes: [],
    edges: [],
    texts: [],
    selectedNodeId: null,

    async load(worldId) {
      set({ loaded: false, worldId, selectedNodeId: null });
      const data = await getWorldData(worldId);
      set({
        worldId,
        loaded: true,
        viewport: data.viewport ?? { ...DEFAULT_VIEWPORT },
        nodes: data.nodes ?? [],
        edges: data.edges ?? [],
        texts: data.texts ?? [],
      });
    },

    unload() {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      set({
        worldId: null,
        loaded: false,
        viewport: { ...DEFAULT_VIEWPORT },
        nodes: [],
        edges: [],
        texts: [],
        selectedNodeId: null,
      });
    },

    setViewport(vp) {
      set({ viewport: vp });
      scheduleSave(get);
    },

    addNode(assetId, name, x, y) {
      const id = crypto.randomUUID();
      const node: MapNode = {
        id,
        assetId,
        x: x - NODE_DEFAULT_SIZE / 2,
        y: y - NODE_DEFAULT_SIZE / 2,
        width: NODE_DEFAULT_SIZE,
        height: NODE_DEFAULT_SIZE,
        rotation: 0,
        zIndex: maxZ(get().nodes) + 1,
        name,
        description: '',
        customProps: [],
      };
      mutate((s) => ({ nodes: [...s.nodes, node], selectedNodeId: id }));
      return id;
    },

    updateNode(id, patch) {
      mutate((s) => ({
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      }));
    },

    removeNode(id) {
      mutate((s) => ({
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => e.fromNodeId !== id && e.toNodeId !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      }));
    },

    duplicateNode(id) {
      const src = get().nodes.find((n) => n.id === id);
      if (!src) return;
      const copy: MapNode = {
        ...src,
        id: crypto.randomUUID(),
        x: src.x + 28,
        y: src.y + 28,
        zIndex: maxZ(get().nodes) + 1,
        customProps: src.customProps.map((p) => ({ ...p })),
      };
      mutate((s) => ({ nodes: [...s.nodes, copy], selectedNodeId: copy.id }));
    },

    select(id) {
      set({ selectedNodeId: id });
    },

    bringToFront(id) {
      mutate((s) => ({
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, zIndex: maxZ(s.nodes) + 1 } : n)),
      }));
    },
    sendToBack(id) {
      mutate((s) => ({
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, zIndex: minZ(s.nodes) - 1 } : n)),
      }));
    },
    bringForward(id) {
      const s = get();
      const sorted = [...s.nodes].sort((a, b) => a.zIndex - b.zIndex);
      const i = sorted.findIndex((n) => n.id === id);
      if (i < 0 || i === sorted.length - 1) return;
      const a = sorted[i];
      const b = sorted[i + 1];
      mutate((st) => ({
        nodes: st.nodes.map((n) =>
          n.id === a.id ? { ...n, zIndex: b.zIndex } : n.id === b.id ? { ...n, zIndex: a.zIndex } : n
        ),
      }));
    },
    sendBackward(id) {
      const s = get();
      const sorted = [...s.nodes].sort((a, b) => a.zIndex - b.zIndex);
      const i = sorted.findIndex((n) => n.id === id);
      if (i <= 0) return;
      const a = sorted[i];
      const b = sorted[i - 1];
      mutate((st) => ({
        nodes: st.nodes.map((n) =>
          n.id === a.id ? { ...n, zIndex: b.zIndex } : n.id === b.id ? { ...n, zIndex: a.zIndex } : n
        ),
      }));
    },

    addCustomProp(nodeId, prop) {
      mutate((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === nodeId ? { ...n, customProps: [...n.customProps, prop] } : n
        ),
      }));
    },
    updateCustomProp(nodeId, propId, patch) {
      mutate((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === nodeId
            ? { ...n, customProps: n.customProps.map((p) => (p.id === propId ? { ...p, ...patch } : p)) }
            : n
        ),
      }));
    },
    removeCustomProp(nodeId, propId) {
      mutate((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === nodeId ? { ...n, customProps: n.customProps.filter((p) => p.id !== propId) } : n
        ),
      }));
    },
  };
});

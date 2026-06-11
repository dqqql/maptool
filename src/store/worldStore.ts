/* =========================================================================
   当前打开世界的画布状态（Zustand）
   所有变更走 store → 防抖写 IndexedDB，刷新不丢数据。
   ========================================================================= */
import { create } from 'zustand';
import type { Viewport, WorldData, MapNode, Edge, TextBox, CustomProp } from '../types';
import { DEFAULT_VIEWPORT } from '../types';
import { getWorldData, putWorldData, touchWorld } from '../db/idb';

const NODE_DEFAULT_SIZE = 92;
const TEXT_DEFAULT = { width: 200, height: 96, background: 'rgba(255,250,235,0.85)', fontSize: 16 };

export type ToolMode = 'select' | 'pan' | 'connect' | 'text';

interface WorldState {
  worldId: string | null;
  loaded: boolean;
  viewport: Viewport;
  nodes: MapNode[];
  edges: Edge[];
  texts: TextBox[];

  // 选中（三者至多一个非空）
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedTextId: string | null;

  // 工具模式与连线进行态
  mode: ToolMode;
  connectFrom: string | null;

  load: (worldId: string) => Promise<void>;
  unload: () => void;
  setViewport: (vp: Viewport) => void;
  setMode: (m: ToolMode) => void;
  setConnectFrom: (id: string | null) => void;

  // 选中控制
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  selectText: (id: string | null) => void;
  clearSelection: () => void;
  removeSelected: () => void;

  // 节点
  addNode: (assetId: string, name: string, x: number, y: number) => string;
  updateNode: (id: string, patch: Partial<MapNode>) => void;
  removeNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;

  // 连线
  addEdge: (fromNodeId: string, toNodeId: string) => void;
  updateEdge: (id: string, patch: Partial<Edge>) => void;
  removeEdge: (id: string) => void;

  // 文本框
  addText: (x: number, y: number) => string;
  updateText: (id: string, patch: Partial<TextBox>) => void;
  removeText: (id: string) => void;

  // 节点自定义属性
  addCustomProp: (nodeId: string, prop: CustomProp) => void;
  updateCustomProp: (nodeId: string, propId: string, patch: Partial<CustomProp>) => void;
  removeCustomProp: (nodeId: string, propId: string) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let activeLoadToken = 0;

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

const maxZ = (nodes: MapNode[]) => nodes.reduce((m, n) => Math.max(m, n.zIndex), 0);
const minZ = (nodes: MapNode[]) => nodes.reduce((m, n) => Math.min(m, n.zIndex), 0);

const CLEARED = { selectedNodeId: null, selectedEdgeId: null, selectedTextId: null };

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
    selectedEdgeId: null,
    selectedTextId: null,
    mode: 'select',
    connectFrom: null,

    async load(worldId) {
      const loadToken = ++activeLoadToken;
      set({ loaded: false, worldId, ...CLEARED, mode: 'select', connectFrom: null });
      const data = await getWorldData(worldId);
      if (loadToken !== activeLoadToken || get().worldId !== worldId) return;
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
      activeLoadToken++;
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
        ...CLEARED,
        mode: 'select',
        connectFrom: null,
      });
    },

    setViewport(vp) {
      set({ viewport: vp });
      scheduleSave(get);
    },
    setMode(m) {
      set({ mode: m, connectFrom: null });
    },
    setConnectFrom(id) {
      set({ connectFrom: id });
    },

    selectNode(id) {
      set({ ...CLEARED, selectedNodeId: id });
    },
    selectEdge(id) {
      set({ ...CLEARED, selectedEdgeId: id });
    },
    selectText(id) {
      set({ ...CLEARED, selectedTextId: id });
    },
    clearSelection() {
      set({ ...CLEARED });
    },
    removeSelected() {
      const s = get();
      if (s.selectedNodeId) get().removeNode(s.selectedNodeId);
      else if (s.selectedEdgeId) get().removeEdge(s.selectedEdgeId);
      else if (s.selectedTextId) get().removeText(s.selectedTextId);
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
      mutate((s) => ({ nodes: [...s.nodes, node], ...CLEARED, selectedNodeId: id }));
      return id;
    },

    updateNode(id, patch) {
      mutate((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
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
      mutate((s) => ({ nodes: [...s.nodes, copy], ...CLEARED, selectedNodeId: copy.id }));
    },

    bringToFront(id) {
      mutate((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, zIndex: maxZ(s.nodes) + 1 } : n)) }));
    },
    sendToBack(id) {
      mutate((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, zIndex: minZ(s.nodes) - 1 } : n)) }));
    },
    bringForward(id) {
      const sorted = [...get().nodes].sort((a, b) => a.zIndex - b.zIndex);
      const i = sorted.findIndex((n) => n.id === id);
      if (i < 0 || i === sorted.length - 1) return;
      const a = sorted[i], b = sorted[i + 1];
      mutate((st) => ({
        nodes: st.nodes.map((n) => (n.id === a.id ? { ...n, zIndex: b.zIndex } : n.id === b.id ? { ...n, zIndex: a.zIndex } : n)),
      }));
    },
    sendBackward(id) {
      const sorted = [...get().nodes].sort((a, b) => a.zIndex - b.zIndex);
      const i = sorted.findIndex((n) => n.id === id);
      if (i <= 0) return;
      const a = sorted[i], b = sorted[i - 1];
      mutate((st) => ({
        nodes: st.nodes.map((n) => (n.id === a.id ? { ...n, zIndex: b.zIndex } : n.id === b.id ? { ...n, zIndex: a.zIndex } : n)),
      }));
    },

    addEdge(fromNodeId, toNodeId) {
      if (fromNodeId === toNodeId) return;
      // 避免重复连线（无向）
      const exists = get().edges.some(
        (e) =>
          (e.fromNodeId === fromNodeId && e.toNodeId === toNodeId) ||
          (e.fromNodeId === toNodeId && e.toNodeId === fromNodeId)
      );
      if (exists) return;
      const edge: Edge = {
        id: crypto.randomUUID(),
        fromNodeId,
        toNodeId,
        name: '',
        edgeType: '',
        description: '',
      };
      mutate((s) => ({ edges: [...s.edges, edge], ...CLEARED, selectedEdgeId: edge.id }));
    },
    updateEdge(id, patch) {
      mutate((s) => ({ edges: s.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
    },
    removeEdge(id) {
      mutate((s) => ({
        edges: s.edges.filter((e) => e.id !== id),
        selectedEdgeId: s.selectedEdgeId === id ? null : s.selectedEdgeId,
      }));
    },

    addText(x, y) {
      const id = crypto.randomUUID();
      const box: TextBox = {
        id,
        content: '',
        x: x - TEXT_DEFAULT.width / 2,
        y: y - TEXT_DEFAULT.height / 2,
        width: TEXT_DEFAULT.width,
        height: TEXT_DEFAULT.height,
        background: TEXT_DEFAULT.background,
        fontSize: TEXT_DEFAULT.fontSize,
      };
      mutate((s) => ({ texts: [...s.texts, box], ...CLEARED, selectedTextId: id }));
      return id;
    },
    updateText(id, patch) {
      mutate((s) => ({ texts: s.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
    },
    removeText(id) {
      mutate((s) => ({
        texts: s.texts.filter((t) => t.id !== id),
        selectedTextId: s.selectedTextId === id ? null : s.selectedTextId,
      }));
    },

    addCustomProp(nodeId, prop) {
      mutate((s) => ({ nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, customProps: [...n.customProps, prop] } : n)) }));
    },
    updateCustomProp(nodeId, propId, patch) {
      mutate((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === nodeId ? { ...n, customProps: n.customProps.map((p) => (p.id === propId ? { ...p, ...patch } : p)) } : n
        ),
      }));
    },
    removeCustomProp(nodeId, propId) {
      mutate((s) => ({
        nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, customProps: n.customProps.filter((p) => p.id !== propId) } : n)),
      }));
    },
  };
});

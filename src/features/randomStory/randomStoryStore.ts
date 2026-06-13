import { create } from 'zustand';

type SelectionKind = 'node' | 'edge' | 'text';

interface RandomStoryState {
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  selectedTextIds: string[];
  toggleSelection: (kind: SelectionKind, id: string) => void;
  clearSelection: () => void;
}

function toggle(items: string[], id: string): string[] {
  return items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
}

export const useRandomStoryStore = create<RandomStoryState>((set) => ({
  selectedNodeIds: [],
  selectedEdgeIds: [],
  selectedTextIds: [],
  toggleSelection(kind, id) {
    if (kind === 'node') {
      set((state) => ({ selectedNodeIds: toggle(state.selectedNodeIds, id) }));
    } else if (kind === 'edge') {
      set((state) => ({ selectedEdgeIds: toggle(state.selectedEdgeIds, id) }));
    } else {
      set((state) => ({ selectedTextIds: toggle(state.selectedTextIds, id) }));
    }
  },
  clearSelection() {
    set({
      selectedNodeIds: [],
      selectedEdgeIds: [],
      selectedTextIds: [],
    });
  },
}));

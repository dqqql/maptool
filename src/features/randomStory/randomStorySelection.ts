import { computeContentBounds, type BoundsRect } from '../../export/bounds';
import type { Edge, GeneratedEncounter, MapNode, TextBox } from '../../types';

const MAX_CONTEXT_LENGTH = 20_000;

export interface StorySelection {
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  selectedTextIds: string[];
}

export interface SelectionOption {
  id: string;
  label: string;
}

export interface SelectionGroups {
  nodes: SelectionOption[];
  edges: SelectionOption[];
  texts: SelectionOption[];
}

function singleLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function preview(value: string, maxLength: number): string {
  const text = singleLine(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function buildSelectionGroups(
  nodes: MapNode[],
  edges: Edge[],
  texts: TextBox[],
): SelectionGroups {
  const nodeNames = new Map(nodes.map((node) => [node.id, node.name || '未命名节点']));
  return {
    nodes: nodes.map((node) => ({ id: node.id, label: node.name || '未命名节点' })),
    edges: edges.map((edge) => ({
      id: edge.id,
      label: edge.name || `${nodeNames.get(edge.fromNodeId) ?? '未知节点'} → ${nodeNames.get(edge.toNodeId) ?? '未知节点'}`,
    })),
    texts: texts.map((text, index) => ({
      id: text.id,
      label: preview(text.content, 42) || `空白文本 ${index + 1}`,
    })),
  };
}

export function buildRandomStoryContext(
  nodes: MapNode[],
  edges: Edge[],
  texts: TextBox[],
  selection: StorySelection,
): string {
  const selectedNodes = new Set(selection.selectedNodeIds);
  const selectedEdges = new Set(selection.selectedEdgeIds);
  const selectedTexts = new Set(selection.selectedTextIds);
  const nodeNames = new Map(nodes.map((node) => [node.id, node.name || '未命名节点']));
  const sections: string[] = [];

  for (const node of nodes) {
    if (!selectedNodes.has(node.id)) continue;
    const props = node.customProps
      .map((prop) => `${prop.label}: ${String(prop.value)}`)
      .join('；');
    sections.push(
      `[节点] ${singleLine(node.name || '未命名节点')}`
      + (node.description.trim() ? `\n描述：${singleLine(node.description)}` : '')
      + (props ? `\n属性：${singleLine(props)}` : ''),
    );
  }

  for (const edge of edges) {
    if (!selectedEdges.has(edge.id)) continue;
    sections.push(
      `[连线] ${singleLine(edge.name || '未命名连线')}`
      + `\n连接：${nodeNames.get(edge.fromNodeId) ?? '未知节点'} → ${nodeNames.get(edge.toNodeId) ?? '未知节点'}`
      + (edge.edgeType.trim() ? `\n类型：${singleLine(edge.edgeType)}` : '')
      + (edge.description.trim() ? `\n描述：${singleLine(edge.description)}` : ''),
    );
  }

  for (const text of texts) {
    if (!selectedTexts.has(text.id)) continue;
    sections.push(`[文本]\n${text.content.trim()}`);
  }

  const context = sections.join('\n\n');
  if (context.length <= MAX_CONTEXT_LENGTH) return context;
  return `${context.slice(0, MAX_CONTEXT_LENGTH - 10)}\n[已截断]`;
}

export function selectedContentBounds(
  nodes: MapNode[],
  edges: Edge[],
  texts: TextBox[],
  selection: StorySelection,
): BoundsRect | null {
  const nodeIds = new Set(selection.selectedNodeIds);
  const selectedEdgeIds = new Set(selection.selectedEdgeIds);
  for (const edge of edges) {
    if (!selectedEdgeIds.has(edge.id)) continue;
    nodeIds.add(edge.fromNodeId);
    nodeIds.add(edge.toNodeId);
  }
  const textIds = new Set(selection.selectedTextIds);
  return computeContentBounds(
    nodes.filter((node) => nodeIds.has(node.id)),
    texts.filter((text) => textIds.has(text.id)),
  );
}

export function cleanModelText(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function markdownList(items: string[]): string {
  return items.map((item) => `- ${cleanModelText(item)}`).join('\n');
}

export function encounterToMarkdown(encounter: GeneratedEncounter): string {
  return [
    `## ${cleanModelText(encounter.title)}`,
    `> 类型：${cleanModelText(encounter.type)}`,
    '',
    '**触发**',
    '',
    cleanModelText(encounter.hook),
    '',
    '**现场**',
    '',
    cleanModelText(encounter.scene),
    '',
    '**冲突与变化**',
    '',
    markdownList(encounter.developments),
    '',
    '**线索或互动**',
    '',
    markdownList(encounter.cluesOrInteractions),
    '',
    '**可能结局**',
    '',
    markdownList(encounter.resolutions),
  ].join('\n');
}

import { Node, Edge } from 'reactflow';

// Phase 2 stub — converts React Flow data to Mermaid DSL
export function toMermaid(
  nodes: Node[],
  edges: Edge[],
  diagramType: string
): string {
  const header = getMermaidHeader(diagramType);
  const nodeLines = nodes
    .map((n) => `  ${n.id}["${(n.data as { label?: string }).label ?? n.id}"]`)
    .join('\n');
  const edgeLines = edges
    .map((e) => `  ${e.source} --> ${e.target}`)
    .join('\n');

  return [header, nodeLines, edgeLines].filter(Boolean).join('\n');
}

function getMermaidHeader(diagramType: string): string {
  switch (diagramType) {
    case 'flowchart':
      return 'flowchart TD';
    case 'erd':
      return 'erDiagram';
    case 'class':
      return 'classDiagram';
    case 'component':
    case 'architecture':
      return 'graph LR';
    case 'activity':
      return 'stateDiagram-v2';
    default:
      return 'graph TD';
  }
}

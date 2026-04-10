import dagre from '@dagrejs/dagre';
import { Node, Edge } from 'reactflow';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;

export type LayoutDirection = 'TB' | 'LR';

export function getDirectionForType(diagramType: string): LayoutDirection {
  switch (diagramType) {
    case 'flowchart':
    case 'activity':
      return 'TB';
    default:
      return 'LR';
  }
}

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: node.width ?? NODE_WIDTH,
      height: node.height ?? NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    const w = node.width ?? NODE_WIDTH;
    const h = node.height ?? NODE_HEIGHT;
    return {
      ...node,
      position: {
        x: pos.x - w / 2,
        y: pos.y - h / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

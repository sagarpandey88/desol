import { useCallback } from 'react';
import { getLayoutedElements, getDirectionForType } from '../utils/dagre';
import { useDiagramStore } from '../stores/diagramStore';

export function useAutoLayout() {
  const { nodes, edges, meta, setNodes, setEdges } = useDiagramStore();
  const direction = getDirectionForType(meta?.diagramType ?? '');

  const runLayout = useCallback(() => {
    if (nodes.length === 0) return;
    const { nodes: layoutedNodes, edges: layoutedEdges } =
      getLayoutedElements(nodes, edges, direction);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges, direction, setNodes, setEdges]);

  return { runLayout };
}

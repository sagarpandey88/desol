import { create } from 'zustand';
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Viewport,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from 'reactflow';

export interface DiagramMeta {
  id: string;
  name: string;
  diagramType: string;
}

export type EdgeStyle = 'default' | 'smoothstep' | 'straight';

function cloneNode(node: Node): Node {
  if (typeof structuredClone === 'function') {
    return structuredClone(node) as Node;
  }
  return JSON.parse(JSON.stringify(node)) as Node;
}

function normalizeNode(node: Node): Node {
  if (node.type !== 'groupNode') return node;
  return {
    ...node,
    zIndex: -1,
  };
}

function normalizeNodes(nodes: Node[]): Node[] {
  return nodes.map(normalizeNode);
}

interface DiagramState {
  meta: DiagramMeta | null;
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  isDirty: boolean;
  savedSnapshot: {
    nodes: Node[];
    edges: Edge[];
    viewport: Viewport;
  } | null;
  edgeStyle: EdgeStyle;
  /** Whether new edges are created with animation by default */
  edgeAnimated: boolean;
  /** Default Lucide icon key for new edges (e.g. 'zap') */
  edgeIcon: string | undefined;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  copiedNode: Node | null;

  // Actions
  loadDiagram: (
    meta: DiagramMeta,
    flowData: { nodes: Node[]; edges: Edge[]; viewport: Viewport }
  ) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  updateEdgeData: (id: string, patch: Record<string, unknown>) => void;
  setDiagramName: (name: string) => void;
  setViewport: (viewport: Viewport) => void;
  setEdgeStyle: (style: EdgeStyle) => void;
  setEdgeAnimated: (animated: boolean) => void;
  setEdgeIcon: (icon: string | undefined) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  copySelectedNode: () => void;
  pasteCopiedNode: () => string | null;
  /** Move nodes into a group (sets parentNode + extent) */
  assignNodesToGroup: (nodeIds: string[], groupId: string) => void;
  /** Remove nodes from their group */
  ungroupNodes: (nodeIds: string[]) => void;
  markSaved: () => void;
  discardChanges: () => void;
  reset: () => void;
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
  meta: null,
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  isDirty: false,
  savedSnapshot: null,
  edgeStyle: 'smoothstep',
  edgeAnimated: false,
  edgeIcon: undefined,
  selectedNodeId: null,
  selectedEdgeId: null,
  copiedNode: null,

  loadDiagram(meta, flowData) {
    const normalizedNodes = normalizeNodes(flowData.nodes);
    const snapshot = {
      nodes: normalizedNodes,
      edges: flowData.edges,
      viewport: flowData.viewport,
    };
    set({
      meta,
      nodes: normalizedNodes,
      edges: flowData.edges,
      viewport: flowData.viewport,
      isDirty: false,
      savedSnapshot: snapshot,
      selectedNodeId: null,
    });
  },

  setNodes(nodes) {
    set({ nodes: normalizeNodes(nodes), isDirty: true });
  },

  setEdges(edges) {
    set({ edges, isDirty: true });
  },

  onNodesChange(changes) {
    set((state) => ({
      nodes: normalizeNodes(applyNodeChanges(changes, state.nodes)),
      isDirty: true,
    }));
  },

  onEdgesChange(changes) {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isDirty: true,
    }));
  },

  onConnect(connection) {
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          type: 'diagramEdge',
          data: {
            animated: state.edgeAnimated,
            icon: state.edgeIcon,
            edgeStyle: state.edgeStyle,
          },
        },
        state.edges
      ),
      isDirty: true,
    }));
  },

  addNode(node) {
    set((state) => ({
      nodes: [...state.nodes, normalizeNode(node)],
      isDirty: true,
    }));
  },

  updateNodeData(id, data) {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
      isDirty: true,
    }));
  },

  updateEdgeData(id, patch) {
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === id ? { ...e, data: { ...((e.data as Record<string, unknown>) ?? {}), ...patch } } : e
      ),
      isDirty: true,
    }));
  },

  setDiagramName(name) {
    set((state) => ({
      meta: state.meta ? { ...state.meta, name } : null,
      isDirty: true,
    }));
  },

  setViewport(viewport) {
    set({ viewport });
  },

  setEdgeStyle(style) {
    set({ edgeStyle: style });
  },

  setEdgeAnimated(animated) {
    set({ edgeAnimated: animated });
  },

  setEdgeIcon(icon) {
    set({ edgeIcon: icon });
  },

  setSelectedNodeId(id) {
    set({ selectedNodeId: id });
  },

  setSelectedEdgeId(id) {
    set({ selectedEdgeId: id });
  },

  copySelectedNode() {
    const { selectedNodeId, nodes } = get();
    if (!selectedNodeId) return;

    const selectedNode = nodes.find((node) => node.id === selectedNodeId);
    if (!selectedNode) return;

    set({ copiedNode: cloneNode(selectedNode) });
  },

  pasteCopiedNode() {
    const { copiedNode } = get();
    if (!copiedNode) return null;

    const newNodeId = `${copiedNode.type}-${Date.now()}`;
    const newNode = normalizeNode({
      ...cloneNode(copiedNode),
      id: newNodeId,
      position: {
        x: copiedNode.position.x + 24,
        y: copiedNode.position.y + 24,
      },
    });

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: newNodeId,
      selectedEdgeId: null,
      isDirty: true,
    }));

    return newNodeId;
  },

  assignNodesToGroup(nodeIds, groupId) {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        nodeIds.includes(n.id)
          ? { ...n, parentNode: groupId, extent: 'parent' as const }
          : n
      ),
      isDirty: true,
    }));
  },

  ungroupNodes(nodeIds) {
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (!nodeIds.includes(n.id)) return n;
        const { parentNode: _p, extent: _e, ...rest } = n as Node & { parentNode?: string; extent?: string };
        return rest as Node;
      }),
      isDirty: true,
    }));
  },

  markSaved() {
    const { nodes, edges, viewport } = get();
    set({
      isDirty: false,
      savedSnapshot: { nodes, edges, viewport },
    });
  },

  discardChanges() {
    const { savedSnapshot } = get();
    if (!savedSnapshot) return;
    set({
      nodes: savedSnapshot.nodes,
      edges: savedSnapshot.edges,
      viewport: savedSnapshot.viewport,
      isDirty: false,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  reset() {
    set({
      meta: null,
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      isDirty: false,
      savedSnapshot: null,
      selectedNodeId: null,
      selectedEdgeId: null,
      copiedNode: null,
    });
  },
}));

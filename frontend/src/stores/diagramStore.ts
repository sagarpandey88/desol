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
  selectedNodeId: string | null;

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
  setDiagramName: (name: string) => void;
  setViewport: (viewport: Viewport) => void;
  setEdgeStyle: (style: EdgeStyle) => void;
  setSelectedNodeId: (id: string | null) => void;
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
  selectedNodeId: null,

  loadDiagram(meta, flowData) {
    const snapshot = {
      nodes: flowData.nodes,
      edges: flowData.edges,
      viewport: flowData.viewport,
    };
    set({
      meta,
      nodes: flowData.nodes,
      edges: flowData.edges,
      viewport: flowData.viewport,
      isDirty: false,
      savedSnapshot: snapshot,
      selectedNodeId: null,
    });
  },

  setNodes(nodes) {
    set({ nodes, isDirty: true });
  },

  setEdges(edges) {
    set({ edges, isDirty: true });
  },

  onNodesChange(changes) {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
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
        { ...connection, type: state.edgeStyle },
        state.edges
      ),
      isDirty: true,
    }));
  },

  addNode(node) {
    set((state) => ({
      nodes: [...state.nodes, node],
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

  setSelectedNodeId(id) {
    set({ selectedNodeId: id });
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
    });
  },
}));

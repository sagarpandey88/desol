import { useRef, useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  type EdgeTypes,
  type OnSelectionChangeParams,
} from 'reactflow';
import { useDiagramStore } from '../../stores/diagramStore';
import { nodeTypes } from '../nodes';
import NodePropertiesPanel from './NodePropertiesPanel';
import VersionHistoryDrawer from './VersionHistoryDrawer';
import DiagramEdge from './edges/DiagramEdge';

const edgeTypes: EdgeTypes = {
  diagramEdge: DiagramEdge,
};

// Context menu state
interface CtxMenu {
  x: number;
  y: number;
  nodeId: string;
}

// Group assignment modal state
interface GroupAssignModal {
  x: number;
  y: number;
  nodeId: string;
}

interface DiagramCanvasProps {
  showHistory: boolean;
  onCloseHistory: () => void;
  onRestored: () => void;
}

function CanvasInner({
  showHistory,
  onCloseHistory,
  onRestored,
}: DiagramCanvasProps) {
  const {
    meta,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeId,
    setSelectedEdgeId,
    selectedNodeId,
    selectedEdgeId,
    setViewport,
  } = useDiagramStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [groupAssignModal, setGroupAssignModal] = useState<GroupAssignModal | null>(null);

  // Groups available on canvas for the "Add to group" feature
  const groups = nodes.filter((n) => n.type === 'groupNode');

  // Handle drag-over
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle drop from palette
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData('application/desol-node');
      if (!raw) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const { nodeType, nodeData } = JSON.parse(raw) as {
        nodeType: string;
        nodeData: Record<string, unknown>;
      };

      const position = project({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: nodeData,
        // Give group nodes a default size and send them behind other nodes
        ...(nodeType === 'groupNode' && {
          style: { width: 280, height: 180 },
          zIndex: -1,
        }),
      };

      addNode(newNode);
    },
    [project, addNode]
  );

  // Track node selection
  const onSelectionChange = useCallback(
    ({ nodes: selected }: OnSelectionChangeParams) => {
      setSelectedNodeId(selected[0]?.id ?? null);
    },
    [setSelectedNodeId]
  );

  // Right-click context menu on node
  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: Node) => {
      e.preventDefault();
      setCtxMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
    },
    []
  );

  // Close context menu on canvas click
  const onPaneClick = useCallback(() => {
    setCtxMenu(null);
    setGroupAssignModal(null);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [setSelectedNodeId, setSelectedEdgeId]);

  // Edge click → select edge, deselect node
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdgeId(edge.id);
      setSelectedNodeId(null);
    },
    [setSelectedEdgeId, setSelectedNodeId]
  );

  function duplicateNode(nodeId: string) {
    const original = nodes.find((n) => n.id === nodeId);
    if (!original) return;
    const newNode: Node = {
      ...original,
      id: `${original.type}-${Date.now()}`,
      position: { x: original.position.x + 40, y: original.position.y + 40 },
      // Don't inherit group membership on duplicate
      parentNode: undefined,
      extent: undefined,
    };
    addNode(newNode);
    setCtxMenu(null);
  }

  function deleteNode(nodeId: string) {
    onNodesChange([{ type: 'remove', id: nodeId }]);
    setCtxMenu(null);
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }

  return (
    <div
      ref={reactFlowWrapper}
      className="editor-canvas"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {nodes.length === 0 && (
        <div className="canvas-empty-hint">
          <span style={{ fontSize: 40, opacity: 0.3 }}>🖱️</span>
          <p style={{ fontSize: 13 }}>Drag nodes from the sidebar to get started</p>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        onMoveEnd={(_, viewport) => setViewport(viewport)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
        onEdgeClick={onEdgeClick}
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={2}
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Node Properties Panel */}
      {(selectedNodeId || selectedEdgeId) && !showHistory && <NodePropertiesPanel />}

      {/* Version History Drawer */}
      {showHistory && meta && (
        <VersionHistoryDrawer
          diagramId={meta.id}
          onClose={onCloseHistory}
          onRestored={onRestored}
        />
      )}

      {/* Context Menu */}
      {ctxMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
            onClick={() => setCtxMenu(null)}
          />
          <div
            className="canvas-ctx-menu"
            style={{ top: ctxMenu.y, left: ctxMenu.x }}
          >
            <div
              className="ctx-menu-item"
              onClick={() => {
                setSelectedNodeId(ctxMenu.nodeId);
                setCtxMenu(null);
              }}
            >
              ✏️ Edit properties
            </div>
            <div
              className="ctx-menu-item"
              onClick={() => duplicateNode(ctxMenu.nodeId)}
            >
              📋 Duplicate
            </div>
            {/* Only show "Add to group" for non-group nodes */}
            {nodes.find((n) => n.id === ctxMenu.nodeId)?.type !== 'groupNode' && (
              <div
                className={`ctx-menu-item${groups.length === 0 ? ' disabled' : ''}`}
                onClick={() => {
                  if (groups.length === 0) return;
                  setGroupAssignModal({ x: ctxMenu.x, y: ctxMenu.y, nodeId: ctxMenu.nodeId });
                  setCtxMenu(null);
                }}
                title={groups.length === 0 ? 'No groups on canvas' : 'Move into a group'}
                style={{ opacity: groups.length === 0 ? 0.4 : 1, cursor: groups.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                📦 Add to group
              </div>
            )}
            <div
              className="ctx-menu-item danger"
              onClick={() => deleteNode(ctxMenu.nodeId)}
            >
              🗑️ Delete
            </div>
          </div>
        </>
      )}

      {/* Group Assignment Modal */}
      {groupAssignModal && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 59 }}
            onClick={() => setGroupAssignModal(null)}
          />
          <div
            className="canvas-ctx-menu"
            style={{ top: groupAssignModal.y, left: groupAssignModal.x, minWidth: 180 }}
          >
            <div style={{ padding: '6px 10px', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
              SELECT GROUP
            </div>
            {groups.map((g) => (
              <div
                key={g.id}
                className="ctx-menu-item"
                onClick={() => {
                  useDiagramStore.getState().assignNodesToGroup([groupAssignModal.nodeId], g.id);
                  setGroupAssignModal(null);
                }}
              >
                {(g.data as { label?: string }).label ?? 'Group'}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DiagramCanvas(props: DiagramCanvasProps) {
  return <CanvasInner {...props} />;
}

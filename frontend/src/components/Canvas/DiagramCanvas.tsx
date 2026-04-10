import { useRef, useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type OnSelectionChangeParams,
} from 'reactflow';
import { useDiagramStore } from '../../stores/diagramStore';
import { nodeTypes } from '../nodes';
import NodePropertiesPanel from './NodePropertiesPanel';
import VersionHistoryDrawer from './VersionHistoryDrawer';

// Context menu state
interface CtxMenu {
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
    selectedNodeId,
    setViewport,
  } = useDiagramStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

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
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  function duplicateNode(nodeId: string) {
    const original = nodes.find((n) => n.id === nodeId);
    if (!original) return;
    const newNode: Node = {
      ...original,
      id: `${original.type}-${Date.now()}`,
      position: { x: original.position.x + 40, y: original.position.y + 40 },
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
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
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
      {selectedNodeId && !showHistory && <NodePropertiesPanel />}

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
            <div
              className="ctx-menu-item danger"
              onClick={() => deleteNode(ctxMenu.nodeId)}
            >
              🗑️ Delete
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DiagramCanvas(props: DiagramCanvasProps) {
  return <CanvasInner {...props} />;
}

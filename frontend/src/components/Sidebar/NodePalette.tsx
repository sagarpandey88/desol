import { useReactFlow } from 'reactflow';
import { useDiagramStore, type EdgeStyle } from '../../stores/diagramStore';

const ARCH_ITEMS = [
  { label: 'Service',  type: 'archNode', icon: '⚙️',  data: { name: 'Service',  serviceType: 'API',      color: '#6366f1' } },
  { label: 'Database', type: 'archNode', icon: '🗄️', data: { name: 'Database', serviceType: 'Database', color: '#10b981' } },
  { label: 'Client',   type: 'archNode', icon: '💻', data: { name: 'Client',   serviceType: 'UI',       color: '#f59e0b' } },
  { label: 'External', type: 'archNode', icon: '🌐', data: { name: 'External', serviceType: 'External', color: '#ef4444' } },
];

const FLOW_ITEMS = [
  { label: 'Process',  type: 'flowNode', icon: '▭', data: { label: 'Process',      shape: 'rect'          } },
  { label: 'Decision', type: 'flowNode', icon: '◇', data: { label: 'Decision?',    shape: 'diamond'       } },
  { label: 'Terminal', type: 'flowNode', icon: '○', data: { label: 'Start / End',  shape: 'oval'          } },
  { label: 'I/O',      type: 'flowNode', icon: '▱', data: { label: 'Input/Output', shape: 'parallelogram' } },
];

const ERD_ITEMS = [
  {
    label: 'Table', type: 'erdNode', icon: '🗃️',
    data: { tableName: 'table_name', fields: [{ name: 'id', type: 'UUID', isPrimaryKey: true }] },
  },
];

const CLASS_ITEMS = [
  { label: 'Class',     type: 'classNode', icon: '📦', data: { className: 'MyClass',       attributes: [], methods: [] } },
  { label: 'Interface', type: 'classNode', icon: '🔷', data: { className: '<<Interface>>', attributes: [], methods: [] } },
];

const COMPONENT_ITEMS = [
  { label: 'Component', type: 'componentNode', icon: '🧩', data: { componentName: 'Component', interfaces: [] } },
];

const ACTIVITY_ITEMS = [
  { label: 'Action',   type: 'activityNode', icon: '▭', data: { label: 'Action',    activityType: 'action'   } },
  { label: 'Decision', type: 'activityNode', icon: '◇', data: { label: 'Decision?', activityType: 'decision' } },
  { label: 'Fork',     type: 'activityNode', icon: '━', data: { label: '',          activityType: 'fork'     } },
  { label: 'Join',     type: 'activityNode', icon: '━', data: { label: '',          activityType: 'join'     } },
  { label: 'Start',    type: 'activityNode', icon: '●', data: { label: '',          activityType: 'start'    } },
  { label: 'End',      type: 'activityNode', icon: '◉', data: { label: '',          activityType: 'end'      } },
];

interface PaletteItem {
  label: string;
  type: string;
  icon: string;
  data: Record<string, unknown>;
}

const PALETTE_MAP: Record<string, PaletteItem[]> = {
  architecture: ARCH_ITEMS,
  flowchart:    FLOW_ITEMS,
  erd:          ERD_ITEMS,
  class:        CLASS_ITEMS,
  component:    COMPONENT_ITEMS,
  activity:     ACTIVITY_ITEMS,
};

const EDGE_STYLES: { value: EdgeStyle; label: string }[] = [
  { value: 'default',    label: 'Bezier'   },
  { value: 'smoothstep', label: 'Smooth'   },
  { value: 'straight',   label: 'Straight' },
];

interface NodePaletteProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function NodePalette({ collapsed, onToggle }: NodePaletteProps) {
  const { meta, edgeStyle, setEdgeStyle } = useDiagramStore();
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const items = PALETTE_MAP[meta?.diagramType ?? ''] ?? [];

  function handleDragStart(
    e: React.DragEvent,
    nodeType: string,
    nodeData: Record<string, unknown>
  ) {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData(
      'application/desol-node',
      JSON.stringify({ nodeType, nodeData })
    );
  }

  return (
    <aside className={`editor-sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
      <div className="sidebar-toggle">
        <button
          className="btn btn-ghost btn-sm"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ padding: '4px 6px' }}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-inner">
          {/* Node Types */}
          <div>
            <p className="sidebar-section-title">Nodes — drag to canvas</p>
            {items.map((item) => (
              <div
                key={item.label}
                className="palette-item"
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, item.type, item.data as Record<string, unknown>)
                }
              >
                <span className="palette-item__icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>

          {/* Edge Style */}
          <div>
            <p className="sidebar-section-title">Edge style</p>
            <div className="edge-style-picker">
              {EDGE_STYLES.map((s) => (
                <button
                  key={s.value}
                  className={`edge-style-btn${edgeStyle === s.value ? ' active' : ''}`}
                  onClick={() => setEdgeStyle(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* View Controls */}
          <div className="sidebar-controls">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => fitView({ padding: 0.1 })}
            >
              Fit View
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => zoomIn()}
            >
              Zoom In
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => zoomOut()}
            >
              Zoom Out
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

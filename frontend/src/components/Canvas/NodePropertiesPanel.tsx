import { useDiagramStore } from '../../stores/diagramStore';
import type { ArchNodeData } from '../nodes/ArchNode';
import type { FlowNodeData } from '../nodes/FlowNode';
import type { ERDNodeData, ERDField } from '../nodes/ERDNode';
import type { ClassNodeData } from '../nodes/ClassNode';
import type { ComponentNodeData } from '../nodes/ComponentNode';
import type { ActivityNodeData } from '../nodes/ActivityNode';
import type { GroupNodeData } from '../nodes/GroupNode';
import type { DiagramEdgeData } from './edges/DiagramEdge';
import IconPicker from '../shared/IconPicker';
import type { EdgeStyle } from '../../stores/diagramStore';

export default function NodePropertiesPanel() {
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    updateNodeData,
    updateEdgeData,
    setSelectedNodeId,
    setSelectedEdgeId,
  } = useDiagramStore();

  // Show edge properties if an edge is selected
  const selectedEdge = selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) : null;
  if (selectedEdge) {
    const edgeData = (selectedEdge.data ?? {}) as DiagramEdgeData;
    return (
      <div className="node-props-panel">
        <div className="node-props-header">
          <span>Edge Properties</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSelectedEdgeId(null)}
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="node-props-body">
          <EdgeProps
            data={edgeData}
            onUpdate={(patch) => updateEdgeData(selectedEdge.id, patch)}
          />
        </div>
      </div>
    );
  }

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  function update(data: Record<string, unknown>) {
    updateNodeData(node!.id, data);
  }
  return (
    <div className="node-props-panel">
      <div className="node-props-header">
        <span>Properties</span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setSelectedNodeId(null)}
          title="Close"
        >
          ✕
        </button>
      </div>
      <div className="node-props-body">
        {node.type === 'archNode' && (
          <ArchProps data={node.data as ArchNodeData} onUpdate={update} />
        )}
        {node.type === 'flowNode' && (
          <FlowProps data={node.data as FlowNodeData} onUpdate={update} />
        )}
        {node.type === 'erdNode' && (
          <ERDProps data={node.data as ERDNodeData} onUpdate={update} />
        )}
        {node.type === 'classNode' && (
          <ClassProps data={node.data as ClassNodeData} onUpdate={update} />
        )}
        {node.type === 'componentNode' && (
          <ComponentProps
            data={node.data as ComponentNodeData}
            onUpdate={update}
          />
        )}
        {node.type === 'activityNode' && (
          <ActivityProps
            data={node.data as ActivityNodeData}
            onUpdate={update}
          />
        )}
        {node.type === 'groupNode' && (
          <GroupProps
            nodeId={node.id}
            data={node.data as GroupNodeData}
            onUpdate={update}
          />
        )}
      </div>
    </div>
  );
}

/* ===== Per-type property forms ===== */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

function ArchProps({
  data,
  onUpdate,
}: {
  data: ArchNodeData;
  onUpdate: (d: Record<string, unknown>) => void;
}) {
  return (
    <>
      <Field label="Name">
        <input
          className="form-input"
          value={data.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
      </Field>
      <Field label="Service Type">
        <input
          className="form-input"
          value={data.serviceType ?? ''}
          onChange={(e) => onUpdate({ serviceType: e.target.value })}
        />
      </Field>
      <Field label="Description">
        <textarea
          className="form-input"
          rows={3}
          value={data.description ?? ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
          placeholder="Optional description..."
        />
      </Field>
      <Field label="Colour">
        <input
          type="color"
          value={data.color ?? '#6366f1'}
          onChange={(e) => onUpdate({ color: e.target.value })}
          style={{ width: '100%', height: 36, cursor: 'pointer', border: 'none', background: 'none' }}
        />
      </Field>
      <Field label="Header Icon">
        <IconPicker
          value={data.icon}
          onChange={(v) => onUpdate({ icon: v })}
        />
      </Field>
      <Field label="Header Image URL">
        <input
          className="form-input"
          placeholder="https://example.com/logo.svg"
          value={data.headerImageUrl ?? ''}
          onChange={(e) => onUpdate({ headerImageUrl: e.target.value || undefined })}
        />
      </Field>
    </>
  );
}

function FlowProps({
  data,
  onUpdate,
}: {
  data: FlowNodeData;
  onUpdate: (d: Record<string, unknown>) => void;
}) {
  return (
    <>
      <Field label="Label">
        <input
          className="form-input"
          value={data.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
      </Field>
      <Field label="Shape">
        <select
          className="form-input"
          value={data.shape}
          onChange={(e) => onUpdate({ shape: e.target.value })}
        >
          <option value="rect">Rectangle</option>
          <option value="diamond">Diamond</option>
          <option value="oval">Oval / Terminal</option>
          <option value="parallelogram">Parallelogram (I/O)</option>
        </select>
      </Field>
    </>
  );
}

function ERDProps({
  data,
  onUpdate,
}: {
  data: ERDNodeData;
  onUpdate: (d: Record<string, unknown>) => void;
}) {
  function updateField(i: number, patch: Partial<ERDField>) {
    const fields = data.fields.map((f, idx) =>
      idx === i ? { ...f, ...patch } : f
    );
    onUpdate({ fields });
  }
  function addField() {
    onUpdate({
      fields: [...data.fields, { name: 'column', type: 'VARCHAR', nullable: true }],
    });
  }
  function removeField(i: number) {
    onUpdate({ fields: data.fields.filter((_, idx) => idx !== i) });
  }

  return (
    <>
      <Field label="Table Name">
        <input
          className="form-input"
          value={data.tableName}
          onChange={(e) => onUpdate({ tableName: e.target.value })}
        />
      </Field>
      <p className="form-label" style={{ marginTop: 8 }}>Fields</p>
      {data.fields.map((f, i) => (
        <div
          key={i}
          style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 8, marginBottom: 6 }}
        >
          <input
            className="form-input"
            style={{ marginBottom: 4 }}
            placeholder="Field name"
            value={f.name}
            onChange={(e) => updateField(i, { name: e.target.value })}
          />
          <input
            className="form-input"
            style={{ marginBottom: 4 }}
            placeholder="Type"
            value={f.type}
            onChange={(e) => updateField(i, { type: e.target.value })}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 12 }}>
            <label>
              <input type="checkbox" checked={!!f.isPrimaryKey} onChange={(e) => updateField(i, { isPrimaryKey: e.target.checked })} /> PK
            </label>
            <label>
              <input type="checkbox" checked={!!f.isForeignKey} onChange={(e) => updateField(i, { isForeignKey: e.target.checked })} /> FK
            </label>
            <label>
              <input type="checkbox" checked={!!f.nullable} onChange={(e) => updateField(i, { nullable: e.target.checked })} /> Nullable
            </label>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => removeField(i)}>
            Remove
          </button>
        </div>
      ))}
      <button className="btn btn-secondary btn-sm" onClick={addField}>
        + Add Field
      </button>
    </>
  );
}

function ClassProps({
  data,
  onUpdate,
}: {
  data: ClassNodeData;
  onUpdate: (d: Record<string, unknown>) => void;
}) {
  return (
    <>
      <Field label="Class Name">
        <input
          className="form-input"
          value={data.className}
          onChange={(e) => onUpdate({ className: e.target.value })}
        />
      </Field>
      <p className="form-label" style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
        Attributes ({data.attributes.length}) and Methods ({data.methods.length}) — edit JSON below
      </p>
      <Field label="Attributes (JSON)">
        <textarea
          className="form-input"
          rows={4}
          value={JSON.stringify(data.attributes, null, 2)}
          onChange={(e) => {
            try { onUpdate({ attributes: JSON.parse(e.target.value) }); } catch { /* ignore */ }
          }}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, resize: 'vertical' }}
        />
      </Field>
      <Field label="Methods (JSON)">
        <textarea
          className="form-input"
          rows={4}
          value={JSON.stringify(data.methods, null, 2)}
          onChange={(e) => {
            try { onUpdate({ methods: JSON.parse(e.target.value) }); } catch { /* ignore */ }
          }}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, resize: 'vertical' }}
        />
      </Field>
    </>
  );
}

function ComponentProps({
  data,
  onUpdate,
}: {
  data: ComponentNodeData;
  onUpdate: (d: Record<string, unknown>) => void;
}) {
  return (
    <>
      <Field label="Component Name">
        <input
          className="form-input"
          value={data.componentName}
          onChange={(e) => onUpdate({ componentName: e.target.value })}
        />
      </Field>
      <Field label="Interfaces (JSON)">
        <textarea
          className="form-input"
          rows={5}
          value={JSON.stringify(data.interfaces, null, 2)}
          onChange={(e) => {
            try { onUpdate({ interfaces: JSON.parse(e.target.value) }); } catch { /* ignore */ }
          }}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, resize: 'vertical' }}
        />
      </Field>
    </>
  );
}

function ActivityProps({
  data,
  onUpdate,
}: {
  data: ActivityNodeData;
  onUpdate: (d: Record<string, unknown>) => void;
}) {
  return (
    <>
      <Field label="Label">
        <input
          className="form-input"
          value={data.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
      </Field>
      <Field label="Activity Type">
        <select
          className="form-input"
          value={data.activityType}
          onChange={(e) => onUpdate({ activityType: e.target.value })}
        >
          <option value="action">Action</option>
          <option value="decision">Decision</option>
          <option value="fork">Fork</option>
          <option value="join">Join</option>
          <option value="start">Start</option>
          <option value="end">End</option>
        </select>
      </Field>
    </>
  );
}

function GroupProps({
  nodeId,
  data,
  onUpdate,
}: {
  nodeId: string;
  data: GroupNodeData;
  onUpdate: (d: Record<string, unknown>) => void;
}) {
  const { nodes, updateNodeData } = useDiagramStore();
  const children = nodes.filter((n) => n.parentNode === nodeId);

  function ungroupAll() {
    children.forEach((child) => {
      updateNodeData(child.id, {});
      // Remove parentNode + extent by directly patching the node
    });
    // Use store action
    useDiagramStore.getState().ungroupNodes(children.map((c) => c.id));
  }

  return (
    <>
      <Field label="Group Label">
        <input
          className="form-input"
          value={data.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
      </Field>
      <Field label="Border Colour">
        <input
          type="color"
          value={data.color ?? '#94a3b8'}
          onChange={(e) => onUpdate({ color: e.target.value })}
          style={{ width: '100%', height: 36, cursor: 'pointer', border: 'none', background: 'none' }}
        />
      </Field>
      {children.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p className="form-label" style={{ marginBottom: 4 }}>
            Children ({children.length})
          </p>
          {children.map((c) => (
            <div key={c.id} style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '2px 0' }}>
              {c.type} — {JSON.stringify((c.data as Record<string, unknown>).name ?? (c.data as Record<string, unknown>).label ?? (c.data as Record<string, unknown>).className ?? (c.data as Record<string, unknown>).tableName ?? c.id).replace(/"/g, '')}
            </div>
          ))}
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 8, width: '100%' }}
            onClick={ungroupAll}
          >
            Ungroup all children
          </button>
        </div>
      )}
    </>
  );
}

const EDGE_STYLE_OPTIONS: { value: EdgeStyle; label: string }[] = [
  { value: 'default', label: 'Bezier' },
  { value: 'smoothstep', label: 'Smooth' },
  { value: 'straight', label: 'Straight' },
];

function EdgeProps({
  data,
  onUpdate,
}: {
  data: DiagramEdgeData;
  onUpdate: (patch: Record<string, unknown>) => void;
}) {
  return (
    <>
      <Field label="Edge Style">
        <select
          className="form-input"
          value={data.edgeStyle ?? 'default'}
          onChange={(e) => onUpdate({ edgeStyle: e.target.value as EdgeStyle })}
        >
          {EDGE_STYLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Animated">
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}
        >
          <input
            type="checkbox"
            checked={!!data.animated}
            onChange={(e) => onUpdate({ animated: e.target.checked })}
          />
          Animate this edge (marching dashes)
        </label>
      </Field>
      {data.animated && (
        <Field label="Direction">
          <select
            className="form-input"
            value={data.animationDirection ?? 'forward'}
            onChange={(e) => onUpdate({ animationDirection: e.target.value })}
          >
            <option value="forward">Forward (source → target)</option>
            <option value="reverse">Reverse (target → source)</option>
          </select>
        </Field>
      )}
      <Field label="Label">
        <input
          className="form-input"
          placeholder="Optional edge label..."
          value={data.label ?? ''}
          onChange={(e) => onUpdate({ label: e.target.value || undefined })}
        />
      </Field>
      <Field label="Icon">
        <IconPicker
          value={data.icon}
          onChange={(v) => onUpdate({ icon: v })}
        />
      </Field>
    </>
  );
}


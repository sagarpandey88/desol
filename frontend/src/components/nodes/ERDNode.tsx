import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import { Table } from 'lucide-react';

export interface ERDField {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  nullable?: boolean;
}

export interface ERDNodeData {
  tableName: string;
  fields: ERDField[];
}

function ERDNode({ data, selected }: NodeProps<ERDNodeData>) {
  return (
    <div className={`erd-node${selected ? ' selected' : ''}`}>
      <NodeResizer minWidth={160} minHeight={80} isVisible={selected} />
      <Handle type="target" position={Position.Left} />
      <Handle type="target" position={Position.Top} id="top" />
      <div className="erd-node__header" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Table size={12} style={{ flexShrink: 0, opacity: 0.7 }} />
        <span>{data.tableName}</span>
      </div>
      <div className="erd-node__fields">
        {(data.fields ?? []).map((f, i) => (
          <div key={i} className="erd-node__field">
            <span className="erd-node__field-icons">
              {f.isPrimaryKey && '🔑'}
              {f.isForeignKey && '🔗'}
            </span>
            <span className="erd-node__field-name">{f.name}</span>
            <span className="erd-node__field-type">{f.type}</span>
            {f.nullable && <span className="erd-node__nullable">?</span>}
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} />
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </div>
  );
}

export default memo(ERDNode);

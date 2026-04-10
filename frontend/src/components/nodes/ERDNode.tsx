import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

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
      <Handle type="target" position={Position.Left} />
      <Handle type="target" position={Position.Top} id="top" />
      <div className="erd-node__header">{data.tableName}</div>
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

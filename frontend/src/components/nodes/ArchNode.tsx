import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface ArchNodeData {
  name: string;
  description?: string;
  serviceType?: string;
  color?: string;
  icon?: string;
}

function ArchNode({ data, selected }: NodeProps<ArchNodeData>) {
  const color = data.color ?? '#6366f1';
  return (
    <div
      className={`arch-node${selected ? ' selected' : ''}`}
      style={{ borderColor: color, color }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="left" />
      <div className="arch-node__header" style={{ background: color }}>
        {data.icon && <span>{data.icon}</span>}
        <span>{data.serviceType ?? 'Service'}</span>
      </div>
      <div className="arch-node__body">
        <p className="arch-node__name">{data.name}</p>
        {data.description && (
          <p className="arch-node__desc">{data.description}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}

export default memo(ArchNode);

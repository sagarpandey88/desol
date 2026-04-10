import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export type FlowShape = 'rect' | 'diamond' | 'oval' | 'parallelogram';

export interface FlowNodeData {
  label: string;
  shape: FlowShape;
}

function FlowNode({ data, selected }: NodeProps<FlowNodeData>) {
  const shape = data.shape ?? 'rect';
  return (
    <div className={`flow-node ${shape}${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="left" />
      <span className="flow-node__label">{data.label}</span>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}

export default memo(FlowNode);

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export type ActivityType =
  | 'action'
  | 'decision'
  | 'fork'
  | 'join'
  | 'start'
  | 'end';

export interface ActivityNodeData {
  label: string;
  activityType: ActivityType;
}

function ActivityNode({ data, selected }: NodeProps<ActivityNodeData>) {
  const type = data.activityType ?? 'action';
  return (
    <div className={`activity-node ${type}${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="left" />
      {data.label && (
        <span className="activity-label">{data.label}</span>
      )}
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}

export default memo(ActivityNode);

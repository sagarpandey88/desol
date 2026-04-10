import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

export interface GroupNodeData {
  label: string;
  color?: string;
}

function GroupNode({ data, selected }: NodeProps<GroupNodeData>) {
  const color = data.color ?? '#94a3b8';

  return (
    <div
      className={`group-node${selected ? ' selected' : ''}`}
      style={{
        borderColor: color,
        width: '100%',
        height: '100%',
        zIndex: -1,
      }}
    >
      {/* Resize handles — visible when node is selected */}
      <NodeResizer minWidth={150} minHeight={100} isVisible={selected} />

      {/* Label badge */}
      <div
        className="group-node__label"
        style={{ background: color }}
      >
        {data.label || 'Group'}
      </div>
    </div>
  );
}

export default memo(GroupNode);

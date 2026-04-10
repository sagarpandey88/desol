import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface ComponentInterface {
  name: string;
  type: 'provided' | 'required';
}

export interface ComponentNodeData {
  componentName: string;
  interfaces: ComponentInterface[];
}

function ComponentNode({ data, selected }: NodeProps<ComponentNodeData>) {
  return (
    <div className={`component-node${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <Handle type="target" position={Position.Top} id="top" />
      <div className="component-node__header">
        <span>🧩</span>
        <span>{data.componentName}</span>
      </div>
      {(data.interfaces ?? []).length > 0 && (
        <div className="component-node__body">
          {data.interfaces.map((iface, i) => (
            <div key={i} className="component-node__interface">
              {iface.type === 'provided' ? '⊕' : '⊖'} {iface.name}
            </div>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} />
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </div>
  );
}

export default memo(ComponentNode);

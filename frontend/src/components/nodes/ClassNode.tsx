import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface ClassAttribute {
  name: string;
  type: string;
  visibility: '+' | '-' | '#' | '~';
}

export interface ClassMethod {
  name: string;
  returnType: string;
  params: string;
  visibility: '+' | '-' | '#' | '~';
}

export interface ClassNodeData {
  className: string;
  attributes: ClassAttribute[];
  methods: ClassMethod[];
}

function ClassNode({ data, selected }: NodeProps<ClassNodeData>) {
  return (
    <div className={`class-node${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="left" />
      <div className="class-node__header">{data.className}</div>

      {(data.attributes ?? []).length > 0 && (
        <div className="class-node__section">
          {data.attributes.map((a, i) => (
            <div key={i} className="class-node__row">
              <span className="class-node__vis">{a.visibility}</span>
              <span className="class-node__name">{a.name}</span>
              <span className="class-node__type">: {a.type}</span>
            </div>
          ))}
        </div>
      )}

      {(data.methods ?? []).length > 0 && (
        <div className="class-node__section">
          {data.methods.map((m, i) => (
            <div key={i} className="class-node__row">
              <span className="class-node__vis">{m.visibility}</span>
              <span className="class-node__name">
                {m.name}({m.params})
              </span>
              <span className="class-node__type">: {m.returnType}</span>
            </div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}

export default memo(ClassNode);

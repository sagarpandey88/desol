import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import { DIAGRAM_ICONS, SERVICE_TYPE_DEFAULTS } from '../../utils/diagramIcons';

export interface ArchNodeData {
  name: string;
  description?: string;
  serviceType?: string;
  color?: string;
  /** Lucide icon key override, e.g. 'server' */
  icon?: string;
  /** Optional image URL shown after icon in header */
  headerImageUrl?: string;
}

function ArchNode({ data, selected }: NodeProps<ArchNodeData>) {
  const color = data.color ?? '#6366f1';
  // Resolve icon: explicit override → service-type default → nothing
  const iconKey = data.icon ?? SERVICE_TYPE_DEFAULTS[data.serviceType ?? ''];
  const IconComp = iconKey ? DIAGRAM_ICONS[iconKey] : null;

  return (
    <div
      className={`arch-node${selected ? ' selected' : ''}`}
      style={{ borderColor: color, color }}
    >
      <NodeResizer minWidth={160} minHeight={80} isVisible={selected} />
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="left" />
      <div className="arch-node__header" style={{ background: color }}>
        {IconComp && <IconComp size={14} color="white" style={{ flexShrink: 0 }} />}
        {data.headerImageUrl && (
          <img
            src={data.headerImageUrl}
            alt=""
            style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 2, flexShrink: 0 }}
          />
        )}
        <span>{data.serviceType ?? 'Service'}</span>
      </div>
      <div className="arch-node__body">
        <p className="arch-node__name">{data.name}</p>
        {data.description && (
          <p
            className="arch-node__desc"
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              maxWidth: 180,
            }}
          >
            {data.description}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}

export default memo(ArchNode);

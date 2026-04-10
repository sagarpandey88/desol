import {
  EdgeProps,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  MarkerType,
} from 'reactflow';
import { DIAGRAM_ICONS } from '../../../utils/diagramIcons';
import { useDiagramStore } from '../../../stores/diagramStore';

export interface DiagramEdgeData {
  animated?: boolean;
  animationDirection?: 'forward' | 'reverse';
  icon?: string;
  edgeStyle?: 'default' | 'smoothstep' | 'straight';
  label?: string;
}

export default function DiagramEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data: propData,
  selected,
  markerEnd,
}: EdgeProps<DiagramEdgeData>) {
  // Subscribe directly to the store so this component re-renders whenever
  // edge data is patched via updateEdgeData(), bypassing ReactFlow's internal
  // edge-component memoization.
  const storeData = useDiagramStore(
    (s) => s.edges.find((e) => e.id === id)?.data as DiagramEdgeData | undefined
  );
  const data = storeData ?? propData;

  const style = data?.edgeStyle ?? 'default';

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (style === 'straight') {
    [edgePath, labelX, labelY] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
  } else if (style === 'smoothstep') {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  }

  const isAnimated = data?.animated ?? false;
  const animDir = data?.animationDirection ?? 'forward';
  const iconKey = data?.icon;
  const IconComp = iconKey ? DIAGRAM_ICONS[iconKey] : null;

  const strokeColor = selected ? 'var(--color-primary, #6366f1)' : 'var(--color-border-strong, #94a3b8)';

  return (
    <>
      {/* Invisible wider hit-area path for easier clicking */}
      <path
        id={`${id}-hit`}
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        style={{ cursor: 'pointer' }}
      />

      {/* Visible edge path */}
      <path
        id={id}
        className={`react-flow__edge-path${
          isAnimated
            ? animDir === 'reverse'
              ? ' diagram-edge-animated-reverse'
              : ' diagram-edge-animated'
            : ''
        }`}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={selected ? 2 : 1.5}
        strokeDasharray={isAnimated ? '6 3' : undefined}
        markerEnd={markerEnd ?? `url(#${MarkerType.ArrowClosed})`}
        style={{ transition: 'stroke 0.15s' }}
      />

      {/* Edge text label */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 11,
              background: 'var(--color-bg, white)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              padding: '1px 5px',
              pointerEvents: 'none',
              color: 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
            }}
            className="nodrag nopan"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* SVG icon at edge midpoint */}
      {IconComp && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              background: 'var(--color-bg, white)',
              border: `1.5px solid ${strokeColor}`,
              borderRadius: '50%',
              // If there's also a label, offset the icon slightly above it
              marginTop: data?.label ? -16 : 0,
            }}
            className="nodrag nopan"
          >
            <IconComp size={13} color={strokeColor} />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

import { useState, useEffect, useCallback } from 'react';
import ReactFlow, { type Node as RFNode } from 'reactflow';
import {
  listVersions,
  getVersion,
  restoreVersion,
  type Version,
  type FlowData,
} from '../../api/diagrams';
import { useDiagramStore } from '../../stores/diagramStore';

interface VersionHistoryDrawerProps {
  diagramId: string;
  onClose: () => void;
  onRestored: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VersionHistoryDrawer({
  diagramId,
  onClose,
  onRestored,
}: VersionHistoryDrawerProps) {
  const { loadDiagram, meta } = useDiagramStore();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<FlowData | null>(null);
  const [previewLabel, setPreviewLabel] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    try {
      const data = await listVersions(diagramId);
      setVersions(data);
    } finally {
      setLoading(false);
    }
  }, [diagramId]);

  useEffect(() => {
    void loadVersions();
  }, [loadVersions]);

  async function handlePreview(v: Version) {
    const full = await getVersion(diagramId, v.id);
    setPreview(full.flow_data);
    setPreviewLabel(v.label ?? `v${v.version_number}`);
  }

  async function handleRestore(v: Version) {
    if (restoring) return;
    setRestoring(true);
    setRestoringId(v.id);
    try {
      const { diagram } = await restoreVersion(diagramId, v.id);
      if (meta) {
        loadDiagram(
          { id: meta.id, name: meta.name, diagramType: meta.diagramType },
          diagram.flow_data as unknown as {
            nodes: RFNode[];
            edges: never[];
            viewport: { x: number; y: number; zoom: number };
          }
        );
      }
      setPreview(null);
      onRestored();
      onClose();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setRestoring(false);
      setRestoringId(null);
    }
  }

  return (
    <div className="version-drawer">
      <div className="version-drawer__header">
        <span>Version History</span>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          ✕
        </button>
      </div>

      {preview && (
        <div
          style={{
            borderBottom: '1px solid var(--color-border)',
            padding: '8px 16px',
            fontSize: 12,
            color: 'var(--color-text-muted)',
            background: 'var(--color-surface-2)',
          }}
        >
          Previewing: <strong>{previewLabel}</strong>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: 8 }}
            onClick={() => setPreview(null)}
          >
            Clear
          </button>
          <div
            style={{ height: 180, marginTop: 8, border: '1px solid var(--color-border)', borderRadius: 6, overflow: 'hidden' }}
          >
            <ReactFlow
              nodes={(preview.nodes as RFNode[]) ?? []}
              edges={[]}
              fitView
              panOnDrag={false}
              zoomOnScroll={false}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              proOptions={{ hideAttribution: true }}
            />
          </div>
        </div>
      )}

      <div className="version-drawer__body">
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <div className="spinner" />
          </div>
        )}

        {!loading && versions.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 24 }}>
            No versions saved yet
          </p>
        )}

        {versions.map((v) => (
          <div
            key={v.id}
            className="version-item"
            onClick={() => handlePreview(v)}
          >
            <div className="version-item__num">v{v.version_number}</div>
            <div className="version-item__info">
              <p className="version-item__label">
                {v.label ?? `Version ${v.version_number}`}
              </p>
              <p className="version-item__date">{formatDate(v.created_at)}</p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              disabled={restoring}
              onClick={(e) => {
                e.stopPropagation();
                void handleRestore(v);
              }}
            >
              {restoringId === v.id ? '…' : 'Restore'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

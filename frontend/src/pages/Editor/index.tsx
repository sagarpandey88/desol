import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Node, Edge } from 'reactflow';
import { ReactFlowProvider } from 'reactflow';
import { getDiagram, saveDiagram } from '../../api/diagrams';
import { useDiagramStore } from '../../stores/diagramStore';
import EditorHeader from '../../components/Header/EditorHeader';
import NodePalette from '../../components/Sidebar/NodePalette';
import DiagramCanvas from '../../components/Canvas/DiagramCanvas';
import CodeViewModal from '../../components/Canvas/CodeViewModal';
import DiagramChatPanel from '../../components/Canvas/DiagramChatPanel';

export default function Editor() {
  const { diagramId } = useParams<{ diagramId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const { meta, nodes, edges, viewport, isDirty, loadDiagram, markSaved, discardChanges, reset } =
    useDiagramStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCodeView, setShowCodeView] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Confirmation dialogs
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // Load diagram on mount
  useEffect(() => {
    if (!diagramId) return;

    let isMounted = true;
    setLoading(true);

    getDiagram(diagramId)
      .then((diagram) => {
        if (!isMounted) return;
        const fd = diagram.flow_data as {
          nodes: Node[];
          edges: Edge[];
          viewport: { x: number; y: number; zoom: number };
        };
        loadDiagram(
          {
            id: diagram.id,
            name: diagram.name,
            diagramType: diagram.diagram_type,
          },
          {
            nodes: fd.nodes ?? [],
            edges: fd.edges ?? [],
            viewport: fd.viewport ?? { x: 0, y: 0, zoom: 1 },
          }
        );
      })
      .catch((e: Error) => {
        if (isMounted) setError(e.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [diagramId, loadDiagram]);

  // Guard browser tab close when dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Reset store on unmount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  const handleSave = useCallback(
    async (label?: string) => {
      if (!diagramId || !meta) return;
      setSaving(true);
      try {
        await saveDiagram(
          diagramId,
          { nodes: nodes as unknown[], edges: edges as unknown[], viewport },
          meta.name,
          label
        );
        markSaved();
      } catch (e) {
        alert(`Save failed: ${(e as Error).message}`);
      } finally {
        setSaving(false);
      }
    },
    [diagramId, meta, nodes, edges, viewport, markSaved]
  );

  const getCanvasExportTarget = useCallback(() => {
    const root = canvasRef.current;
    if (!root) return null;
    return (root.querySelector('.react-flow__viewport') as HTMLElement | null) ?? root;
  }, []);

  const handleExportImage = useCallback(async () => {
    const target = getCanvasExportTarget();
    if (!target || !meta) return;
    try {
      const { exportElementAsImage } = await import('../../utils/diagramExport');
      await exportElementAsImage(target, meta.name);
    } catch (e) {
      alert(`Export failed: ${(e as Error).message}`);
    }
  }, [getCanvasExportTarget, meta]);

  const handleExportPdf = useCallback(async () => {
    const target = getCanvasExportTarget();
    if (!target || !meta) return;
    try {
      const { exportElementAsPdf } = await import('../../utils/diagramExport');
      await exportElementAsPdf(target, meta.name);
    } catch (e) {
      alert(`Export failed: ${(e as Error).message}`);
    }
  }, [getCanvasExportTarget, meta]);

  function handleDiscard() {
    if (!isDirty) return;
    setShowDiscardConfirm(true);
  }

  function confirmDiscard() {
    discardChanges();
    setShowDiscardConfirm(false);
  }

  function handleBack() {
    if (isDirty) {
      setShowBackConfirm(true);
    } else {
      navigate('/dashboard');
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-loading" style={{ flexDirection: 'column', gap: 16 }}>
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
    <div className={`editor-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Header */}
      <EditorHeader
        onSave={handleSave}
        onDiscard={handleDiscard}
        onHistory={() => setShowHistory((v) => !v)}
        onCodeView={() => setShowCodeView(true)}
        onExportImage={handleExportImage}
        onExportPdf={handleExportPdf}
        onChat={() => setShowChat((v) => !v)}
        chatOpen={showChat}
        saving={saving}
        onBack={handleBack}
      />

      {/* Sidebar */}
      <NodePalette
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Canvas */}
      <DiagramCanvas
        canvasRef={canvasRef}
        showHistory={showHistory}
        onCloseHistory={() => setShowHistory(false)}
        onRestored={() => markSaved()}
      />

      {/* Code View Modal */}
      {showCodeView && <CodeViewModal onClose={() => setShowCodeView(false)} />}

      {/* AI Chat Panel */}
      {showChat && diagramId && (
        <DiagramChatPanel
          diagramId={diagramId}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Discard confirm */}
      {showDiscardConfirm && (
        <div className="modal-overlay" onClick={() => setShowDiscardConfirm(false)}>
          <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">Discard changes?</h2>
            <p>All unsaved changes will be lost. This cannot be undone.</p>
            <div className="modal__footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDiscardConfirm(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDiscard}>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back (unsaved changes) confirm */}
      {showBackConfirm && (
        <div className="modal-overlay" onClick={() => setShowBackConfirm(false)}>
          <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">Unsaved changes</h2>
            <p>You have unsaved changes. Would you like to save before leaving?</p>
            <div className="modal__footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowBackConfirm(false);
                  navigate('/dashboard');
                }}
              >
                Leave without saving
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  setShowBackConfirm(false);
                  await handleSave();
                  navigate('/dashboard');
                }}
              >
                Save &amp; leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ReactFlowProvider>
  );
}

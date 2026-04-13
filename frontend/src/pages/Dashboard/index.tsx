import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import ReactFlow, { Background, getNodesBounds, type Edge, type Node } from 'reactflow';
import {
  listDiagrams,
  createDiagram,
  deleteDiagram,
  renameDiagram,
  moveDiagram,
  type Diagram,
} from '../../api/diagrams';
import {
  createProject,
  listProjects,
  type Project,
} from '../../api/projects';
import { nodeTypes } from '../../components/nodes';
import DiagramEdge from '../../components/Canvas/edges/DiagramEdge';

const edgeTypes = { diagramEdge: DiagramEdge };

const DIAGRAM_TYPES = [
  { value: 'architecture', label: 'Architecture Block', icon: '🏗️' },
  { value: 'flowchart', label: 'Flowchart', icon: '🔄' },
  { value: 'erd', label: 'Database / ERD', icon: '🗄️' },
  { value: 'class', label: 'Class Diagram', icon: '📦' },
  { value: 'component', label: 'Component', icon: '🧩' },
  { value: 'activity', label: 'Activity', icon: '⚡' },
] as const;

const TYPE_ICONS: Record<string, string> = {
  architecture: '🏗️',
  flowchart: '🔄',
  erd: '🗄️',
  class: '📦',
  component: '🧩',
  activity: '⚡',
};

const UNASSIGNED_PROJECT_ID = '__unassigned__';

type PdfPreviewDiagram = Diagram & {
  flow_data: {
    nodes: Node[];
    edges: Edge[];
    viewport: { x: number; y: number; zoom: number };
  };
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function sortByUpdatedDesc(items: Diagram[]) {
  return [...items].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

function groupDiagrams(diagrams: Diagram[], projects: Project[]) {
  type DiagramSection = {
    id: string;
    title: string;
    project: Project | null;
    diagrams: Diagram[];
  };

  const grouped = new Map<string, Diagram[]>();
  for (const diagram of diagrams) {
    const key = diagram.project_id ?? UNASSIGNED_PROJECT_ID;
    const items = grouped.get(key) ?? [];
    items.push(diagram);
    grouped.set(key, items);
  }

  const sections: DiagramSection[] = projects.map((project) => ({
    id: project.id,
    title: project.name,
    project,
    diagrams: sortByUpdatedDesc(grouped.get(project.id) ?? []),
  }));

  const unassigned = sortByUpdatedDesc(
    grouped.get(UNASSIGNED_PROJECT_ID) ?? []
  );

  if (unassigned.length > 0) {
    sections.push({
      id: UNASSIGNED_PROJECT_ID,
      title: 'Unassigned',
      project: null,
      diagrams: unassigned,
    });
  }

  return sections;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const userJson = localStorage.getItem('desol_user');
  const user = userJson ? (JSON.parse(userJson) as { email: string }) : null;

  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New diagram modal
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<string>('architecture');
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState('');

  // New project modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectError, setProjectError] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  // Rename modal
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');

  // Move modal
  const [moveId, setMoveId] = useState<string | null>(null);
  const [moveProjectId, setMoveProjectId] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pdfPreviewDiagram, setPdfPreviewDiagram] = useState<PdfPreviewDiagram | null>(null);
  const pdfPreviewRef = useRef<HTMLDivElement | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [diagramData, projectData] = await Promise.all([
        listDiagrams(),
        listProjects(),
      ]);
      setDiagrams(diagramData);
      setProjects(projectData);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const projectSections = useMemo(
    () => groupDiagrams(diagrams, projects),
    [diagrams, projects]
  );

  const pdfPreviewSize = useMemo(() => {
    if (!pdfPreviewDiagram) {
      return { width: 1200, height: 900 };
    }

    const bounds = getNodesBounds(pdfPreviewDiagram.flow_data.nodes);
    const padding = 240;
    return {
      width: Math.max(Math.ceil(bounds.width + padding), 1200),
      height: Math.max(Math.ceil(bounds.height + padding), 900),
    };
  }, [pdfPreviewDiagram]);

  function waitForPaint() {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }

  function loadImage(dataUrl: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to prepare PDF export'));
      image.src = dataUrl;
    });
  }

  function handleLogout() {
    localStorage.removeItem('desol_token');
    localStorage.removeItem('desol_user');
    navigate('/login', { replace: true });
  }

  async function handleCreateDiagram() {
    if (!newName.trim()) {
      setNameError('Name is required');
      return;
    }
    setCreating(true);
    setNameError('');
    try {
      const diagram = await createDiagram(
        newName.trim(),
        newType,
        newProjectId || null
      );
      setDiagrams((prev) => [diagram, ...prev]);
      setShowNew(false);
      setNewName('');
      setNewType('architecture');
      setNewProjectId('');
      navigate(`/editor/${diagram.id}`);
    } catch (e) {
      setNameError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateProject() {
    if (!projectName.trim()) {
      setProjectError('Project name is required');
      return;
    }
    setCreatingProject(true);
    setProjectError('');
    try {
      const project = await createProject(projectName.trim());
      setProjects((prev) => [project, ...prev]);
      setShowProjectModal(false);
      setProjectName('');
    } catch (e) {
      setProjectError((e as Error).message);
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleRename() {
    if (!renameId || !renameName.trim()) return;
    try {
      const updated = await renameDiagram(renameId, renameName.trim());
      setDiagrams((prev) =>
        prev.map((d) => (d.id === renameId ? updated : d))
      );
      setRenameId(null);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function handleMoveDiagram() {
    if (!moveId) return;
    try {
      const updated = await moveDiagram(
        moveId,
        moveProjectId || null
      );
      setDiagrams((prev) =>
        prev.map((d) => (d.id === moveId ? updated : d))
      );
      setMoveId(null);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteDiagram(deleteId);
      setDiagrams((prev) => prev.filter((d) => d.id !== deleteId));
      setDeleteId(null);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function handleExportProjectPdf(sectionTitle: string, items: Diagram[]) {
    if (items.length === 0) return;

    const { captureElementAsPng } = await import('../../utils/diagramExport');
    const { jsPDF } = await import('jspdf');

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 28;
    const headerHeight = 44;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2 - headerHeight;

    try {
      for (let index = 0; index < items.length; index += 1) {
        const diagram = items[index] as PdfPreviewDiagram;
        setPdfPreviewDiagram(diagram);
        await waitForPaint();

        const previewRoot = pdfPreviewRef.current;
        const previewViewport = previewRoot?.querySelector(
          '.react-flow__viewport'
        ) as HTMLElement | null;

        if (!previewViewport) {
          throw new Error('Project PDF preview not ready');
        }

        const dataUrl = await captureElementAsPng(previewViewport);
        const image = await loadImage(dataUrl);

        if (index > 0) {
          pdf.addPage();
        }

        const scale = Math.min(
          availableWidth / image.width,
          availableHeight / image.height
        );
        const imageWidth = image.width * scale;
        const imageHeight = image.height * scale;
        const imageX = margin + (availableWidth - imageWidth) / 2;
        const imageY = margin + headerHeight;

        pdf.setFontSize(16);
        pdf.setTextColor(15, 23, 42);
        pdf.text(diagram.name, margin, margin + 8);
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`${diagram.diagram_type} • ${sectionTitle}`, margin, margin + 22);
        pdf.addImage(dataUrl, 'PNG', imageX, imageY, imageWidth, imageHeight);
      }

      pdf.save(
        `${sectionTitle
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'project'}.pdf`
      );
    } finally {
      setPdfPreviewDiagram(null);
    }
  }

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <span className="dashboard-nav__logo">Desol</span>
        <div className="dashboard-nav__right">
          {user && <span className="dashboard-nav__email">{user.email}</span>}
          <ThemeToggle />
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-heading">My Diagrams</h1>
            <p className="dashboard-subheading">
              Organize diagrams into projects and move them whenever the structure changes.
            </p>
          </div>
          <div className="dashboard-header__actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowProjectModal(true)}
            >
              + New Project
            </button>
            <button className="btn btn-primary" onClick={() => setShowNew(true)}>
              + New Diagram
            </button>
          </div>
        </div>

        {loading && (
          <div className="page-loading" style={{ minHeight: 300 }}>
            <div className="spinner" />
          </div>
        )}

        {error && (
          <p style={{ color: 'var(--color-danger)', margin: '16px 0' }}>
            {error}
          </p>
        )}

        {!loading && diagrams.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">🎨</div>
            <p className="empty-state__title">No diagrams yet</p>
            <p className="empty-state__desc">
              Create a project first or jump straight into your first diagram.
            </p>
            <div className="empty-state__actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowProjectModal(true)}
              >
                Create project
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowNew(true)}
              >
                Create your first diagram
              </button>
            </div>
          </div>
        )}

        {!loading && diagrams.length > 0 && (
          <div className="diagram-sections">
            {projectSections.map((section) => (
              <section key={section.id} className="diagram-section">
                <div className="diagram-section__header">
                  <div>
                    <h2 className="diagram-section__title">
                      {section.title}
                    </h2>
                    <p className="diagram-section__meta">
                      {section.diagrams.length} diagram
                      {section.diagrams.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setNewProjectId(section.project?.id ?? '');
                      setShowNew(true);
                    }}
                  >
                    + Add Diagram
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await handleExportProjectPdf(section.title, section.diagrams);
                      } catch (err) {
                        alert((err as Error).message);
                      }
                    }}
                    disabled={section.diagrams.length === 0}
                  >
                    Export PDF
                  </button>
                </div>

                <div className="diagram-list">
                  {section.diagrams.map((diagram) => (
                    <div
                      key={diagram.id}
                      className="diagram-row"
                      onClick={() => navigate(`/editor/${diagram.id}`)}
                    >
                      <div className="diagram-row__icon">
                        {TYPE_ICONS[diagram.diagram_type] ?? '📋'}
                      </div>
                      <div className="diagram-row__body">
                        <div className="diagram-row__topline">
                          <p className="diagram-row__name">{diagram.name}</p>
                          <span className={`badge badge-${diagram.diagram_type}`}>
                            {diagram.diagram_type}
                          </span>
                        </div>
                        <div className="diagram-row__meta">
                          <span>
                            {diagram.project_name ?? section.title}
                          </span>
                          <span>{formatDate(diagram.updated_at)}</span>
                        </div>
                      </div>
                      <div className="diagram-row__actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/editor/${diagram.id}`);
                          }}
                        >
                          Open
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMoveId(diagram.id);
                            setMoveProjectId(diagram.project_id ?? '');
                          }}
                        >
                          Move
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameId(diagram.id);
                            setRenameName(diagram.name);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(diagram.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {pdfPreviewDiagram && (
        <div className="project-pdf-export-stage" ref={pdfPreviewRef} aria-hidden="true">
          <div
            className="project-pdf-export-stage__frame"
            style={{ width: pdfPreviewSize.width, height: pdfPreviewSize.height }}
          >
            <div className="project-pdf-export-stage__header">
              <h3>{pdfPreviewDiagram.name}</h3>
              <p>{pdfPreviewDiagram.diagram_type}</p>
            </div>
            <div className="project-pdf-export-stage__canvas">
              <ReactFlow
                nodes={pdfPreviewDiagram.flow_data.nodes}
                edges={pdfPreviewDiagram.flow_data.edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.15 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                panOnScroll={false}
                proOptions={{ hideAttribution: true }}
              >
                <Background gap={16} size={1} />
              </ReactFlow>
            </div>
          </div>
        </div>
      )}

      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">New Diagram</h2>

            <div className="form-group">
              <label className="form-label" htmlFor="new-name">
                Name
              </label>
              <input
                id="new-name"
                type="text"
                className={`form-input${nameError ? ' error' : ''}`}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. System Architecture"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateDiagram()}
              />
              {nameError && <span className="form-error">{nameError}</span>}
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label" htmlFor="new-project">
                Project
              </label>
              <select
                id="new-project"
                className="form-input"
                value={newProjectId}
                onChange={(e) => setNewProjectId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="sidebar-section-title" style={{ marginTop: 16 }}>
              Diagram Type
            </p>
            <div className="diagram-type-grid">
              {DIAGRAM_TYPES.map((t) => (
                <button
                  key={t.value}
                  className={`diagram-type-tile${newType === t.value ? ' selected' : ''}`}
                  onClick={() => setNewType(t.value)}
                >
                  <span className="diagram-type-tile__icon">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="modal__footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowNew(false);
                  setNewName('');
                  setNewType('architecture');
                  setNewProjectId('');
                  setNameError('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateDiagram}
                disabled={creating}
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">New Project</h2>
            <div className="form-group" style={{ marginTop: 12 }}>
              <input
                type="text"
                className={`form-input${projectError ? ' error' : ''}`}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Customer Portal"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              />
              {projectError && <span className="form-error">{projectError}</span>}
            </div>
            <div className="modal__footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowProjectModal(false);
                  setProjectName('');
                  setProjectError('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateProject}
                disabled={creatingProject}
              >
                {creatingProject ? 'Creating…' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {renameId && (
        <div className="modal-overlay" onClick={() => setRenameId(null)}>
          <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">Rename Diagram</h2>
            <div className="form-group" style={{ marginTop: 12 }}>
              <input
                type="text"
                className="form-input"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              />
            </div>
            <div className="modal__footer">
              <button
                className="btn btn-secondary"
                onClick={() => setRenameId(null)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleRename}>
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {moveId && (
        <div className="modal-overlay" onClick={() => setMoveId(null)}>
          <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">Move Diagram</h2>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label" htmlFor="move-project">
                Project
              </label>
              <select
                id="move-project"
                className="form-input"
                value={moveProjectId}
                onChange={(e) => setMoveProjectId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal__footer">
              <button
                className="btn btn-secondary"
                onClick={() => setMoveId(null)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleMoveDiagram}>
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">Delete Diagram</h2>
            <p>
              This action cannot be undone. All versions will be permanently deleted.
            </p>
            <div className="modal__footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

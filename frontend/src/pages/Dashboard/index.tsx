import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listDiagrams,
  createDiagram,
  deleteDiagram,
  renameDiagram,
  type Diagram,
} from '../../api/diagrams';

const DIAGRAM_TYPES = [
  { value: 'architecture', label: 'Architecture Block', icon: '🏗️' },
  { value: 'flowchart',    label: 'Flowchart',          icon: '🔄' },
  { value: 'erd',          label: 'Database / ERD',     icon: '🗄️' },
  { value: 'class',        label: 'Class Diagram',      icon: '📦' },
  { value: 'component',    label: 'Component',          icon: '🧩' },
  { value: 'activity',     label: 'Activity',           icon: '⚡' },
] as const;

const TYPE_ICONS: Record<string, string> = {
  architecture: '🏗️',
  flowchart:    '🔄',
  erd:          '🗄️',
  class:        '📦',
  component:    '🧩',
  activity:     '⚡',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const userJson = localStorage.getItem('desol_user');
  const user = userJson ? (JSON.parse(userJson) as { email: string }) : null;

  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New diagram modal
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<string>('architecture');
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState('');

  // Rename modal
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadDiagrams = useCallback(async () => {
    try {
      const data = await listDiagrams();
      setDiagrams(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDiagrams();
  }, [loadDiagrams]);

  function handleLogout() {
    localStorage.removeItem('desol_token');
    localStorage.removeItem('desol_user');
    navigate('/login', { replace: true });
  }

  async function handleCreate() {
    if (!newName.trim()) {
      setNameError('Name is required');
      return;
    }
    setCreating(true);
    setNameError('');
    try {
      const diagram = await createDiagram(newName.trim(), newType);
      setShowNew(false);
      setNewName('');
      setNewType('architecture');
      navigate(`/editor/${diagram.id}`);
    } catch (e) {
      setNameError((e as Error).message);
    } finally {
      setCreating(false);
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

  return (
    <div className="dashboard-page">
      {/* Top Nav */}
      <nav className="dashboard-nav">
        <span className="dashboard-nav__logo">Desol</span>
        <div className="dashboard-nav__right">
          {user && (
            <span className="dashboard-nav__email">{user.email}</span>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-heading">My Diagrams</h1>
          <button
            className="btn btn-primary"
            onClick={() => setShowNew(true)}
          >
            + New Diagram
          </button>
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
              Create your first diagram to get started
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowNew(true)}
            >
              Create your first diagram
            </button>
          </div>
        )}

        {!loading && diagrams.length > 0 && (
          <div className="diagram-grid">
            {diagrams.map((d) => (
              <div
                key={d.id}
                className="diagram-card"
                onClick={() => navigate(`/editor/${d.id}`)}
              >
                <div className="diagram-card__thumb">
                  {TYPE_ICONS[d.diagram_type] ?? '📋'}
                </div>
                <div className="diagram-card__body">
                  <p className="diagram-card__name">{d.name}</p>
                  <div className="diagram-card__meta">
                    <span className={`badge badge-${d.diagram_type}`}>
                      {d.diagram_type}
                    </span>
                    <span className="diagram-card__date">
                      {formatDate(d.updated_at)}
                    </span>
                  </div>
                </div>
                <div className="diagram-card__actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/editor/${d.id}`);
                    }}
                  >
                    Open
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameId(d.id);
                      setRenameName(d.name);
                    }}
                  >
                    Rename
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(d.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Diagram Modal */}
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
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              {nameError && (
                <span className="form-error">{nameError}</span>
              )}
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
                  setNameError('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameId && (
        <div className="modal-overlay" onClick={() => setRenameId(null)}>
          <div
            className="modal confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div
            className="modal confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal__title">Delete Diagram</h2>
            <p>
              This action cannot be undone. All versions will be permanently
              deleted.
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

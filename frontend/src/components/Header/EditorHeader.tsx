import React, { useEffect, useState, useRef } from 'react';
import { useAutoLayout } from '../../hooks/useAutoLayout';
import { useDiagramStore } from '../../stores/diagramStore';

interface EditorHeaderProps {
  onSave: (label?: string) => Promise<void>;
  onDiscard: () => void;
  onHistory: () => void;
  onCodeView: () => void;
  onExportImage: () => void;
  onExportPdf: () => void;
  saving: boolean;
  onBack: () => void;
}

export default function EditorHeader({
  onSave,
  onDiscard,
  onHistory,
  onCodeView,
  onExportImage,
  onExportPdf,
  saving,
  onBack,
}: EditorHeaderProps) {
  const { meta, isDirty, setDiagramName } = useDiagramStore();
  const { runLayout } = useAutoLayout();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr as 'dark' | 'light';
    const ls = localStorage.getItem('theme');
    if (ls === 'dark' || ls === 'light') return ls as 'dark' | 'light';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) { /* ignore */ }
  }, [theme]);

  // Close export dropdown on outside click or Escape
  useEffect(() => {
    function onDocMouse(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setExportOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setExportOpen(false);
    }
    document.addEventListener('mousedown', onDocMouse);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocMouse);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <header className="editor-header">
      {/* Left */}
      <div className="editor-header__left">
        <button
          className="btn btn-ghost btn-sm"
          onClick={onBack}
          title="Back to Dashboard"
        >
          ← Back
        </button>
      </div>

      {/* Centre — editable diagram name */}
      <div className="editor-header__center">
        <input
          className="diagram-name-input"
          value={meta?.name ?? ''}
          onChange={(e) => setDiagramName(e.target.value)}
          title="Click to rename"
          aria-label="Diagram name"
        />
        {isDirty && <span className="dirty-dot" title="Unsaved changes" />}
      </div>

      {/* Right */}
      <div className="editor-header__right">
        <button
          className="btn btn-ghost btn-sm"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onCodeView}
          title="View diagram JSON"
        >
          {'{ }'}
        </button>
        <div
          className={`dropdown${exportOpen ? ' open' : ''}`}
          style={{ position: 'relative' }}
          ref={dropdownRef}
        >
          <button
            className="btn btn-ghost btn-sm"
            tabIndex={0}
            title="Export options"
            aria-haspopup="true"
            aria-expanded={exportOpen}
            onClick={() => setExportOpen((v) => !v)}
          >
            Export
          </button>
          <ul
            tabIndex={0}
            className="dropdown-content menu p-2 shadow rounded-box w-36"
            style={{ position: 'absolute', right: 0, marginTop: 6, zIndex: 50, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            <li>
              <button className="btn btn-ghost btn-sm" onClick={() => { setExportOpen(false); onExportImage(); }} title="Save diagram as PNG">
                PNG
              </button>
            </li>
            <li>
              <button className="btn btn-ghost btn-sm" onClick={() => { setExportOpen(false); onExportPdf(); }} title="Save diagram as PDF">
                PDF
              </button>
            </li>
          </ul>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onHistory}
          title="Version History"
        >
          🕐 History
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onDiscard}
          disabled={!isDirty}
          title="Discard unsaved changes"
        >
          Discard
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onSave()}
          disabled={saving || !isDirty}
          title="Save diagram"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </header>
  );
}

import { useAutoLayout } from '../../hooks/useAutoLayout';
import { useDiagramStore } from '../../stores/diagramStore';

interface EditorHeaderProps {
  onSave: (label?: string) => Promise<void>;
  onDiscard: () => void;
  onHistory: () => void;
  onCodeView: () => void;
  saving: boolean;
  onBack: () => void;
}

export default function EditorHeader({
  onSave,
  onDiscard,
  onHistory,
  onCodeView,
  saving,
  onBack,
}: EditorHeaderProps) {
  const { meta, isDirty, setDiagramName } = useDiagramStore();
  const { runLayout } = useAutoLayout();

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
          onClick={runLayout}
          title="Re-layout nodes with Dagre"
        >
          ⚙ Re-layout
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onCodeView}
          title="View diagram JSON"
        >
          {'{ }'}
        </button>
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

import { useEffect, useRef, useState } from 'react';
import { useDiagramStore } from '../../stores/diagramStore';

interface CodeViewModalProps {
  onClose: () => void;
}

export default function CodeViewModal({ onClose }: CodeViewModalProps) {
  const { nodes, edges, viewport } = useDiagramStore();
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const json = JSON.stringify({ nodes, edges, viewport }, null, 2);
  const sizeKb = (new TextEncoder().encode(json).byteLength / 1024).toFixed(1);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the pre content so user can copy manually
      const sel = window.getSelection();
      const range = document.createRange();
      if (sel && preRef.current) {
        range.selectNodeContents(preRef.current);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ zIndex: 200 }}
    >
      <div
        className="modal"
        style={{ width: 'min(90vw, 820px)', maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px 10px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Diagram JSON</span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                padding: '1px 6px',
              }}
            >
              {sizeKb} KB · {nodes.length} nodes · {edges.length} edges
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCopy}
              style={{ minWidth: 70 }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Code area */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '14px 18px',
            background: 'var(--color-bg-sunken, #0d1117)',
          }}
        >
          <pre
            ref={preRef}
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.6,
              color: 'var(--color-text, #e6edf3)',
              fontFamily: 'var(--font-mono, monospace)',
              whiteSpace: 'pre',
              userSelect: 'text',
            }}
          >
            {json}
          </pre>
        </div>
      </div>
    </div>
  );
}

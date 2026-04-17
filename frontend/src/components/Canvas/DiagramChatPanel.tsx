import { useState, useRef, useEffect, useCallback } from 'react';
import { streamDiagramChat, type ChatEvent } from '../../api/agent';
import { useDiagramStore } from '../../stores/diagramStore';
import type { Node, Edge, Viewport } from 'reactflow';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

interface DiagramChatPanelProps {
  diagramId: string;
  onClose: () => void;
}

export default function DiagramChatPanel({ diagramId, onClose }: DiagramChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { loadDiagram, meta } = useDiagramStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setStreaming(true);

    // Add a streaming assistant placeholder
    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      await streamDiagramChat(diagramId, text, (event: ChatEvent) => {
        if (event.type === 'text_delta') {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.streaming) {
              updated[updated.length - 1] = { ...last, content: last.content + event.payload.delta };
            }
            return updated;
          });
        }

        if (event.type === 'flow_data') {
          const fd = event.payload.flowData as {
            nodes: Node[];
            edges: Edge[];
            viewport: Viewport;
          };
          if (meta) {
            loadDiagram(meta, {
              nodes: fd.nodes ?? [],
              edges: fd.edges ?? [],
              viewport: fd.viewport ?? { x: 0, y: 0, zoom: 1 },
            });
          }
        }

        if (event.type === 'version_saved') {
          setToast(`Diagram updated — saved as v${event.payload.versionNumber}`);
        }

        if (event.type === 'done') {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.streaming) {
              updated[updated.length - 1] = { ...last, streaming: false };
            }
            return updated;
          });
          setStreaming(false);
        }

        if (event.type === 'error') {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.streaming) {
              updated[updated.length - 1] = {
                role: 'assistant',
                content: `Error: ${event.payload.message}`,
                streaming: false,
              };
            }
            return updated;
          });
          setStreaming(false);
        }
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.streaming) {
          updated[updated.length - 1] = {
            role: 'assistant',
            content: `Error: ${(err as Error).message}`,
            streaming: false,
          };
        }
        return updated;
      });
      setStreaming(false);
    }
  }, [input, streaming, diagramId, meta, loadDiagram]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <aside className="chat-panel">
      <div className="chat-panel__header">
        <span className="chat-panel__title">AI Chat</span>
        <button className="btn btn-ghost btn-sm" onClick={onClose} title="Close chat">
          ✕
        </button>
      </div>

      <div className="chat-panel__messages">
        {messages.length === 0 && (
          <p className="chat-panel__empty">
            Describe what you want to change. For example: &ldquo;Add a Redis cache between the API and DB&rdquo;
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-panel__msg chat-panel__msg--${msg.role}`}
          >
            <div className="chat-panel__bubble">
              {msg.content}
              {msg.streaming && <span className="chat-panel__cursor" />}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {toast && (
        <div className="chat-panel__toast">{toast}</div>
      )}

      <div className="chat-panel__input-row">
        <textarea
          className="form-input chat-panel__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe a change…"
          rows={2}
          disabled={streaming}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => void handleSend()}
          disabled={streaming || !input.trim()}
        >
          {streaming ? '…' : 'Send'}
        </button>
      </div>
    </aside>
  );
}

function authToken(): string {
  return localStorage.getItem('desol_token') ?? '';
}

export type GenerateEvent =
  | { type: 'start'; payload: { applicableTypes: string[] } }
  | { type: 'diagram_saved'; payload: { diagramId: string; diagramType: string; name: string } }
  | { type: 'error'; payload: { diagramType: string; message: string } }
  | { type: 'done'; payload: { total: number } };

export type ChatEvent =
  | { type: 'text_delta'; payload: { delta: string } }
  | { type: 'flow_data'; payload: { flowData: Record<string, unknown> } }
  | { type: 'version_saved'; payload: { versionNumber: number } }
  | { type: 'error'; payload: { message: string } }
  | { type: 'done' };

async function consumeSSEStream<T>(
  url: string,
  method: string,
  body: unknown,
  onEvent: (event: T) => void
): Promise<void> {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const json = line.slice(6).trim();
        if (json) {
          try {
            onEvent(JSON.parse(json) as T);
          } catch {
            // ignore malformed lines
          }
        }
      }
    }
  }
}

export async function streamGenerateDiagrams(
  projectId: string,
  onEvent: (event: GenerateEvent) => void
): Promise<void> {
  await consumeSSEStream<GenerateEvent>(
    `/api/projects/${projectId}/generate-diagrams`,
    'POST',
    {},
    onEvent
  );
}

export async function streamDiagramChat(
  diagramId: string,
  message: string,
  onEvent: (event: ChatEvent) => void
): Promise<void> {
  await consumeSSEStream<ChatEvent>(
    `/api/diagrams/${diagramId}/chat`,
    'POST',
    { message },
    onEvent
  );
}

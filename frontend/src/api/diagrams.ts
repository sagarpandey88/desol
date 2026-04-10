const BASE = '/api/diagrams';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('desol_token') ?? '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export interface FlowData {
  nodes: unknown[];
  edges: unknown[];
  viewport: { x: number; y: number; zoom: number };
}

export interface Diagram {
  id: string;
  user_id: string;
  name: string;
  diagram_type: string;
  flow_data: FlowData;
  created_at: string;
  updated_at: string;
}

export interface Version {
  id: string;
  diagram_id: string;
  version_number: number;
  label: string | null;
  created_by: string | null;
  created_at: string;
}

export interface VersionWithData extends Version {
  flow_data: FlowData;
}

export async function listDiagrams(): Promise<Diagram[]> {
  const res = await fetch(BASE, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to list diagrams');
  return data as Diagram[];
}

export async function createDiagram(
  name: string,
  diagram_type: string
): Promise<Diagram> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, diagram_type }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to create diagram');
  return data as Diagram;
}

export async function getDiagram(id: string): Promise<Diagram> {
  const res = await fetch(`${BASE}/${id}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Diagram not found');
  return data as Diagram;
}

export async function saveDiagram(
  id: string,
  flowData: FlowData,
  name?: string,
  label?: string
): Promise<Diagram> {
  const body: Record<string, unknown> = { flow_data: flowData };
  if (name) body.name = name;
  if (label) body.label = label;

  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to save diagram');
  return data as Diagram;
}

export async function renameDiagram(
  id: string,
  name: string
): Promise<Diagram> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to rename diagram');
  return data as Diagram;
}

export async function deleteDiagram(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? 'Failed to delete diagram');
  }
}

export async function listVersions(diagramId: string): Promise<Version[]> {
  const res = await fetch(`${BASE}/${diagramId}/versions`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to list versions');
  return data as Version[];
}

export async function getVersion(
  diagramId: string,
  versionId: string
): Promise<VersionWithData> {
  const res = await fetch(`${BASE}/${diagramId}/versions/${versionId}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to get version');
  return data as VersionWithData;
}

export async function restoreVersion(
  diagramId: string,
  versionId: string
): Promise<{ diagram: Diagram; version: Version }> {
  const res = await fetch(
    `${BASE}/${diagramId}/versions/${versionId}/restore`,
    { method: 'POST', headers: authHeaders() }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to restore version');
  return data as { diagram: Diagram; version: Version };
}

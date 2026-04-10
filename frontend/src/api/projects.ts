import type { Project } from './diagrams';

export type { Project } from './diagrams';

const BASE = '/api/projects';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('desol_token') ?? '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function listProjects(): Promise<Project[]> {
  const res = await fetch(BASE, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to list projects');
  return data as Project[];
}

export async function createProject(name: string): Promise<Project> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to create project');
  return data as Project;
}

export async function renameProject(
  id: string,
  name: string
): Promise<Project> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to rename project');
  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? 'Failed to delete project');
  }
}
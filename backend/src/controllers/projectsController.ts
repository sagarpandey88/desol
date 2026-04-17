import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  createProject,
  deleteProject,
  listProjectsByUser,
  updateProject,
} from '../db/queries/projects';

export async function list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const projects = await listProjectsByUser(req.user!.userId);
    res.json(projects);
  } catch (err) {
    console.error('list projects error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, description } = req.body as { name: string; description?: string | null };
    const project = await createProject(req.user!.userId, name, description ?? null);
    res.status(201).json(project);
  } catch (err) {
    console.error('create project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name } = req.body as { name: string };
    const project = await updateProject(req.params.id, req.user!.userId, name);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (err) {
    console.error('update project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function remove(req: AuthRequest, res: Response): Promise<void> {
  try {
    const deleted = await deleteProject(req.params.id, req.user!.userId);
    if (!deleted) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('delete project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
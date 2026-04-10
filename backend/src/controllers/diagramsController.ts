import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  listDiagramsByUser,
  createDiagram,
  getDiagramById,
  updateDiagram,
  deleteDiagram,
} from '../db/queries/diagrams';
import { getProjectById } from '../db/queries/projects';
import { createVersion } from '../db/queries/versions';

const EMPTY_FLOW = {
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
};

export async function list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const diagrams = await listDiagramsByUser(req.user!.userId);
    res.json(diagrams);
  } catch (err) {
    console.error('list diagrams error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, diagram_type, project_id } = req.body as {
      name: string;
      diagram_type: string;
      project_id?: string | null;
    };
    const userId = req.user!.userId;

    if (project_id !== undefined && project_id !== null) {
      const project = await getProjectById(project_id, userId);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
    }

    const diagram = await createDiagram(
      userId,
      name,
      diagram_type,
      EMPTY_FLOW,
      project_id ?? null
    );
    await createVersion(diagram.id, EMPTY_FLOW, 'Initial', userId);

    res.status(201).json(diagram);
  } catch (err) {
    console.error('create diagram error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getOne(req: AuthRequest, res: Response): Promise<void> {
  try {
    const diagram = await getDiagramById(req.params.id, req.user!.userId);
    if (!diagram) {
      res.status(404).json({ error: 'Diagram not found' });
      return;
    }
    res.json(diagram);
  } catch (err) {
    console.error('get diagram error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { name, flow_data, label, project_id } = req.body as {
      name?: string;
      flow_data?: Record<string, unknown>;
      label?: string;
      project_id?: string | null;
    };

    if (project_id !== undefined && project_id !== null) {
      const project = await getProjectById(project_id, userId);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
    }

    const diagram = await updateDiagram(req.params.id, userId, {
      ...(name !== undefined && { name }),
      ...(flow_data !== undefined && { flowData: flow_data }),
      ...(project_id !== undefined && { projectId: project_id }),
    });

    if (!diagram) {
      res.status(404).json({ error: 'Diagram not found' });
      return;
    }

    if (flow_data !== undefined) {
      await createVersion(diagram.id, flow_data, label ?? null, userId);
    }

    res.json(diagram);
  } catch (err) {
    console.error('update diagram error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function remove(req: AuthRequest, res: Response): Promise<void> {
  try {
    const deleted = await deleteDiagram(req.params.id, req.user!.userId);
    if (!deleted) {
      res.status(404).json({ error: 'Diagram not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('delete diagram error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

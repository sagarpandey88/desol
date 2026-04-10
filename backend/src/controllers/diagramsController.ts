import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  listDiagramsByUser,
  createDiagram,
  getDiagramById,
  updateDiagram,
  deleteDiagram,
} from '../db/queries/diagrams';
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
    const { name, diagram_type } = req.body as {
      name: string;
      diagram_type: string;
    };
    const userId = req.user!.userId;

    const diagram = await createDiagram(userId, name, diagram_type, EMPTY_FLOW);
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
    const { name, flow_data, label } = req.body as {
      name?: string;
      flow_data?: Record<string, unknown>;
      label?: string;
    };

    const diagram = await updateDiagram(req.params.id, userId, {
      ...(name !== undefined && { name }),
      ...(flow_data !== undefined && { flowData: flow_data }),
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

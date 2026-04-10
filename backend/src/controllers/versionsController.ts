import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDiagramById, updateDiagram } from '../db/queries/diagrams';
import {
  listVersionsByDiagram,
  getVersionById,
  createVersion,
} from '../db/queries/versions';

export async function listVersions(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const diagram = await getDiagramById(req.params.id, req.user!.userId);
    if (!diagram) {
      res.status(404).json({ error: 'Diagram not found' });
      return;
    }
    const versions = await listVersionsByDiagram(req.params.id);
    res.json(versions);
  } catch (err) {
    console.error('list versions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getVersion(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const diagram = await getDiagramById(req.params.id, req.user!.userId);
    if (!diagram) {
      res.status(404).json({ error: 'Diagram not found' });
      return;
    }
    const version = await getVersionById(req.params.id, req.params.versionId);
    if (!version) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }
    res.json(version);
  } catch (err) {
    console.error('get version error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function restoreVersion(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const diagram = await getDiagramById(req.params.id, userId);
    if (!diagram) {
      res.status(404).json({ error: 'Diagram not found' });
      return;
    }

    const version = await getVersionById(req.params.id, req.params.versionId);
    if (!version) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }

    const updatedDiagram = await updateDiagram(req.params.id, userId, {
      flowData: version.flow_data,
    });

    const newVersion = await createVersion(
      req.params.id,
      version.flow_data,
      `Restored from v${version.version_number}`,
      userId
    );

    res.json({ diagram: updatedDiagram, version: newVersion });
  } catch (err) {
    console.error('restore version error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function exportMermaid(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const diagram = await getDiagramById(req.params.id, req.user!.userId);
    if (!diagram) {
      res.status(404).json({ error: 'Diagram not found' });
      return;
    }
    // Phase 2 stub
    res.json({
      mermaid: `%% Mermaid export — Phase 2 coming soon\ngraph TD\n  A[${diagram.name}]`,
      diagramType: diagram.diagram_type,
    });
  } catch (err) {
    console.error('export mermaid error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

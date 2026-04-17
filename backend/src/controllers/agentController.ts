import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getProjectById } from '../db/queries/projects';
import { getDiagramById, updateDiagram } from '../db/queries/diagrams';
import { createVersion } from '../db/queries/versions';
import { getChatHistory, saveChatMessage } from '../db/queries/chats';
import { buildGraph } from '../agents/graph';
import { runDiagramEditAgent } from '../agents/diagramEditAgent';

function sendSSE(res: Response, data: unknown): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export async function generateDiagrams(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const projectId = req.params.id;

  const project = await getProjectById(projectId, userId);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const prompt = (project.description ?? '').trim();
  if (!prompt) {
    res.status(400).json({ error: 'Project has no description to generate diagrams from' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    let savedCount = 0;

    const graph = buildGraph((event) => {
      sendSSE(res, event);
      if (event.type === 'diagram_saved') savedCount++;
    });

    const stream = await graph.stream({
      prompt,
      projectId,
      projectName: project.name,
      userId,
      applicableTypes: [],
      results: [],
    });

    for await (const chunk of stream) {
      if ('supervisor' in chunk && Array.isArray((chunk.supervisor as { applicableTypes?: unknown })?.applicableTypes)) {
        const types = (chunk.supervisor as { applicableTypes: string[] }).applicableTypes;
        sendSSE(res, { type: 'start', payload: { applicableTypes: types } });
      }
    }

    sendSSE(res, { type: 'done', payload: { total: savedCount } });
  } catch (err) {
    console.error('generateDiagrams error:', err);
    sendSSE(res, { type: 'error', payload: { diagramType: 'all', message: (err as Error).message } });
  } finally {
    res.end();
  }
}

export async function chatDiagram(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const diagramId = req.params.id;
  const { message } = req.body as { message: string };

  if (!message?.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const diagram = await getDiagramById(diagramId, userId);
  if (!diagram) {
    res.status(404).json({ error: 'Diagram not found' });
    return;
  }

  const chatHistory = await getChatHistory(diagramId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const result = await runDiagramEditAgent(
      diagram.diagram_type,
      diagram.flow_data,
      chatHistory,
      message,
      (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    );

    // Persist the user message and assistant response
    await saveChatMessage(diagramId, 'user', message);
    await saveChatMessage(diagramId, 'assistant', result.explanation);

    // Save updated flow_data as a new diagram version
    await updateDiagram(diagramId, userId, { flowData: result.flowData });
    const version = await createVersion(
      diagramId,
      result.flowData,
      `Chat: ${message.slice(0, 60)}`,
      userId
    );

    res.write(`data: ${JSON.stringify({ type: 'version_saved', payload: { versionNumber: version.version_number } })}\n\n`);
  } catch (err) {
    console.error('chatDiagram error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', payload: { message: (err as Error).message } })}\n\n`);
  } finally {
    res.end();
  }
}

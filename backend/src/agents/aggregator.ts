import { createDiagram } from '../db/queries/diagrams';
import { createVersion } from '../db/queries/versions';
import type { AgentState } from './state';

export type ProgressCallback = (event: {
  type: 'diagram_saved';
  payload: { diagramId: string; diagramType: string; name: string };
} | {
  type: 'error';
  payload: { diagramType: string; message: string };
}) => void;

export async function aggregatorNode(
  state: AgentState,
  onProgress: ProgressCallback
): Promise<Partial<AgentState>> {
  for (const result of state.results) {
    if (result.error || !result.flowData) {
      onProgress({
        type: 'error',
        payload: { diagramType: result.diagramType, message: result.error ?? 'No data generated' },
      });
      continue;
    }

    try {
      const name = `${result.diagramType.charAt(0).toUpperCase()}${result.diagramType.slice(1)} Diagram`;
      const diagram = await createDiagram(
        state.userId,
        name,
        result.diagramType,
        result.flowData,
        state.projectId
      );
      await createVersion(diagram.id, result.flowData, 'AI Generated', state.userId);

      onProgress({
        type: 'diagram_saved',
        payload: { diagramId: diagram.id, diagramType: result.diagramType, name: diagram.name },
      });
    } catch (e) {
      onProgress({
        type: 'error',
        payload: { diagramType: result.diagramType, message: (e as Error).message },
      });
    }
  }

  return {};
}

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { SPECIALIST_SYSTEM_PROMPT, NODE_SCHEMAS } from '../prompts';
import { getSpecialistModel } from '../models';
import type { AgentState } from '../state';

async function generateDiagram(
  diagramType: string,
  state: AgentState
): Promise<Partial<AgentState>> {
  const model = getSpecialistModel();

  const nodeSchema = NODE_SCHEMAS[diagramType] ?? '{}';
  const systemPrompt = SPECIALIST_SYSTEM_PROMPT(
    diagramType,
    state.projectName,
    state.prompt,
    nodeSchema
  );

  let flowData: Record<string, unknown> | null = null;
  let error: string | null = null;

  try {
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Generate the ${diagramType} diagram now.`),
    ]);

    const content = typeof response.content === 'string' ? response.content : '';
    const cleaned = content.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    // Ensure basic structure is valid
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error('Missing nodes or edges array in generated flow_data');
    }

    flowData = parsed;
  } catch (e) {
    error = (e as Error).message;
  }

  return {
    results: [
      ...state.results,
      { diagramType, flowData, error },
    ],
  };
}

export { generateDiagram };

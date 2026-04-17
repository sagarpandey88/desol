import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { SUPERVISOR_SYSTEM_PROMPT } from './prompts';
import { getSupervisorModel } from './models';
import type { AgentState } from './state';

const VALID_TYPES = ['architecture', 'flowchart', 'erd', 'class', 'component', 'activity'];

export async function supervisorNode(state: AgentState): Promise<Partial<AgentState>> {
  const model = getSupervisorModel();

  const response = await model.invoke([
    new SystemMessage(SUPERVISOR_SYSTEM_PROMPT),
    new HumanMessage(state.prompt),
  ]);

  let applicableTypes: string[] = [];
  try {
    const content = typeof response.content === 'string' ? response.content : '';
    // Strip any accidental markdown fences
    const cleaned = content.replace(/```[a-z]*\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as unknown;
    if (Array.isArray(parsed)) {
      applicableTypes = (parsed as unknown[])
        .filter((t): t is string => typeof t === 'string' && VALID_TYPES.includes(t));
    }
  } catch {
    // Default to a minimal set if parsing fails
    applicableTypes = ['architecture', 'flowchart'];
  }

  return { applicableTypes };
}

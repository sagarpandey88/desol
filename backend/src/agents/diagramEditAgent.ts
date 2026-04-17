import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { DIAGRAM_EDIT_SYSTEM_PROMPT, NODE_SCHEMAS } from './prompts';
import { getEditAgentModel } from './models';
import type { ChatRow } from '../db/queries/chats';

export interface DiagramEditResult {
  explanation: string;
  flowData: Record<string, unknown>;
}

type StreamCallback = (event: {
  type: 'text_delta';
  payload: { delta: string };
} | {
  type: 'flow_data';
  payload: { flowData: Record<string, unknown> };
} | {
  type: 'done';
}) => void;

function buildHistory(chatHistory: ChatRow[]): BaseMessage[] {
  return chatHistory.map((row) =>
    row.role === 'user'
      ? new HumanMessage(row.content)
      : new AIMessage(row.content)
  );
}

export async function runDiagramEditAgent(
  diagramType: string,
  currentFlowData: Record<string, unknown>,
  chatHistory: ChatRow[],
  userMessage: string,
  onEvent: StreamCallback
): Promise<DiagramEditResult> {
  const nodeSchema = NODE_SCHEMAS[diagramType] ?? '{}';
  const systemPrompt = DIAGRAM_EDIT_SYSTEM_PROMPT(
    diagramType,
    JSON.stringify(currentFlowData, null, 2),
    nodeSchema
  );

  const model = getEditAgentModel();

  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...buildHistory(chatHistory),
    new HumanMessage(userMessage),
  ];

  let fullContent = '';

  const stream = await model.stream(messages);
  for await (const chunk of stream) {
    const delta = typeof chunk.content === 'string' ? chunk.content : '';
    if (delta) {
      fullContent += delta;
      onEvent({ type: 'text_delta', payload: { delta } });
    }
  }

  // Parse the structured response
  const explanationMatch = /<explanation>([\s\S]*?)<\/explanation>/i.exec(fullContent);
  const flowDataMatch = /<flow_data>([\s\S]*?)<\/flow_data>/i.exec(fullContent);

  if (!explanationMatch || !flowDataMatch) {
    throw new Error('Agent response did not match expected format');
  }

  const explanation = explanationMatch[1].trim();
  const flowDataRaw = flowDataMatch[1].trim().replace(/```[a-z]*\n?/g, '').replace(/```/g, '');

  let flowData: Record<string, unknown>;
  try {
    flowData = JSON.parse(flowDataRaw) as Record<string, unknown>;
    if (!Array.isArray(flowData.nodes) || !Array.isArray(flowData.edges)) {
      throw new Error('Invalid flow_data structure');
    }
  } catch (e) {
    throw new Error(`Failed to parse flow_data from agent response: ${(e as Error).message}`);
  }

  onEvent({ type: 'flow_data', payload: { flowData } });
  onEvent({ type: 'done' });

  return { explanation, flowData };
}

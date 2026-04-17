import { generateDiagram } from './_base';
import type { AgentState } from '../state';
export const erdNode = (state: AgentState) => generateDiagram('erd', state);

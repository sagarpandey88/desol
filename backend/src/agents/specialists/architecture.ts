import { generateDiagram } from './_base';
import type { AgentState } from '../state';
export const architectureNode = (state: AgentState) => generateDiagram('architecture', state);

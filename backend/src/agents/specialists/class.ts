import { generateDiagram } from './_base';
import type { AgentState } from '../state';
export const classNode = (state: AgentState) => generateDiagram('class', state);

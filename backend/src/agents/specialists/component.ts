import { generateDiagram } from './_base';
import type { AgentState } from '../state';
export const componentNode = (state: AgentState) => generateDiagram('component', state);

import { generateDiagram } from './_base';
import type { AgentState } from '../state';
export const flowchartNode = (state: AgentState) => generateDiagram('flowchart', state);

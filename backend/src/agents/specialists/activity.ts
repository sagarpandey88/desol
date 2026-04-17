import { generateDiagram } from './_base';
import type { AgentState } from '../state';
export const activityNode = (state: AgentState) => generateDiagram('activity', state);

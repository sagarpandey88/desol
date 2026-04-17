import { StateGraph, Annotation, Send } from '@langchain/langgraph';
import { supervisorNode } from './supervisor';
import { flowchartNode } from './specialists/flowchart';
import { erdNode } from './specialists/erd';
import { classNode } from './specialists/class';
import { componentNode } from './specialists/component';
import { architectureNode } from './specialists/architecture';
import { activityNode } from './specialists/activity';
import { aggregatorNode, type ProgressCallback } from './aggregator';
import type { AgentState } from './state';

const GraphAnnotation = Annotation.Root({
  prompt: Annotation<string>(),
  projectId: Annotation<string>(),
  projectName: Annotation<string>(),
  userId: Annotation<string>(),
  applicableTypes: Annotation<string[]>({
    default: () => [],
    reducer: (a, b) => b ?? a,
  }),
  results: Annotation<AgentState['results']>({
    default: () => [],
    reducer: (a, b) => [...a, ...b],
  }),
});

const SPECIALIST_MAP: Record<string, (state: AgentState) => Promise<Partial<AgentState>>> = {
  flowchart: flowchartNode,
  erd: erdNode,
  class: classNode,
  component: componentNode,
  architecture: architectureNode,
  activity: activityNode,
};

function routeToSpecialists(state: AgentState): Send[] | string {
  const types = state.applicableTypes;
  if (!types || types.length === 0) return 'aggregator';
  return types
    .filter((t) => t in SPECIALIST_MAP)
    .map((t) => new Send(t, state));
}

export function buildGraph(onProgress: ProgressCallback) {
  const graph = new StateGraph(GraphAnnotation)
    .addNode('supervisor', supervisorNode)
    .addNode('flowchart', flowchartNode)
    .addNode('erd', erdNode)
    .addNode('class', classNode)
    .addNode('component', componentNode)
    .addNode('architecture', architectureNode)
    .addNode('activity', activityNode)
    .addNode('aggregator', (state: AgentState) => aggregatorNode(state, onProgress))
    .addEdge('__start__', 'supervisor')
    .addConditionalEdges('supervisor', routeToSpecialists)
    .addEdge('flowchart', 'aggregator')
    .addEdge('erd', 'aggregator')
    .addEdge('class', 'aggregator')
    .addEdge('component', 'aggregator')
    .addEdge('architecture', 'aggregator')
    .addEdge('activity', 'aggregator')
    .addEdge('aggregator', '__end__');

  return graph.compile();
}

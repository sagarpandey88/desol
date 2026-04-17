export interface AgentState {
  prompt: string;
  projectId: string;
  projectName: string;
  userId: string;
  applicableTypes: string[];
  results: Array<{
    diagramType: string;
    flowData: Record<string, unknown> | null;
    error: string | null;
  }>;
}

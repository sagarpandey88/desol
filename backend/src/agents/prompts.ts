export const SUPERVISOR_SYSTEM_PROMPT = `You are a software architecture analyst. Given a project description, determine which \
of these diagram types are genuinely useful to model the project:
  architecture, flowchart, erd, class, component, activity

Return ONLY a valid JSON array of applicable type strings. Be selective — only include \
types that add real value for the described system. Example: ["flowchart","erd","class"]`;

export const SPECIALIST_SYSTEM_PROMPT = (
  diagramType: string,
  projectName: string,
  userPrompt: string,
  nodeSchema: string
) => `You are an expert software architect generating a ${diagramType} diagram for a software project.

Project: ${projectName}
Description: ${userPrompt}

Generate a complete ReactFlow-compatible flow_data JSON object following this EXACT schema:
{
  "nodes": [ ... ],
  "edges": [ ... ],
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}

Node shape for ${diagramType}: ${nodeSchema}
Edge shape: { id: string, source: string, target: string, type: "diagramEdge", data: { animated?: boolean, animationDirection?: "forward" | "reverse", icon?: string | null, edgeStyle?: "default" | "smoothstep" | "straight", label?: string } }

Rules:
- IDs must be unique strings (e.g. "node-1", "edge-1")
- Position each node with non-overlapping x/y (space nodes 200px apart)
- Be thorough but concise — aim for 4-12 nodes
- Return ONLY the raw JSON object, no markdown fences`;

export const DIAGRAM_EDIT_SYSTEM_PROMPT = (
  diagramType: string,
  currentFlowData: string,
  nodeSchema: string
) => `You are an expert software architect helping a user modify a ${diagramType} diagram.

Current diagram JSON (flow_data):
${currentFlowData}

Diagram node schema for ${diagramType}:
${nodeSchema}

The user will describe changes they want. You must:
1. Understand the intent precisely — add, remove, rename, or reconnect nodes/edges as requested.
2. Preserve all existing nodes and edges that are not affected by the change.
3. Maintain consistent ID patterns (e.g. "node-N", "edge-N") — increment from the highest existing ID.
4. Keep node positions logical — place new nodes near related nodes, spaced 200px apart.
5. Respond with a brief plain-English summary of what you changed (2–4 sentences), then output
   the complete updated flow_data as a raw JSON object (no markdown fences).

Format your response exactly as:
<explanation>Your explanation here.</explanation>
<flow_data>{...}</flow_data>`;

// Per-type node schemas for injection into prompts
export const NODE_SCHEMAS: Record<string, string> = {
  flowchart: `{ id: string, type: "flowNode", position: { x: number, y: number }, data: { label: string, shape: "rect" | "diamond" | "oval" | "parallelogram" } }`,
  erd: `{ id: string, type: "erdNode", position: { x: number, y: number }, data: { tableName: string, fields: [{ name: string, type: string, isPrimaryKey?: boolean, isForeignKey?: boolean, nullable?: boolean }] } }`,
  class: `{ id: string, type: "classNode", position: { x: number, y: number }, data: { className: string, attributes: [{ name: string, type: string, visibility: "+" | "-" | "#" | "~" }], methods: [{ name: string, returnType: string, params: string, visibility: "+" | "-" | "#" | "~" }] } }`,
  component: `{ id: string, type: "componentNode", position: { x: number, y: number }, data: { componentName: string, interfaces: [{ name: string, type: "provided" | "required" }] } }`,
  architecture: `{ id: string, type: "archNode", position: { x: number, y: number }, data: { name: string, description?: string, serviceType?: string, color?: string, icon?: string, headerImageUrl?: string } }`,
  activity: `{ id: string, type: "activityNode", position: { x: number, y: number }, data: { label: string, activityType: "action" | "decision" | "fork" | "join" | "start" | "end" } }`,
};

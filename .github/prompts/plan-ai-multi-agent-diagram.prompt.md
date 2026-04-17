## Plan: AI Multi-Agent Diagram Generation on Project Creation

**TL;DR:** When a user creates a project, they can optionally enter a natural-language description. The backend triggers a LangGraph.js pipeline — a Supervisor decides which diagram types are applicable, then parallel Specialist agents generate valid `flow_data` JSON for each. Results stream back to the UI via SSE so diagrams appear progressively.

---

### Agent Architecture — Supervisor + Parallel Workers pattern

**7 agents total:**

| Agent | Role |
|-------|------|
| **Supervisor** | Reads the prompt, outputs a JSON list of applicable diagram types |
| **FlowchartAgent** | Generates flowchart `flow_data` |
| **ERDAgent** | Generates ERD `flow_data` |
| **ClassAgent** | Generates class diagram `flow_data` |
| **ComponentAgent** | Generates component diagram `flow_data` |
| **ArchitectureAgent** | Generates architecture block diagram `flow_data` |
| **ActivityAgent** | Generates activity diagram `flow_data` |

The Supervisor runs first; its output dynamically routes into only the applicable specialist branches which run **in parallel** (LangGraph fan-out). An Aggregator node collects results, saves each diagram to the DB, and emits SSE events.

---

### Phase 1 — DB & Backend API Updates

1. New migration `backend/src/db/migrations/005_projects_description.sql` — adds `description TEXT` column to `projects` table
2. Update `backend/src/db/queries/projects.ts` `createProject()` to accept and persist `description`
3. Update `backend/src/routes/projects.ts` POST body validation to accept optional `description`

### Phase 2 — LangGraph Agent Pipeline

4. Install: `@langchain/langgraph`, `@langchain/openai`, `@langchain/core`, `zod`
5. Create `backend/src/agents/` with:
   - `state.ts` — shared `AgentState` (prompt, projectId, userId, applicableTypes[], results[])
   - `prompts.ts` — all system prompts (see below)
   - `supervisor.ts` — Supervisor agent node
   - `specialists/` — `flowchart.ts`, `erd.ts`, `class.ts`, `component.ts`, `architecture.ts`, `activity.ts`
   - `aggregator.ts` — saves each diagram to DB, emits progress callback
   - `graph.ts` — wires the full StateGraph with conditional fan-out

### Phase 3 — SSE Streaming Endpoint

6. Create `backend/src/controllers/agentController.ts` — sets SSE headers, invokes graph, pipes events to response
7. Add route `POST /api/projects/:id/generate-diagrams` in new `backend/src/routes/agents.ts`
8. Register route in `backend/src/index.ts`

**SSE event shapes:**
```
{ type: 'start',          payload: { applicableTypes: string[] } }
{ type: 'diagram_saved',  payload: { diagramId, diagramType, name } }
{ type: 'error',          payload: { diagramType, message } }
{ type: 'done',           payload: { total: number } }
```

### Phase 4 — Frontend UI Changes

9. Update Dashboard create-project modal (`frontend/src/pages/Dashboard/index.tsx`) — add a `<textarea>` for project description
10. Update `frontend/src/api/projects.ts` `createProject()` to send `description`
11. Create `frontend/src/api/agent.ts` — opens SSE connection to generate-diagrams endpoint
12. Add generation progress UI in Dashboard — shows a step list with diagram type badges appearing as each saves; navigates to project on `done`

---

### System Prompts

**Supervisor system prompt** (in `prompts.ts`):
```
You are a software architecture analyst. Given a project description, determine which 
of these diagram types are genuinely useful to model the project:
  architecture, flowchart, erd, class, component, activity

Return ONLY a valid JSON array of applicable type strings. Be selective — only include 
types that add real value for the described system. Example: ["flowchart","erd","class"]
```

**Specialist system prompt template** (parameterized per type, e.g. ERD):
```
You are an expert software architect generating a {DIAGRAM_TYPE} diagram for a software project.

Project: {PROJECT_NAME}
Description: {USER_PROMPT}

Generate a complete ReactFlow-compatible flow_data JSON object following this EXACT schema:
{
  "nodes": [ ... ],   // typed nodes matching the {DIAGRAM_TYPE} node shape below
  "edges": [ ... ],   // typed edges with type: "diagramEdge"
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}

Node type for {DIAGRAM_TYPE}: {NODE_SCHEMA}
Edge shape: { id, source, target, type: "diagramEdge", data: { animated, icon, edgeStyle } }

Rules:
- IDs must be unique strings (e.g. "node-1", "edge-1")
- Position each node with non-overlapping x/y (space nodes 200px apart)
- Be thorough but concise — aim for 4-12 nodes
- Return ONLY the raw JSON object, no markdown fences
```

Each specialist injects the concrete node schema (e.g. for ERD: `{ tableName, fields[{name,type,isPrimaryKey,isForeignKey,nullable}] }`).

---

### Phase 5 — In-Editor Diagram Chat Agent

A persistent chat panel in the Editor page lets users describe changes in natural language. A single **DiagramEditAgent** receives the current `flow_data`, the diagram type, the conversation history, and the new message — then returns an updated `flow_data` plus a plain-text explanation. The canvas updates live; the change is auto-saved as a new diagram version.

#### Agent pattern: Single ReAct-style chain (no multi-agent needed)
One agent is sufficient here — the task is always the same: understand the user's intent against a known `flow_data` and return a modified version. Multi-agent overhead would add latency with no benefit. LangGraph is still used so that conversation history is managed in a `MemorySaver` checkpointer keyed by `diagramId`, giving the agent persistent memory across the session.

#### New DB migration — `006_diagram_chats.sql`
```sql
CREATE TABLE diagram_chats (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id   UUID        NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  role         VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content      TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Index on (diagram_id, created_at ASC)
```
Chat history is persisted so conversation context survives page reloads. The LangGraph `MemorySaver` is seeded from this table on first load.

#### New backend endpoint — `POST /api/diagrams/:id/chat`
Request body:
```json
{ "message": "add a Redis cache between the API and the database" }
```
SSE response stream:
```
{ type: 'text_delta',     payload: { delta: string } }         // streaming explanation tokens
{ type: 'flow_data',      payload: { flowData: FlowData } }    // final updated diagram JSON
{ type: 'done' }
```
- Endpoint loads chat history from `diagram_chats` + current `flow_data` from `diagrams`
- Runs the DiagramEditAgent, streams text tokens back as `text_delta` events
- On completion: auto-saves updated `flow_data` to `diagrams` (creating a new version) and persists both messages to `diagram_chats`

#### DiagramEditAgent system prompt (in `prompts.ts`):
```
You are an expert software architect helping a user modify a {DIAGRAM_TYPE} diagram.

Current diagram JSON (flow_data):
{CURRENT_FLOW_DATA}

Diagram node schema for {DIAGRAM_TYPE}:
{NODE_SCHEMA}

The user will describe changes they want. You must:
1. Understand the intent precisely — add, remove, rename, or reconnect nodes/edges as requested.
2. Preserve all existing nodes and edges that are not affected by the change.
3. Maintain consistent ID patterns (e.g. "node-N", "edge-N") — increment from the highest existing ID.
4. Keep node positions logical — place new nodes near related nodes, spaced 200px apart.
5. Respond with a brief plain-English summary of what you changed (2–4 sentences), then output
   the complete updated flow_data as a raw JSON object (no markdown fences).

Format your response exactly as:
<explanation>Your explanation here.</explanation>
<flow_data>{...}</flow_data>
```

#### New files
- `backend/src/db/migrations/006_diagram_chats.sql`
- `backend/src/db/queries/chats.ts` — `getChatHistory(diagramId)`, `saveChatMessage(diagramId, role, content)`
- `backend/src/agents/diagramEditAgent.ts` — single ReAct chain with MemorySaver
- `backend/src/controllers/agentController.ts` — extend with `chatDiagram` handler
- Route added to `backend/src/routes/agents.ts`

#### Frontend — Chat Panel in Editor
- New component `frontend/src/components/Canvas/DiagramChatPanel.tsx`
  - Collapsible side panel (right side of Editor, toggled from `EditorHeader`)
  - Message list showing `user` / `assistant` turns with Markdown rendering for assistant text
  - Input box + Send button; disabled while streaming
  - Streams `text_delta` tokens into a live "typing" bubble
  - On `flow_data` event: calls `diagramStore.loadDiagram(meta, flowData)` to hot-swap the canvas
  - Displays a subtle "Diagram updated — saved as v{n}" toast on `done`
- `EditorHeader` gets a "Chat" toggle button
- `frontend/src/api/agent.ts` — add `streamDiagramChat(diagramId, message, onEvent)` using `EventSource` POST workaround (fetch + ReadableStream)

---

### Relevant Files

- `backend/src/db/migrations/` — add `005_projects_description.sql`, `006_diagram_chats.sql`
- `backend/src/db/queries/projects.ts` — update `createProject`
- `backend/src/db/queries/chats.ts` — new chat history queries
- `backend/src/routes/projects.ts` — add description to validation
- `backend/src/agents/` — new directory (all agent files)
- `backend/src/agents/diagramEditAgent.ts` — new chat agent
- `backend/src/routes/agents.ts` — new SSE routes (generate + chat)
- `backend/src/controllers/agentController.ts` — new SSE controller (generate + chat)
- `backend/src/index.ts` — register new route
- `frontend/src/pages/Dashboard/index.tsx` — add textarea + progress UI
- `frontend/src/api/projects.ts` — add description param
- `frontend/src/api/agent.ts` — SSE client (generate + chat)
- `frontend/src/components/Canvas/DiagramChatPanel.tsx` — new chat panel component
- `frontend/src/components/Header/EditorHeader.tsx` — add Chat toggle button
- `frontend/src/pages/Editor/index.tsx` — mount DiagramChatPanel

---

### Decisions
- LangGraph.js stays in the existing Node.js backend (no Python service)
- GPT-4o used for all agents (Supervisor can use GPT-4o-mini for cost savings — configurable)
- OPENAI_API_KEY environment variable — needs to be added to `.env`
- Supervisor is **not** parallelized with specialists — it must complete first
- Specialists run in parallel via LangGraph `Send` API fan-out
- SSE chosen over WebSockets for simplicity (unidirectional push)
- Chat agent uses LangGraph `MemorySaver` checkpointer keyed by `diagramId` for in-memory session continuity, backed by `diagram_chats` table for persistence across page reloads
- Chat always auto-saves and creates a new diagram version — user can restore any prior state via the existing Version History drawer

---

### Open Questions
1. **OpenAI API key handling** — needs `OPENAI_API_KEY` in `docker-compose.yml` env and `.env`. Do you have a key ready to wire in, or should we leave it as a placeholder?
2. **JSON validation / retry** — specialists can hallucinate invalid JSON. Should we add a Zod validation + 1 retry loop per specialist, or keep it simple for now?
3. **Generation on create vs. separate trigger** — currently planned as a separate API call after project creation. Alternatively we could make it one atomic action. The current plan keeps them separate which is simpler and allows regeneration later. Are you good with that?
4. **Chat panel scope** — should the chat agent be able to work across *all* diagrams in the project at once (e.g. "add an Order table to the ERD and a corresponding class to the class diagram"), or strictly one diagram at a time for now?

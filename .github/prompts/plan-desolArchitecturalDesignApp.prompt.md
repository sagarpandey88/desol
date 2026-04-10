# Plan: Desol — Architectural Design App (Phase 1)

## Decisions recorded
- Sequence Diagram: ELIMINATED from Phase 1 (too complex for React Flow + Dagre)
- Auth: JWT (Phase 1 includes login/register)
- Diagram management: Dashboard with list + create new
- Auto-layout: Both auto-on-add AND manual "Re-layout" button
- Storage: JSONB in PostgreSQL; Mermaid DSL as AI bridge for Phase 2

## Supported Diagram Types (6, down from 7)
1. Architecture Block Diagram
2. Flowchart
3. Database/ERD Diagram
4. Class Diagram
5. Component Diagram
6. Activity Diagram

## Key Tech Stack
- Frontend: React + Vite + TypeScript + React Flow + @dagrejs/dagre + Zustand + React Router
- Backend: Node.js + Express + TypeScript + bcrypt + JWT
- Database: PostgreSQL (JSONB for diagram data) — **NO ORM**; raw SQL via `node-postgres` (`pg`) pool only
  - All queries written as parameterised SQL strings directly in controller/query files
  - No Prisma, Sequelize, TypeORM, Drizzle, or any query-builder abstraction
- Dev: Docker Compose for local Postgres

## Monorepo Structure
```
desol/
├── frontend/
│   ├── src/
│   │   ├── pages/Auth/      Login.tsx, Register.tsx
│   │   ├── pages/Dashboard/ index.tsx
│   │   ├── pages/Editor/    index.tsx
│   │   ├── components/Header/    EditorHeader.tsx
│   │   ├── components/Sidebar/   NodePalette.tsx
│   │   ├── components/Canvas/    DiagramCanvas.tsx
│   │   ├── components/nodes/     ArchNode, FlowNode, ERDNode, ClassNode, ComponentNode, ActivityNode
│   │   ├── components/edges/     custom edge types
│   │   ├── hooks/           useAutoLayout.ts
│   │   ├── stores/          diagramStore.ts (Zustand)
│   │   ├── utils/           dagre.ts, mermaid-converter.ts
│   │   └── api/             auth.ts, diagrams.ts
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── routes/          auth.ts, diagrams.ts, versions.ts
│   │   ├── controllers/     authController.ts, diagramsController.ts, versionsController.ts
│   │   ├── middleware/       auth.ts (JWT), validate.ts (Zod)
│   │   ├── db/
│   │   │   ├── index.ts     pg Pool (raw SQL only, no ORM)
│   │   │   ├── queries/     users.ts, diagrams.ts, versions.ts  ← named SQL query functions
│   │   │   └── migrations/  001_users.sql, 002_diagrams.sql, 003_diagram_versions.sql
│   │   └── utils/           jwt.ts
│   └── package.json
├── docker-compose.yml
└── README.md
```

## DB Schema

### `users`
| column | type | notes |
|---|---|---|
| id | UUID | PK, `gen_random_uuid()` |
| email | VARCHAR(255) | UNIQUE NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

### `diagrams`
| column | type | notes |
|---|---|---|
| id | UUID | PK, `gen_random_uuid()` |
| user_id | UUID | FK → users(id) ON DELETE CASCADE |
| name | VARCHAR(255) | NOT NULL |
| diagram_type | VARCHAR(50) | CHECK: architecture/flowchart/erd/class/component/activity |
| flow_data | JSONB | current canvas state (nodes + edges + viewport) |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

- GIN index on `flow_data` for Phase 2 node-level queries
- Index on `(user_id, created_at DESC)` for dashboard listing

### `diagram_versions` (Phase 1 — versioning included)
| column | type | notes |
|---|---|---|
| id | UUID | PK, `gen_random_uuid()` |
| diagram_id | UUID | FK → diagrams(id) ON DELETE CASCADE |
| version_number | INT | sequential per diagram (auto-incremented via trigger) |
| flow_data | JSONB | snapshot of canvas at save time |
| label | VARCHAR(255) | optional user-provided label (e.g. "v1 — initial") |
| created_by | UUID | FK → users(id) — for Phase 2 AI-edit attribution |
| created_at | TIMESTAMPTZ | DEFAULT now() |

- A new version row is inserted every time a diagram is saved (PUT `/api/diagrams/:id`)
- The `diagrams.flow_data` column always reflects the latest version (denormalised for read speed)
- Index on `(diagram_id, version_number DESC)`

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET  /api/diagrams                          — list current user's diagrams
- POST /api/diagrams                          — create diagram (inserts version 1)
- GET  /api/diagrams/:id                      — fetch latest canvas state
- PUT  /api/diagrams/:id                      — save canvas (updates flow_data + inserts new version row)
- DELETE /api/diagrams/:id
- GET  /api/diagrams/:id/versions             — list all version history (id, version_number, label, created_at)
- GET  /api/diagrams/:id/versions/:versionId  — fetch a specific version's flow_data (for restore/preview)
- POST /api/diagrams/:id/versions/:versionId/restore — copy version flow_data back to diagrams.flow_data + create new version
- POST /api/diagrams/:id/export/mermaid       — Phase 2 stub (returns Mermaid DSL from current flow_data)

## React Flow + Dagre
- @dagrejs/dagre (NOT dagre-d3 which conflicts with React)
- dagre.ts utility: getLayoutedElements(nodes, edges, direction)
- Auto fires on node add (onNodeAdd hook) + manual "Re-layout" button
- rankdir: diagram-type specific (TB for flowchart/activity, LR for architecture/class)

## Phase 2 Considerations (built into Phase 1)
- mermaid-converter.ts: flow_data → Mermaid DSL (stubbed in Phase 1, used in Phase 2)
- flow_data schema: each node.data designed to be serializable to Mermaid
- JSONB design allows AI to query/filter nodes by type
- `diagram_versions` table is live in Phase 1; Phase 2 AI edits will write versions with `created_by` = AI agent user
- Restore endpoint enables "undo AI change" UX in Phase 2 without extra work

## Screens

### 1. Login (`/login`)
**Layout:** Centred card, no nav.
- Email + password fields
- "Sign in" primary button
- "Don't have an account? Register" link
- Inline validation errors (empty field, invalid email, wrong credentials)
- On success → redirect to Dashboard

---

### 2. Register (`/register`)
**Layout:** Centred card, no nav.
- Email + password + confirm password fields
- "Create account" primary button
- "Already have an account? Login" link
- On success → auto-login + redirect to Dashboard

---

### 3. Dashboard (`/dashboard`)
**Layout:** Full-page with top nav bar + main content area.

**Top Nav Bar:**
- App logo / name "Desol" (left)
- User email / avatar (right) + Logout button

**Main Content:**
- Page heading "My Diagrams" + "New Diagram" button (top-right)
- **Diagram cards grid** (responsive, 3-col desktop / 2 tablet / 1 mobile):
  - Card shows: diagram name, diagram type badge (colour-coded), last updated timestamp, thumbnail (canvas screenshot or type icon as fallback)
  - Hover reveals: "Open", "Rename", "Delete" actions
- **Empty state:** illustration + "Create your first diagram" CTA

**"New Diagram" Modal:**
- Name input (required)
- Diagram type selector (6 tiles with icons):
  - Architecture Block, Flowchart, ERD, Class, Component, Activity
- "Create" button → POST /api/diagrams → redirect to Editor

---

### 4. Editor (`/editor/:diagramId`)
**Layout:** Three-zone full-screen layout, no scrollbar on body.

```
┌──────────────────────────────────────────────────────────┐
│                      HEADER BAR                          │
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│   SIDEBAR    │             CANVAS (React Flow)           │
│  (Node       │                                           │
│  Palette)    │                                           │
│              │                                           │
└──────────────┴───────────────────────────────────────────┘
```

#### Header Bar
- **Left:** Back arrow → Dashboard (with unsaved-changes guard dialog)
- **Centre:** Editable diagram name (click to rename inline)
- **Right (actions, left to right):**
  - "Re-layout" button (runs Dagre auto-layout on current nodes)
  - "History" button → opens Version History drawer
  - "Discard" button → revert to last saved state (confirmation dialog)
  - "Save" primary button → PUT /api/diagrams/:id + inserts version row
  - Visual "Unsaved changes" dot indicator next to Save when dirty

#### Sidebar (Node Palette)
- Collapsible (chevron toggle), default open, ~240 px wide
- Grouped by diagram type (only shows relevant node types for the current diagram):
  - Each node type shown as a small labelled drag-handle card
  - Drag from sidebar → drop onto canvas to add node
- Below node types: **Edge style picker** (straight / smooth-step / bezier)
- Bottom of sidebar: **Fit View** and **Zoom In / Out** controls

#### Canvas (React Flow)
- Fills remaining space; dark or light theme aware
- MiniMap (bottom-right corner)
- Pan/zoom controls (bottom-right, above minimap)
- Context menu on right-click of node:
  - Edit properties, Duplicate, Delete
- Click node → opens **Node Properties Panel** (inline right panel, ~280 px, slides in):
  - Shows editable fields relevant to node type (see Node Type Data Schemas)
  - Changes update Zustand store immediately (live on canvas)
- Click edge → inline label edit + edge style toggle
- **"Add node" quick-add button** floats at canvas centre when canvas is empty

#### Version History Drawer (slides in from right, over canvas)
- List of saved versions: version number, label (if set), timestamp
- Click a version → preview its `flow_data` in a read-only mini canvas overlay
- "Restore" button on each version item (calls restore endpoint, creates new version)
- "Label this version" text input on the current (latest) save prompt

---

### 5. 404 / Not Found
- Minimal page: "Page not found" + Back to Dashboard link

---

## Screen Navigation Flow
```
/login ──────────────────┐
                         ▼
/register ──────► /dashboard ──► "New Diagram" modal ──► /editor/:id
                      ▲                                       │
                      └───────────────────────────────────────┘
                                 Back arrow
```

---

## Node Type Data Schemas
| Type | data fields |
|---|---|
| Architecture | name, description, serviceType, color, icon |
| Flowchart | label, shape (rect/diamond/oval/parallelogram) |
| ERD | tableName, fields [{name, type, isPrimaryKey, isForeignKey, nullable}] |
| Class | className, attributes [{name, type, visibility}], methods [{name, returnType, params, visibility}] |
| Component | componentName, interfaces [{name, type (provided/required)}] |
| Activity | label, activityType (action/decision/fork/join/start/end) |

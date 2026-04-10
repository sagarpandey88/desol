# Desol — Architectural Design App

An online diagramming tool supporting 6 diagram types: Architecture Block, Flowchart, ERD, Class, Component, and Activity diagrams. Built with React + React Flow + Dagre on the frontend and Node.js + Express + PostgreSQL on the backend.

## Features

### Core Diagram Types
- **Architecture** — Service/Database/Client/External nodes with coloured headers
- **Flowchart** — Process, Decision, Terminal and I/O shapes
- **ERD** — Tables with PK/FK/nullable field annotations
- **Class (UML)** — Classes with attributes and methods, interface support
- **Component** — Components with provided/required interface connectors
- **Activity** — Action, Decision, Fork/Join, Start/End nodes

### New Features (v2)

#### 1. Icons & Images in Node Headers
- **Architecture nodes** automatically display a contextual Lucide icon based on their `serviceType` (e.g. `API` → Server, `Database` → Database icon, `UI` → Monitor, `External` → Globe). The icon can be overridden via the **Header Icon** picker in the Properties panel.
- An optional **Header Image URL** field allows a custom image (SVG, PNG, etc.) to be displayed alongside the icon.
- **ERD** nodes show a `Table` icon; **Class** nodes auto-select `Box` (class) or `Layers` (interface); **Component** nodes show a `Puzzle` icon.
- Powered by **Lucide React** — 30 curated tech icons (`server`, `database`, `monitor`, `globe`, `cloud`, `shield`, `code`, `network`, `hard-drive`, `cpu`, `workflow`, `box`, `layers`, `package`, `puzzle`, `key`, `link`, `git-branch`, `zap`, `lock`, `bell`, `activity`, `home`, `table`, `router`, `users`, `mail`, `file-text`, `search`).

#### 2. JSON Code View
- Click the **{ }** button in the editor header to open the Diagram JSON modal.
- Shows the raw `{ nodes, edges, viewport }` payload in a read-only code viewer with syntax highlighting.
- Displays file size in KB and node/edge counts.
- One-click **Copy** button copies the JSON to clipboard; falls back to text selection if the Clipboard API is unavailable.
- Close with the **✕** button or press **Escape**.

#### 3. Animated Edges
- Toggle **Animated** in the sidebar edge controls before drawing a connection — new edges will render with marching dashes (CSS `stroke-dashoffset` animation).
- Existing edges can be toggled individually by clicking an edge to open its **Edge Properties** panel, then checking/unchecking the "Animate this edge" checkbox.
- Edge style (Bezier / Smooth / Straight) is also editable per-edge in the same panel.
- Edge labels can be added per-edge via the **Label** field.

#### 4. SVG Icons on Edges
- Select an **Edge icon** from the mini icon picker in the sidebar (8 relationship-oriented icons: `zap`, `link`, `git-branch`, `activity`, `lock`, `key`, `workflow`, `network`) — all new edges will carry that icon.
- Alternatively, set or change the icon on any existing edge via the **Edge Properties** panel (full icon grid with 30 options).
- The icon renders as a small circular badge at the edge midpoint using ReactFlow's `EdgeLabelRenderer`.

#### 5. Multiline Descriptions in Architecture Nodes
- The **Description** field in Architecture node properties is now a multi-line `<textarea>` (resizable).
- Long descriptions wrap within the node box (`white-space: pre-wrap; word-break: break-word`) instead of expanding the node horizontally.

#### 6. Labeled Group Nodes
- Drag a **Group** node (available in the palette for all diagram types) onto the canvas to create a resizable, dashed-border container.
- Groups are **resizable** using drag handles on all four corners/edges (powered by `@reactflow/node-resizer`).
- The group's **label** and **border colour** are editable in the Properties panel.
- To **move a node into a group**: right-click the node → **Add to group** → select the target group. The node will be constrained inside the group boundary.
- To **ungroup**: select the group → Properties panel → **Ungroup all children**.

## Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, Vite, TypeScript, React Flow v11, Dagre, Zustand, React Router v6, Lucide React, @reactflow/node-resizer |
| Backend  | Node.js, Express, TypeScript, bcrypt, JWT (jsonwebtoken), Zod |
| Database | PostgreSQL 16 — raw SQL via `node-postgres` (no ORM) |
| Dev      | Docker Compose (local Postgres) |

## Getting Started

### 1. Start the database

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # set JWT_SECRET to a strong value
npm install
npm run migrate               # run SQL migrations
npm run dev                   # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

## Project Structure

```
desol/
├── frontend/          React + Vite SPA
│   └── src/
│       ├── api/       Typed fetch wrappers
│       ├── components/
│       │   ├── Canvas/
│       │   │   ├── DiagramCanvas.tsx
│       │   │   ├── NodePropertiesPanel.tsx   (node + edge + group properties)
│       │   │   ├── VersionHistoryDrawer.tsx
│       │   │   ├── CodeViewModal.tsx          (NEW — JSON code view)
│       │   │   └── edges/
│       │   │       └── DiagramEdge.tsx        (NEW — animated edges + icons)
│       │   ├── Header/    EditorHeader         ({ } code-view button)
│       │   ├── Sidebar/   NodePalette          (animated toggle, edge icon picker)
│       │   ├── shared/
│       │   │   └── IconPicker.tsx             (NEW — Lucide icon grid picker)
│       │   └── nodes/
│       │       ├── ArchNode.tsx               (icons, multiline description)
│       │       ├── ERDNode.tsx                (Table icon)
│       │       ├── ClassNode.tsx              (Box/Layers icon)
│       │       ├── ComponentNode.tsx          (Puzzle icon)
│       │       ├── FlowNode.tsx
│       │       ├── ActivityNode.tsx
│       │       └── GroupNode.tsx              (NEW — resizable labeled group)
│       ├── hooks/     useAutoLayout
│       ├── pages/     Auth, Dashboard, Editor, NotFound
│       ├── stores/    diagramStore.ts          (edgeAnimated, edgeIcon, selectedEdgeId, group actions)
│       └── utils/
│           ├── dagre.ts
│           ├── mermaid-converter.ts
│           └── diagramIcons.ts               (NEW — Lucide icon map + serviceType defaults)
├── backend/           Express API
│   └── src/
│       ├── controllers/
│       ├── db/
│       │   ├── migrations/  001_users, 002_diagrams, 003_diagram_versions
│       │   └── queries/     users, diagrams, versions
│       ├── middleware/  auth (JWT), validate (Zod)
│       ├── routes/
│       └── utils/     jwt.ts
├── docker-compose.yml
└── README.md
```

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET  | `/api/diagrams` | List diagrams |
| POST | `/api/diagrams` | Create diagram |
| GET  | `/api/diagrams/:id` | Get diagram |
| PUT  | `/api/diagrams/:id` | Save canvas (creates version) |
| DELETE | `/api/diagrams/:id` | Delete diagram |
| GET  | `/api/diagrams/:id/versions` | List versions |
| GET  | `/api/diagrams/:id/versions/:vId` | Get version |
| POST | `/api/diagrams/:id/versions/:vId/restore` | Restore version |
| POST | `/api/diagrams/:id/export/mermaid` | Mermaid export (Phase 2 stub) |

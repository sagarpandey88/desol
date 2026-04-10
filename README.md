# Desol — Architectural Design App

An online diagramming tool supporting 6 diagram types: Architecture Block, Flowchart, ERD, Class, Component, and Activity diagrams. Built with React + React Flow + Dagre on the frontend and Node.js + Express + PostgreSQL on the backend.

## Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, Vite, TypeScript, React Flow v11, Dagre, Zustand, React Router v6 |
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
│       │   ├── Canvas/    DiagramCanvas, NodePropertiesPanel, VersionHistoryDrawer
│       │   ├── Header/    EditorHeader
│       │   ├── Sidebar/   NodePalette
│       │   └── nodes/     ArchNode, FlowNode, ERDNode, ClassNode, ComponentNode, ActivityNode
│       ├── hooks/     useAutoLayout
│       ├── pages/     Auth, Dashboard, Editor, NotFound
│       ├── stores/    Zustand diagramStore
│       └── utils/     dagre.ts, mermaid-converter.ts
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

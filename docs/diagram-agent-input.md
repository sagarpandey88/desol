---
title: Diagram Code Agent Input
description: Exhaustive, frontend-focused instructions and templates for agents to generate diagram code (components, stores, utils, snapshots, tests).
---

# Diagram Code Agent Input (frontend-only)

Purpose: concise, exhaustive instructions an agent should follow to generate or modify diagram UI code and client-side snapshots. No backend implementation guidance is included — future MCP server will handle project/diagram creation and persistence.

Key concepts
- Diagram: JSON snapshot representing nodes, edges, layout, and metadata.
- Node: visual element with `id`, `type`, `label`, `layout` (x,y,w,h), `props`, and `meta`.
- Edge: connection with `id`, `source`, `target`, `type`, `label`, and `props`.
- Snapshot / Version: complete, self-contained JSON of a diagram suitable for storing or exporting.

Canonical diagram snapshot (strict agent schema)
```json
{
  "id": "string",                    
  "title": "string",
  "projectId": "string | null",
  "nodes": [
    {
      "id": "string",
      "type": "Activity|Class|Flow|ERD|Component|Group|Arch|Custom",
      "label": "string",
      "layout": { "x": 0, "y": 0, "width": 100, "height": 60 },
      "props": { /* serializable UI props */ },
      "meta": { /* non-UI metadata */ }
    }
  ],
  "edges": [
    {
      "id": "string",
      "source": "nodeId",
      "target": "nodeId",
      "type": "default|dashed|curved",
      "label": "string",
      "props": { }
    }
  ],
  "layout": { "version": 1, "settings": { "spacing": 40, "direction": "LR" } },
  "metadata": { "author": "string", "createdAt": "ISO-8601" }
}
```

Props and Meta — detailed guidance

Props (purpose and shape)
- Purpose: `props` contains all UI-rendering and behavior data required by node components and the properties panel. Agents must produce only serializable values (primitives, arrays, plain objects). No functions, DOM refs, or circular structures.
- Recommended keys and types (examples):
  - `label`: string — visible text (also used by search and accessibility).
  - `icon`: string|null — icon id from `diagramIcons`.
  - `color`: string (hex) — primary node color.
  - `stroke`: string (hex) — border color.
  - `collapsed`: boolean — UI-only flag for groups.
  - `expanded`: boolean — inverse of collapsed where applicable.
  - `visible`: boolean — whether node is rendered.
  - `locked`: boolean — prevents moves/edits in the UI.
  - `zIndex`: number — render ordering hint.
  - `data`: object — arbitrary serializable payload for domain-specific display (keep small).
  - `anchors`: Array<{ x: number; y: number; id?: string }> — hotspot positions relative to node origin (0..1 or px depending on team convention).

Props constraints and rules
- Size: prefer small payloads; avoid embedding large blobs (images/binaries) — use references/URLs instead.
- Types: use consistent types across nodes of same `type`.
- Defaults: agents must include defaults when a prop is omitted (document defaults in the generated patch description).
- Validation: if a prop includes constrained values (e.g., `direction` in `Flow` nodes), provide an allowed-values list in the patch output.

Properties Panel mapping
- Each prop must map to a descriptor consumed by `NodePropertiesPanel`:
  - descriptor keys: `key`, `type` (text/number/color/checkbox/select), `label`, `default`, `options?`, `help?`.
- Example descriptor for `color`:
```ts
{ key: 'color', type: 'color', label: 'Color', default: '#ffffff' }
```
- Agents must add descriptors for all editable props and include them in the patch alongside any UI changes to `NodePropertiesPanel` datasource.

Serialization and round-trip
- Export: `props` must be JSON-serializable; nested objects allowed but keep depth reasonable (<4 levels recommended).
- Import: `props` must be consumed to recreate UI state exactly (types preserved). Agents should provide sample import code or a small loader snippet when adding new prop shapes.

Meta (purpose and shape)
- Purpose: `meta` stores non-UI metadata that should not influence rendering (audit info, ids, tooling hints). Keep `meta` namespaced to avoid collisions, e.g. `meta._tooling.updatedBy`.
- Recommended keys and types (examples):
  - `_createdBy`: string (user id)
  - `_createdAt`: ISO-8601 timestamp
  - `_updatedBy`: string
  - `_updatedAt`: ISO-8601 timestamp
  - `_source`: string (e.g., 'import', 'generator', 'manual')
  - `_version`: number — schema version for node-level migrations
  - `_notes`: string — short editor notes

Meta constraints and rules
- Not for UI: do not put display logic in `meta` — UI code should read `props` for rendering.
- Namespacing: use leading underscore for tooling metadata to reduce accidental UI use.
- Migration: when changing `props` shape, increment node-level `meta._version` and include a transformation function in the patch description.

Examples
- Small `props` example:
```json
"props": {
  "label": "Authenticate",
  "icon": "lock",
  "color": "#0b74de",
  "locked": false,
  "anchors": [{ "x": 0.5, "y": 1, "id": "out-1" }]
}
```

- Corresponding `meta` example:
```json
"meta": {
  "_createdBy": "user:alice",
  "_createdAt": "2026-04-13T12:00:00Z",
  "_source": "generator:v1",
  "_version": 1
}
```

Agent output requirements when adding new props/meta
- Include TypeScript interfaces for new props and meta entries.
- Add properties panel descriptors for editable props.
- Provide import/export examples demonstrating round-trip JSON.
- If props shape changes are breaking, include a migration snippet and bump `meta._version`.







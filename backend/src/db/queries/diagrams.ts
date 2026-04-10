import pool from '../index';

export interface DiagramRow {
  id: string;
  user_id: string;
  name: string;
  diagram_type: string;
  flow_data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export async function listDiagramsByUser(userId: string): Promise<DiagramRow[]> {
  const { rows } = await pool.query<DiagramRow>(
    `SELECT id, user_id, name, diagram_type, flow_data, created_at, updated_at
     FROM diagrams
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function createDiagram(
  userId: string,
  name: string,
  diagramType: string,
  flowData: Record<string, unknown>
): Promise<DiagramRow> {
  const { rows } = await pool.query<DiagramRow>(
    `INSERT INTO diagrams (user_id, name, diagram_type, flow_data)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, name, diagramType, JSON.stringify(flowData)]
  );
  return rows[0];
}

export async function getDiagramById(
  id: string,
  userId: string
): Promise<DiagramRow | null> {
  const { rows } = await pool.query<DiagramRow>(
    `SELECT * FROM diagrams
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return rows[0] ?? null;
}

export async function updateDiagram(
  id: string,
  userId: string,
  updates: { name?: string; flowData?: Record<string, unknown> }
): Promise<DiagramRow | null> {
  const setClauses: string[] = ['updated_at = now()'];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.name !== undefined) {
    setClauses.push(`name = $${idx++}`);
    values.push(updates.name);
  }
  if (updates.flowData !== undefined) {
    setClauses.push(`flow_data = $${idx++}`);
    values.push(JSON.stringify(updates.flowData));
  }

  values.push(id);
  values.push(userId);

  const { rows } = await pool.query<DiagramRow>(
    `UPDATE diagrams
     SET ${setClauses.join(', ')}
     WHERE id = $${idx++} AND user_id = $${idx}
     RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function deleteDiagram(
  id: string,
  userId: string
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM diagrams WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return (rowCount ?? 0) > 0;
}

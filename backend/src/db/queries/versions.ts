import pool from '../index';

export interface VersionRow {
  id: string;
  diagram_id: string;
  version_number: number;
  flow_data: Record<string, unknown>;
  label: string | null;
  created_by: string | null;
  created_at: Date;
}

export type VersionSummary = Omit<VersionRow, 'flow_data'>;

export async function createVersion(
  diagramId: string,
  flowData: Record<string, unknown>,
  label: string | null,
  createdBy: string
): Promise<VersionRow> {
  const { rows } = await pool.query<VersionRow>(
    `INSERT INTO diagram_versions (diagram_id, flow_data, label, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [diagramId, JSON.stringify(flowData), label, createdBy]
  );
  return rows[0];
}

export async function listVersionsByDiagram(
  diagramId: string
): Promise<VersionSummary[]> {
  const { rows } = await pool.query<VersionSummary>(
    `SELECT id, diagram_id, version_number, label, created_by, created_at
     FROM diagram_versions
     WHERE diagram_id = $1
     ORDER BY version_number DESC`,
    [diagramId]
  );
  return rows;
}

export async function getVersionById(
  diagramId: string,
  versionId: string
): Promise<VersionRow | null> {
  const { rows } = await pool.query<VersionRow>(
    `SELECT * FROM diagram_versions
     WHERE id = $1 AND diagram_id = $2`,
    [versionId, diagramId]
  );
  return rows[0] ?? null;
}

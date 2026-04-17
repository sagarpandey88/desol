import pool from '../index';

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function listProjectsByUser(userId: string): Promise<ProjectRow[]> {
  const { rows } = await pool.query<ProjectRow>(
    `SELECT id, user_id, name, description, created_at, updated_at
     FROM projects
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function createProject(
  userId: string,
  name: string,
  description?: string | null
): Promise<ProjectRow> {
  const { rows } = await pool.query<ProjectRow>(
    `INSERT INTO projects (user_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, name, description ?? null]
  );
  return rows[0];
}

export async function getProjectById(
  id: string,
  userId: string
): Promise<ProjectRow | null> {
  const { rows } = await pool.query<ProjectRow>(
    `SELECT id, user_id, name, description, created_at, updated_at
     FROM projects
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return rows[0] ?? null;
}

export async function updateProject(
  id: string,
  userId: string,
  name: string
): Promise<ProjectRow | null> {
  const { rows } = await pool.query<ProjectRow>(
    `UPDATE projects
     SET name = $1,
         updated_at = now()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [name, id, userId]
  );
  return rows[0] ?? null;
}

export async function deleteProject(
  id: string,
  userId: string
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM projects WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return (rowCount ?? 0) > 0;
}
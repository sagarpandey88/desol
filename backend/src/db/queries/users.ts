import pool from '../index';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export async function createUser(
  email: string,
  passwordHash: string
): Promise<UserRow> {
  const { rows } = await pool.query<UserRow>(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, password_hash, created_at`,
    [email, passwordHash]
  );
  return rows[0];
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>(
    `SELECT id, email, password_hash, created_at
     FROM users
     WHERE email = $1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>(
    `SELECT id, email, password_hash, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

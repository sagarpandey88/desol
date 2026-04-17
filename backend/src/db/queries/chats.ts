import pool from '../index';

export interface ChatRow {
  id: string;
  diagram_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: Date;
}

export async function getChatHistory(diagramId: string): Promise<ChatRow[]> {
  const { rows } = await pool.query<ChatRow>(
    `SELECT id, diagram_id, role, content, created_at
     FROM diagram_chats
     WHERE diagram_id = $1
     ORDER BY created_at ASC`,
    [diagramId]
  );
  return rows;
}

export async function saveChatMessage(
  diagramId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<ChatRow> {
  const { rows } = await pool.query<ChatRow>(
    `INSERT INTO diagram_chats (diagram_id, role, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [diagramId, role, content]
  );
  return rows[0];
}

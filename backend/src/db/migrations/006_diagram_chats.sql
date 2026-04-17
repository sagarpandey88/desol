CREATE TABLE IF NOT EXISTS diagram_chats (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id   UUID        NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  role         VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content      TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagram_chats_diagram_created
  ON diagram_chats (diagram_id, created_at ASC);

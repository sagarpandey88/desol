CREATE TABLE IF NOT EXISTS diagrams (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  diagram_type VARCHAR(50)  NOT NULL CHECK (
    diagram_type IN ('architecture', 'flowchart', 'erd', 'class', 'component', 'activity')
  ),
  flow_data    JSONB        NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagrams_user_created
  ON diagrams (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_diagrams_flow_data
  ON diagrams USING GIN (flow_data);

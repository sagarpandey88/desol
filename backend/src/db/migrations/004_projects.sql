CREATE TABLE IF NOT EXISTS projects (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE diagrams
  ADD COLUMN IF NOT EXISTS project_id UUID;

ALTER TABLE diagrams
  DROP CONSTRAINT IF EXISTS diagrams_project_id_fkey;

ALTER TABLE diagrams
  ADD CONSTRAINT diagrams_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_user_created
  ON projects (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_diagrams_user_project_created
  ON diagrams (user_id, project_id, created_at DESC);
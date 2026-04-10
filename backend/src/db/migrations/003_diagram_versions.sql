CREATE TABLE IF NOT EXISTS diagram_versions (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id     UUID         NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  version_number INT          NOT NULL DEFAULT 0,
  flow_data      JSONB        NOT NULL,
  label          VARCHAR(255),
  created_by     UUID         REFERENCES users(id),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_diagram_versions_unique
  ON diagram_versions (diagram_id, version_number);

CREATE INDEX IF NOT EXISTS idx_diagram_versions_diagram_ver
  ON diagram_versions (diagram_id, version_number DESC);

-- Auto-increment version_number per diagram via trigger
CREATE OR REPLACE FUNCTION set_version_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
    INTO NEW.version_number
    FROM diagram_versions
   WHERE diagram_id = NEW.diagram_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_version_number ON diagram_versions;
CREATE TRIGGER trg_set_version_number
  BEFORE INSERT ON diagram_versions
  FOR EACH ROW
  WHEN (NEW.version_number IS NULL OR NEW.version_number = 0)
  EXECUTE FUNCTION set_version_number();

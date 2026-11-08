exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      id_actor UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(100) NOT NULL,
      target_id UUID NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_audit_log_target_created ON audit_log (target_type, target_id, created_at DESC);
    CREATE INDEX idx_audit_log_actor_created ON audit_log (id_actor, created_at DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TABLE IF EXISTS audit_log;');
};

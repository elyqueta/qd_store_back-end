/**
 * Regista operações de criação idempotentes para o fluxo de empresa e encomenda.
 * O objetivo é impedir duplicação quando o cliente reenvia a mesma operação com a
 * mesma chave de idempotência, mesmo que o pedido tenha sido aceito previamente.
 */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('idempotency_operation', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    id_user: {
      type: 'uuid',
      notNull: true,
    },
    operation_type: {
      type: 'varchar(64)',
      notNull: true,
    },
    idempotency_key: {
      type: 'varchar(255)',
      notNull: true,
    },
    request_hash: {
      type: 'varchar(128)',
      notNull: true,
    },
    response_payload: {
      type: 'jsonb',
      default: null,
    },
    resource_type: {
      type: 'varchar(50)',
      default: null,
    },
    resource_id: {
      type: 'uuid',
      default: null,
    },
    status: {
      type: 'varchar(32)',
      notNull: true,
      check: "status IN ('in_progress', 'completed', 'failed')",
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('idempotency_operation', ['id_user', 'operation_type', 'idempotency_key'], {
    unique: true,
    name: 'idempotency_operation_unique_user_operation_key',
  });

  pgm.createIndex('idempotency_operation', ['status'], {
    name: 'idx_idempotency_operation_status',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('idempotency_operation', { cascade: true });
};

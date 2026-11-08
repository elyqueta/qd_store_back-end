exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('service', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(120)', notNull: true },
    description: { type: 'text' },
    icon: { type: 'varchar(60)', notNull: true },
    image_url: { type: 'text' },
    image_cloudinary_public_id: { type: 'text' },
    starts_from_price: { type: 'decimal(15,2)' },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.addConstraint('service', 'service_starts_from_price_check', {
    check: 'starts_from_price IS NULL OR starts_from_price >= 0',
  });
  pgm.createTrigger('service', 'trg_service_set_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'set_updated_at',
  });
  pgm.createIndex('service', ['is_active', 'created_at'], {
    name: 'idx_service_active_created',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('service');
};

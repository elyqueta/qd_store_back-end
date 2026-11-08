exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createType('highlight_placement', ['hero', 'showcase', 'category_block']);
  pgm.createTable('highlight', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    placement: { type: 'highlight_placement', notNull: true },
    title: { type: 'varchar(120)', notNull: true },
    subtitle: { type: 'varchar(255)' },
    label: { type: 'varchar(60)' },
    cta_label: { type: 'varchar(60)' },
    cta_url: { type: 'varchar(255)' },
    image_url: { type: 'text' },
    image_cloudinary_public_id: { type: 'text' },
    theme: { type: 'varchar(10)', notNull: true, default: 'dark' },
    id_product: { type: 'uuid', references: 'product', onDelete: 'SET NULL' },
    id_category: { type: 'uuid', references: 'category', onDelete: 'SET NULL' },
    display_order: { type: 'integer', notNull: true, default: 0 },
    is_active: { type: 'boolean', notNull: true, default: true },
    starts_at: { type: 'timestamp' },
    ends_at: { type: 'timestamp' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.addConstraint('highlight', 'highlight_theme_check', { check: "theme IN ('dark', 'light')" });
  pgm.addConstraint('highlight', 'highlight_dates_check', {
    check: 'ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at',
  });
  pgm.createTrigger('highlight', 'trg_highlight_set_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'set_updated_at',
  });
  pgm.createIndex('highlight', ['placement', 'is_active', 'display_order'], {
    name: 'idx_highlight_placement_active_order',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('highlight');
  pgm.dropType('highlight_placement');
};

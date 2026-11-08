exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('users', {
    profile_photo_url: { type: 'text' },
    profile_photo_cloudinary_public_id: { type: 'text' },
    profile_photo_width: { type: 'integer' },
    profile_photo_height: { type: 'integer' },
    profile_photo_format: { type: 'varchar(10)' },
    profile_photo_size_bytes: { type: 'integer' },
  });

  pgm.createTable('user_profile_history', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    id_user: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    field_name: { type: 'varchar(20)', notNull: true },
    old_value: { type: 'text', notNull: true },
    new_value: { type: 'text', notNull: true },
    changed_by: { type: 'uuid', references: 'users', onDelete: 'SET NULL' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.addConstraint('user_profile_history', 'user_profile_history_field_name_check', {
    check: "field_name IN ('email', 'phone')",
  });

  pgm.createIndex('user_profile_history', ['id_user', 'created_at'], {
    name: 'idx_user_profile_history_user_created',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('user_profile_history');
  pgm.dropColumns('users', [
    'profile_photo_url',
    'profile_photo_cloudinary_public_id',
    'profile_photo_width',
    'profile_photo_height',
    'profile_photo_format',
    'profile_photo_size_bytes',
  ]);
};

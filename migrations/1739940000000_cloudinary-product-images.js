/**
 * Store Cloudinary asset identifiers and retain failed deletions for retry.
 */
exports.up = (pgm) => {
  pgm.addColumn('product_image', {
    cloudinary_public_id: { type: 'text' },
  });

  pgm.createTable('cloudinary_asset_deletion', {
    public_id: { type: 'text', primaryKey: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('cloudinary_asset_deletion');
  pgm.dropColumn('product_image', 'cloudinary_public_id');
};

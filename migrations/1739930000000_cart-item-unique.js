exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    WITH duplicates AS (
      SELECT id, id_cart, id_product,
             ROW_NUMBER() OVER (PARTITION BY id_cart, id_product ORDER BY id) AS position,
             SUM(quantity) OVER (PARTITION BY id_cart, id_product) AS total_quantity
      FROM cart_item
    ),
    keepers AS (
      UPDATE cart_item AS item
      SET quantity = duplicates.total_quantity
      FROM duplicates
      WHERE item.id = duplicates.id AND duplicates.position = 1
      RETURNING item.id
    )
    DELETE FROM cart_item
    WHERE id IN (
      SELECT id FROM duplicates WHERE position > 1
    );

    -- Esta constraint garante integridade entre carrinho e produto; não altera o modelo de dados.
    ALTER TABLE cart_item
      ADD CONSTRAINT ux_cart_item_cart_product UNIQUE (id_cart, id_product);
  `);
};

exports.down = (pgm) => {
  pgm.dropConstraint('cart_item', 'ux_cart_item_cart_product');
};

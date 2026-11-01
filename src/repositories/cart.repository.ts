import { query } from '../database/pool';
import { Cart, CartItemRow } from '../types/cart.types';

async function getOrCreateCartId(userId: string): Promise<string> {
  await query(
    `INSERT INTO cart (id_user) VALUES ($1)
     ON CONFLICT (id_user) DO NOTHING`,
    [userId]
  );
  const result = await query<{ id: string }>('SELECT id FROM cart WHERE id_user = $1', [userId]);
  const cartId = result.rows[0]?.id;

  if (!cartId) {
    throw new Error('Não foi possível obter o carrinho do utilizador.');
  }

  return cartId;
}

async function findCartByUser(userId: string): Promise<Cart> {
  const result = await query<CartItemRow>(
    `SELECT cart.id AS cart_id, cart_item.id AS item_id, product.id AS product_id,
            product.name AS product_name, first_image.url AS image_url,
            cart_item.quantity, product.price AS product_price,
            product.status AS product_status
     FROM cart
     LEFT JOIN cart_item ON cart_item.id_cart = cart.id
     LEFT JOIN product ON product.id = cart_item.id_product
     LEFT JOIN LATERAL (
       SELECT url
       FROM product_image
       WHERE id_product = product.id
       ORDER BY display_order ASC, id ASC
       LIMIT 1
     ) AS first_image ON true
     WHERE cart.id_user = $1
     ORDER BY cart_item.id ASC`,
    [userId]
  );

  const cartId = result.rows[0]?.cart_id;
  if (!cartId) {
    throw new Error('Carrinho do utilizador não encontrado.');
  }

  const items = result.rows.flatMap((row) => {
    if (
      row.item_id === null ||
      row.product_id === null ||
      row.product_name === null ||
      row.quantity === null ||
      row.product_price === null ||
      row.product_status === null
    ) {
      return [];
    }

    // A API mostra sempre o preço actual; unit_price é actualizado nas escritas para manter o registo alinhado.
    const priceCents = Math.round(Number(row.product_price) * 100);
    const subtotalCents = priceCents * row.quantity;
    return [
      {
        id: row.item_id,
        productId: row.product_id,
        productName: row.product_name,
        imageUrl: row.image_url,
        quantity: row.quantity,
        unitPrice: priceCents / 100,
        subtotal: subtotalCents / 100,
        productStatus: row.product_status,
      },
    ];
  });
  const totalCents = items.reduce((total, item) => total + Math.round(item.subtotal * 100), 0);

  return {
    id: cartId,
    items,
    itemsCount: items.reduce((count, item) => count + item.quantity, 0),
    total: totalCents / 100,
  };
}

async function addItem(
  cartId: string,
  productId: string,
  quantity: number,
  unitPrice: number
): Promise<void> {
  await query(
    `INSERT INTO cart_item (id_cart, id_product, quantity, unit_price)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id_cart, id_product)
     DO UPDATE SET quantity = LEAST(cart_item.quantity + EXCLUDED.quantity, 99),
                   unit_price = EXCLUDED.unit_price`,
    [cartId, productId, quantity, unitPrice]
  );
}

async function updateItemQuantity(
  cartId: string,
  itemId: string,
  quantity: number,
  unitPrice?: number
): Promise<boolean> {
  const result = await query(
    `UPDATE cart_item
     SET quantity = $3,
         unit_price = COALESCE(
           $4,
           (SELECT product.price FROM product WHERE product.id = cart_item.id_product)
         )
     WHERE id = $1 AND id_cart = $2`,
    [itemId, cartId, quantity, unitPrice ?? null]
  );
  return (result.rowCount ?? 0) > 0;
}

async function removeItem(cartId: string, itemId: string): Promise<boolean> {
  const result = await query('DELETE FROM cart_item WHERE id = $1 AND id_cart = $2', [
    itemId,
    cartId,
  ]);
  return (result.rowCount ?? 0) > 0;
}

async function clear(cartId: string): Promise<void> {
  await query('DELETE FROM cart_item WHERE id_cart = $1', [cartId]);
}

export const cartRepository = {
  getOrCreateCartId,
  findCartByUser,
  addItem,
  updateItemQuantity,
  removeItem,
  clear,
};

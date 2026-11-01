import { query } from '../database/pool';
import { WishlistItem, WishlistRow } from '../types/wishlist.types';

function toWishlistItem(row: WishlistRow): WishlistItem {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.product_name,
    price: Number(row.price),
    originalPrice: row.original_price !== null ? Number(row.original_price) : null,
    badge: row.badge,
    status: row.status,
    imageUrl: row.image_url,
    createdAt: row.created_at,
  };
}

const WISHLIST_SELECT = `SELECT wishlist.id, product.id AS product_id, product.name AS product_name,
  product.price, product.original_price, product.badge, product.status,
  first_image.url AS image_url, wishlist.created_at
  FROM wishlist
  INNER JOIN product ON product.id = wishlist.id_product
  LEFT JOIN LATERAL (
    SELECT url
    FROM product_image
    WHERE id_product = product.id
    ORDER BY display_order ASC, id ASC
    LIMIT 1
  ) AS first_image ON true`;

async function findAllByUser(userId: string): Promise<WishlistItem[]> {
  const result = await query<WishlistRow>(
    `${WISHLIST_SELECT}
     WHERE wishlist.id_user = $1
     ORDER BY wishlist.created_at DESC, wishlist.id DESC`,
    [userId]
  );
  return result.rows.map(toWishlistItem);
}

async function add(userId: string, productId: string): Promise<boolean> {
  const result = await query(
    `INSERT INTO wishlist (id_user, id_product)
     VALUES ($1, $2)
     ON CONFLICT (id_user, id_product) DO NOTHING
     RETURNING id`,
    [userId, productId]
  );
  return (result.rowCount ?? 0) > 0;
}

async function findByUserAndProduct(
  userId: string,
  productId: string
): Promise<WishlistItem | null> {
  const result = await query<WishlistRow>(
    `${WISHLIST_SELECT}
     WHERE wishlist.id_user = $1 AND wishlist.id_product = $2`,
    [userId, productId]
  );
  const row = result.rows[0];
  return row ? toWishlistItem(row) : null;
}

async function remove(userId: string, productId: string): Promise<void> {
  await query('DELETE FROM wishlist WHERE id_user = $1 AND id_product = $2', [userId, productId]);
}

export const wishlistRepository = { findAllByUser, add, findByUserAndProduct, remove };

import { query } from '../../database/pool';
import { SEED_WISHLIST_ITEMS, SEED_NOTIFICATIONS } from './data';

/**
 * Seed de ENGAGEMENT: wishlists e notificações.
 *
 * Responsabilidade única: dar aos utilizadores de teste conteúdo de
 * engagement (favoritos e notificações) para exercitar essas rotas.
 */
export async function seedWishlists(userIds: Map<string, string>): Promise<void> {
  for (const item of SEED_WISHLIST_ITEMS) {
    const userId = userIds.get(item.userEmail);

    if (!userId) {
      console.error(`Utilizador "${item.userEmail}" não encontrado para wishlist.`);
      continue;
    }

    const productResult = await query<{ id: string }>('SELECT id FROM product WHERE name = $1', [
      item.productName,
    ]);
    const productId = productResult.rows[0]?.id;

    if (!productId) {
      console.error(`Produto "${item.productName}" não encontrado para wishlist.`);
      continue;
    }

    const existing = await query<{ id: string }>(
      'SELECT id FROM wishlist WHERE id_user = $1 AND id_product = $2',
      [userId, productId]
    );

    if (existing.rows[0]) {
      console.warn(`Wishlist de "${item.userEmail}" para "${item.productName}" já existe. Nada a fazer.`);
      continue;
    }

    await query(
      `INSERT INTO wishlist (id_user, id_product)
       VALUES ($1, $2)`,
      [userId, productId]
    );

    console.warn(`Wishlist criada: "${item.userEmail}" -> "${item.productName}".`);
  }
}

export async function seedNotifications(userIds: Map<string, string>): Promise<void> {
  for (const notification of SEED_NOTIFICATIONS) {
    const userId = userIds.get(notification.userEmail);

    if (!userId) {
      console.error(`Utilizador "${notification.userEmail}" não encontrado para notificação.`);
      continue;
    }

    const existing = await query<{ id: string }>(
      `SELECT id FROM notification
       WHERE id_user = $1 AND type = $2 AND message = $3`,
      [userId, notification.type, notification.message]
    );

    if (existing.rows[0]) {
      console.warn(`Notificação para "${notification.userEmail}" já existe. Nada a fazer.`);
      continue;
    }

    await query(
      `INSERT INTO notification (id_user, type, message)
       VALUES ($1, $2, $3)`,
      [userId, notification.type, notification.message]
    );

    console.warn(`Notificação criada para "${notification.userEmail}" (${notification.type}).`);
  }
}
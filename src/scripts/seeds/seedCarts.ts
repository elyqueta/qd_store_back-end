import { query } from '../../database/pool';
import { SEED_CART_ITEMS } from './data';

/**
 * Seed de CARRINHOS e ITENS DE CARRINHO.
 *
 * Responsabilidade única: garantir que os utilizadores de teste têm
 * carrinhos com itens associados, prontos para testar checkout.
 */
export async function seedCarts(userIds: Map<string, string>): Promise<void> {
  // Criar carrinho para cada utilizador que tenha items no seed
  const cartUserEmails = [...new Set(SEED_CART_ITEMS.map((item) => item.userEmail))];

  for (const userEmail of cartUserEmails) {
    const userId = userIds.get(userEmail);

    if (!userId) {
      console.error(`Utilizador "${userEmail}" não encontrado para criar carrinho.`);
      continue;
    }

    const existing = await query<{ id: string }>('SELECT id FROM cart WHERE id_user = $1', [userId]);

    if (existing.rows[0]) {
      console.warn(`Carrinho do utilizador "${userEmail}" já existe (id: ${existing.rows[0].id}). Nada a fazer.`);
      continue;
    }

    const result = await query<{ id: string }>(
      `INSERT INTO cart (id_user)
       VALUES ($1)
       RETURNING id`,
      [userId]
    );

    console.warn(`Carrinho criado para "${userEmail}" (id: ${result.rows[0]?.id})`);
  }
}

export async function seedCartItems(userIds: Map<string, string>): Promise<void> {
  for (const item of SEED_CART_ITEMS) {
    const userId = userIds.get(item.userEmail);

    if (!userId) {
      console.error(`Utilizador "${item.userEmail}" não encontrado para item de carrinho.`);
      continue;
    }

    const cartResult = await query<{ id: string }>('SELECT id FROM cart WHERE id_user = $1', [userId]);
    const cartId = cartResult.rows[0]?.id;

    if (!cartId) {
      console.error(`Carrinho do utilizador "${item.userEmail}" não encontrado.`);
      continue;
    }

    const productResult = await query<{ id: string; price: string }>(
      'SELECT id, price FROM product WHERE name = $1',
      [item.productName]
    );
    const product = productResult.rows[0];

    if (!product) {
      console.error(`Produto "${item.productName}" não encontrado para item de carrinho.`);
      continue;
    }

    const existing = await query<{ id: string }>(
      'SELECT id FROM cart_item WHERE id_cart = $1 AND id_product = $2',
      [cartId, product.id]
    );

    if (existing.rows[0]) {
      console.warn(`Item "${item.productName}" já existe no carrinho de "${item.userEmail}". Nada a fazer.`);
      continue;
    }

    await query(
      `INSERT INTO cart_item (id_cart, id_product, quantity, unit_price)
       VALUES ($1, $2, $3, $4)`,
      [cartId, product.id, item.quantity, Number(product.price)]
    );

    console.warn(`Item de carrinho criado: ${item.quantity}x "${item.productName}" para "${item.userEmail}".`);
  }
}
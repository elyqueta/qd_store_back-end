import { query } from '../../database/pool';
import { SEED_ORDERS } from './data';

/**
 * Seed de PEDIDOS (orders, order_address, order_item, order_payment,
 * payment_detail, order_history).
 *
 * Responsabilidade única: criar pedidos completos e consistentes com
 * todos os registos dependentes necessários para testar o fluxo de
 * encomendas. Cada pedido usa dados canónicos já criados pelos outros
 * módulos (utilizadores, produtos, endereços, tipos de entrega e
 * métodos de pagamento).
 */
export async function seedOrders(
  userIds: Map<string, string>,
  deliveryTypeIds: Map<string, string>,
  paymentMethodIds: Map<string, string>
): Promise<void> {
  for (const order of SEED_ORDERS) {
    const userId = userIds.get(order.userEmail);

    if (!userId) {
      console.error(`Utilizador "${order.userEmail}" não encontrado para criar pedido.`);
      continue;
    }

    const deliveryTypeId = deliveryTypeIds.get(order.deliveryTypeName);
    const paymentMethodId = paymentMethodIds.get(order.paymentMethodName);

    if (!deliveryTypeId || !paymentMethodId) {
      console.error(
        `Tipo de entrega "${order.deliveryTypeName}" ou método de pagamento "${order.paymentMethodName}" não encontrado.`
      );
      continue;
    }

    // Buscar endereço padrão do utilizador para snapshot no pedido
    const addressResult = await query<{
      id: string;
      province: string;
      municipality: string;
      neighborhood: string;
      address: string;
      reference: string | null;
      latitude: string | null;
      longitude: string | null;
    }>(
      `SELECT id, province, municipality, neighborhood, address, reference, latitude, longitude
       FROM address
       WHERE id_user = $1
       ORDER BY is_default DESC
       LIMIT 1`,
      [userId]
    );
    const address = addressResult.rows[0];

    if (!address) {
      console.error(`Nenhum endereço encontrado para "${order.userEmail}".`);
      continue;
    }

    // Calcular total do pedido (itens + entrega)
    let total = 0;
    const orderItems: { productId: string; quantity: number; unitPrice: number; subtotal: number }[] = [];

    for (const item of order.items) {
      const productResult = await query<{ id: string; price: string }>(
        'SELECT id, price FROM product WHERE name = $1',
        [item.productName]
      );
      const product = productResult.rows[0];

      if (!product) {
        console.error(`Produto "${item.productName}" não encontrado para o pedido de "${order.userEmail}".`);
        continue;
      }

      const unitPrice = Number(product.price);
      const subtotal = unitPrice * item.quantity;
      total += subtotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      });
    }

    if (orderItems.length === 0) {
      console.error(`Nenhum item válido para o pedido de "${order.userEmail}".`);
      continue;
    }

    // Buscar preço do tipo de entrega
    const deliveryResult = await query<{ price: string }>(
      'SELECT price FROM delivery_type WHERE id = $1',
      [deliveryTypeId]
    );
    const deliveryPrice = Number(deliveryResult.rows[0]?.price ?? 0);
    total += deliveryPrice;

    // Verificar se já existe um pedido para este utilizador com os
    // mesmos itens (idempotência por conteúdo, não por referência)
    const existingOrder = await query<{ id: string }>(
      `SELECT o.id
       FROM orders o
       JOIN order_item oi ON oi.id_order = o.id
       WHERE o.id_user = $1
         AND oi.id_product = ANY($2::uuid[])
       GROUP BY o.id
       HAVING COUNT(DISTINCT oi.id_product) = $3`,
      [userId, orderItems.map((item) => item.productId), orderItems.length]
    );

    if (existingOrder.rows[0]) {
      console.warn(`Pedido de "${order.userEmail}" com os mesmos itens já existe (id: ${existingOrder.rows[0].id}). Nada a fazer.`);
      continue;
    }

    // Gerar referência única do pedido
    const reference = `QD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const orderResult = await query<{ id: string }>(
      `INSERT INTO orders (reference, id_user, type, status, id_payment_method, id_delivery_type, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [reference, userId, 'personal', order.status, paymentMethodId, deliveryTypeId, total]
    );
    const orderId = orderResult.rows[0]?.id;

    if (!orderId) {
      console.error(`Falha ao criar pedido para "${order.userEmail}".`);
      continue;
    }

    // Snapshot do endereço no pedido
    await query(
      `INSERT INTO order_address
         (id_order, id_address_origin, province, municipality, neighborhood, address, reference, latitude, longitude, snapshot_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        orderId,
        address.id,
        address.province,
        address.municipality,
        address.neighborhood,
        address.address,
        address.reference,
        address.latitude !== null ? Number(address.latitude) : null,
        address.longitude !== null ? Number(address.longitude) : null,
      ]
    );

    // Itens do pedido
    for (const item of orderItems) {
      await query(
        `INSERT INTO order_item (id_order, id_product, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.productId, item.quantity, item.unitPrice, item.subtotal]
      );
    }

    // Pagamento do pedido
    const paymentResult = await query<{ id: string }>(
      `INSERT INTO order_payment (id_order, id_payment_method, status, amount, amount_paid, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        orderId,
        paymentMethodId,
        order.paymentStatus,
        total,
        order.paymentStatus === 'confirmed' ? total : null,
        order.paymentStatus === 'confirmed' ? new Date() : null,
      ]
    );
    const paymentId = paymentResult.rows[0]?.id;

    // Detalhe do pagamento
    if (paymentId) {
      const methodType =
        order.paymentMethodName === 'Multicaixa Express'
          ? 'multicaixa_express'
          : order.paymentMethodName === 'Multicaixa Referência'
            ? 'multicaixa_reference'
            : 'bank_transfer';

      await query(
        `INSERT INTO payment_detail (id_order_payment, method_type, customer_phone)
         VALUES ($1, $2, $3)`,
        [paymentId, methodType, '923000000']
      );
    }

    // Histórico do pedido
    await query(
      `INSERT INTO order_history (id_order, previous_status, new_status, note)
       VALUES ($1, NULL, $2, 'Pedido criado via seed')`,
      [orderId, order.status]
    );

    console.warn(
      `Pedido criado: ${reference} para "${order.userEmail}" (total: ${total.toLocaleString('pt-AO')} Kz, id: ${orderId})`
    );
  }
}
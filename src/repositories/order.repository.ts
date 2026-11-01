import { getClient, query } from '../database/pool';
import { BadRequestError, ConflictError } from '../errors';
import {
  CreateOrderData,
  Order,
  OrderAddress,
  OrderAddressRow,
  OrderFilters,
  OrderHistoryEntry,
  OrderHistoryRow,
  OrderItem,
  OrderItemRow,
  OrderListResult,
  OrderRow,
  OrderStatus,
  OrderSummary,
} from '../types/order.types';
import { PaginationParams } from '../types/pagination.types';
import { OrderPaymentStatus } from '../types/payment.types';
import { PaymentMethodType } from '../types/paymentMethod.types';
import { generateOrderReference } from '../utils/reference.util';

function isPgError(error: unknown): error is { code: string; constraint?: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function toOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.id_product,
    productName: row.product_name,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    subtotal: Number(row.subtotal),
  };
}

function toOrderAddress(row: OrderAddressRow): OrderAddress {
  return {
    province: row.province,
    municipality: row.municipality,
    neighborhood: row.neighborhood,
    address: row.address,
    reference: row.reference,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
  };
}

function toOrderHistoryEntry(row: OrderHistoryRow): OrderHistoryEntry {
  return {
    id: row.id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    changedBy: row.changed_by,
    note: row.note,
    createdAt: row.created_at,
  };
}

const ORDER_COLUMNS = `id, reference, id_user, id_company, type, status, id_payment_method,
  id_delivery_type, notes, total, created_at, updated_at`;

async function createFromCart(data: CreateOrderData): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const reference = generateOrderReference();
    const client = await getClient();

    try {
      await client.query('BEGIN');
      const cartResult = await client.query<{ id: string }>(
        'SELECT id FROM cart WHERE id_user = $1 FOR UPDATE',
        [data.userId]
      );
      const cartId = cartResult.rows[0]?.id;
      if (!cartId) {
        throw new BadRequestError('O carrinho está vazio.');
      }

      const itemsResult = await client.query<{
        id: string;
        id_product: string;
        product_name: string;
        quantity: number;
        price: string;
        status: 'active' | 'inactive' | 'out_of_stock';
      }>(
        `SELECT cart_item.id, cart_item.id_product, product.name AS product_name,
                cart_item.quantity, product.price, product.status
         FROM cart_item
         INNER JOIN product ON product.id = cart_item.id_product
         WHERE cart_item.id_cart = $1
         ORDER BY cart_item.id
         FOR UPDATE OF cart_item
         FOR SHARE OF product`,
        [cartId]
      );

      if (itemsResult.rows.length === 0) {
        throw new BadRequestError('O carrinho está vazio.');
      }

      const unavailableProducts = itemsResult.rows
        .filter((item) => item.status !== 'active')
        .map((item) => item.product_name);
      if (unavailableProducts.length > 0) {
        throw new ConflictError('Existem produtos indisponíveis no carrinho.', {
          products: unavailableProducts,
        });
      }

      const itemSubtotalCents = itemsResult.rows.map((item) => ({
        ...item,
        unitPriceCents: Math.round(Number(item.price) * 100),
      }));
      const itemsTotalCents = itemSubtotalCents.reduce(
        (sum, item) => sum + item.unitPriceCents * item.quantity,
        0
      );
      const deliveryPriceCents = Math.round(data.deliveryPrice * 100);
      const total = (itemsTotalCents + deliveryPriceCents) / 100;

      const orderResult = await client.query<{ id: string }>(
        `INSERT INTO orders
           (reference, id_user, id_company, type, status, id_payment_method, id_delivery_type, notes, total)
         VALUES ($1, $2, $3, $4, 'processing', $5, $6, $7, $8)
         RETURNING id`,
        [
          reference,
          data.userId,
          data.companyId,
          data.type,
          data.paymentMethodId,
          data.deliveryTypeId,
          data.notes,
          total,
        ]
      );
      const orderId = orderResult.rows[0]?.id;
      if (!orderId) {
        throw new Error('A base de dados não devolveu o id da encomenda criada.');
      }

      await client.query(
        `INSERT INTO order_address
           (id_order, id_address_origin, province, municipality, neighborhood, address,
            reference, latitude, longitude, snapshot_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          orderId,
          data.addressId,
          data.address.province,
          data.address.municipality,
          data.address.neighborhood,
          data.address.address,
          data.address.reference,
          data.address.latitude,
          data.address.longitude,
        ]
      );

      for (const item of itemSubtotalCents) {
        const subtotal = (item.unitPriceCents * item.quantity) / 100;
        await client.query(
          `INSERT INTO order_item (id_order, id_product, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, item.id_product, item.quantity, item.unitPriceCents / 100, subtotal]
        );
      }

      await client.query(
        `INSERT INTO order_history (id_order, previous_status, new_status, changed_by, note)
         VALUES ($1, NULL, 'processing', $2, 'Encomenda criada.')`,
        [orderId, data.userId]
      );
      await client.query('DELETE FROM cart_item WHERE id_cart = $1', [cartId]);
      await client.query('COMMIT');
      return orderId;
    } catch (error) {
      await client.query('ROLLBACK');
      const isReferenceCollision =
        isPgError(error) && error.code === '23505' && error.constraint === 'orders_reference_key';
      if (isReferenceCollision && attempt < 2) {
        continue;
      }
      if (isReferenceCollision) {
        throw new ConflictError('Não foi possível gerar uma referência única para a encomenda.');
      }
      throw error;
    } finally {
      client.release();
    }
  }

  throw new ConflictError('Não foi possível gerar uma referência única para a encomenda.');
}

async function findAllByUser(
  userId: string,
  filters: Pick<OrderFilters, 'status'>,
  pagination: PaginationParams
): Promise<OrderListResult> {
  return findAll({ ...filters, userId }, pagination);
}

async function adminFindAll(
  filters: OrderFilters,
  pagination: PaginationParams
): Promise<OrderListResult> {
  return findAll(filters, pagination);
}

async function findAll(
  filters: OrderFilters,
  pagination: PaginationParams
): Promise<OrderListResult> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters.userId !== undefined) {
    values.push(filters.userId);
    conditions.push(`orders.id_user = $${values.length}`);
  }
  if (filters.status !== undefined) {
    values.push(filters.status);
    conditions.push(`orders.status = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM orders ${where}`,
    values
  );
  const total = countResult.rows[0]?.count ?? 0;
  const page = pagination.page;
  const limit = pagination.limit;

  const dataResult = await query<OrderRow & { items_count: number }>(
    `SELECT ${ORDER_COLUMNS}, COALESCE(items.items_count, 0)::int AS items_count
     FROM orders
     LEFT JOIN (
       SELECT id_order, SUM(quantity)::int AS items_count
       FROM order_item
       GROUP BY id_order
     ) AS items ON items.id_order = orders.id
     ${where}
     ORDER BY orders.created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, (page - 1) * limit]
  );

  return {
    data: dataResult.rows.map((row): OrderSummary => ({
      id: row.id,
      reference: row.reference,
      type: row.type,
      status: row.status,
      total: Number(row.total),
      itemsCount: row.items_count,
      createdAt: row.created_at,
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

async function findById(id: string): Promise<Order | null> {
  const orderResult = await query<
    OrderRow & {
      payment_id: string | null;
      payment_method_type: PaymentMethodType | null;
      payment_status: OrderPaymentStatus | null;
    }
  >(
    `SELECT orders.id, orders.reference, orders.id_user, orders.id_company, orders.type,
            orders.status, orders.id_payment_method, orders.id_delivery_type, orders.notes,
            orders.total, orders.created_at, orders.updated_at,
            latest_payment.id AS payment_id,
            latest_payment.method_type AS payment_method_type,
            latest_payment.status AS payment_status
     FROM orders
     LEFT JOIN LATERAL (
       SELECT order_payment.id, payment_detail.method_type, order_payment.status
       FROM order_payment
       INNER JOIN payment_detail ON payment_detail.id_order_payment = order_payment.id
       WHERE order_payment.id_order = orders.id
       ORDER BY order_payment.created_at DESC, order_payment.id DESC
       LIMIT 1
     ) AS latest_payment ON true
     WHERE orders.id = $1`,
    [id]
  );
  const row = orderResult.rows[0];
  if (!row) {
    return null;
  }

  const [addressResult, itemsResult, historyResult] = await Promise.all([
    query<OrderAddressRow>(
      `SELECT province, municipality, neighborhood, address, reference, latitude, longitude
       FROM order_address WHERE id_order = $1`,
      [id]
    ),
    query<OrderItemRow>(
      `SELECT order_item.id, order_item.id_product, product.name AS product_name,
              order_item.quantity, order_item.unit_price, order_item.subtotal
       FROM order_item
       INNER JOIN product ON product.id = order_item.id_product
       WHERE order_item.id_order = $1
       ORDER BY order_item.id`,
      [id]
    ),
    query<OrderHistoryRow>(
      `SELECT id, previous_status, new_status, changed_by, note, created_at
       FROM order_history WHERE id_order = $1 ORDER BY created_at ASC, id ASC`,
      [id]
    ),
  ]);
  const addressRow = addressResult.rows[0];
  if (!addressRow) {
    throw new Error(`A encomenda ${id} não tem o snapshot de endereço esperado.`);
  }
  const items = itemsResult.rows.map(toOrderItem);
  const itemsSubtotalCents = items.reduce((sum, item) => sum + Math.round(item.subtotal * 100), 0);

  return {
    id: row.id,
    reference: row.reference,
    type: row.type,
    status: row.status,
    total: Number(row.total),
    userId: row.id_user,
    companyId: row.id_company,
    paymentMethodId: row.id_payment_method,
    deliveryTypeId: row.id_delivery_type,
    // O preço de entrega fica congelado na diferença entre o total e os subtotais gravados.
    deliveryPrice: Math.round(Number(row.total) * 100 - itemsSubtotalCents) / 100,
    notes: row.notes,
    address: toOrderAddress(addressRow),
    items,
    history: historyResult.rows.map(toOrderHistoryEntry),
    payment:
      row.payment_id !== null && row.payment_method_type !== null && row.payment_status !== null
        ? {
            id: row.payment_id,
            methodType: row.payment_method_type,
            status: row.payment_status,
          }
        : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function cancel(
  userId: string,
  id: string
): Promise<'not_found' | 'conflict' | 'payment_confirmed' | 'cancelled'> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query<{ status: OrderStatus }>(
      'SELECT status FROM orders WHERE id = $1 AND id_user = $2 FOR UPDATE',
      [id, userId]
    );
    const status = result.rows[0]?.status;
    if (!status) {
      await client.query('ROLLBACK');
      return 'not_found';
    }
    if (status !== 'processing') {
      await client.query('ROLLBACK');
      return 'conflict';
    }

    const payments = await client.query<{ status: OrderPaymentStatus }>(
      'SELECT status FROM order_payment WHERE id_order = $1 FOR UPDATE',
      [id]
    );
    if (payments.rows.some((payment) => payment.status === 'confirmed')) {
      await client.query('ROLLBACK');
      return 'payment_confirmed';
    }
    if (payments.rows.some((payment) => payment.status === 'pending')) {
      await client.query(
        `UPDATE order_payment SET status = 'failed',
           notes = COALESCE(notes, 'Pagamento cancelado com a encomenda.')
         WHERE id_order = $1 AND status = 'pending'`,
        [id]
      );
      await client.query(
        `UPDATE multicaixa_reference SET status = 'cancelled'
         WHERE id_order = $1 AND status = 'pending'`,
        [id]
      );
    }

    await client.query(`UPDATE orders SET status = 'cancelled' WHERE id = $1`, [id]);
    await client.query(
      `INSERT INTO order_history (id_order, previous_status, new_status, changed_by, note)
       VALUES ($1, 'processing', 'cancelled', $2, 'Cancelada pelo cliente.')`,
      [id, userId]
    );
    await client.query('COMMIT');
    return 'cancelled';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function adminUpdateStatus(
  adminId: string,
  id: string,
  status: Exclude<OrderStatus, 'processing'>,
  note: string | null
): Promise<
  | { outcome: 'not_found' }
  | { outcome: 'conflict'; previousStatus: OrderStatus }
  | { outcome: 'updated' }
> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query<{ status: OrderStatus }>(
      'SELECT status FROM orders WHERE id = $1 FOR UPDATE',
      [id]
    );
    const previousStatus = result.rows[0]?.status;
    if (!previousStatus) {
      await client.query('ROLLBACK');
      return { outcome: 'not_found' };
    }

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      processing: ['in_transit', 'cancelled'],
      in_transit: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    };
    if (!allowedTransitions[previousStatus].includes(status)) {
      await client.query('ROLLBACK');
      return { outcome: 'conflict', previousStatus };
    }

    await client.query('UPDATE orders SET status = $2 WHERE id = $1', [id, status]);
    await client.query(
      `INSERT INTO order_history (id_order, previous_status, new_status, changed_by, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, previousStatus, status, adminId, note]
    );
    await client.query('COMMIT');
    return { outcome: 'updated' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export const orderRepository = {
  createFromCart,
  findAllByUser,
  findOwnedById: findById,
  adminFindAll,
  adminFindById: findById,
  cancel,
  adminUpdateStatus,
};

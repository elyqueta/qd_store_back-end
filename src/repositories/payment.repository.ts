import { getClient, query } from '../database/pool';
import { ConflictError } from '../errors';
import {
  OrderPaymentStatus,
  Payment,
  PaymentDetailsRow,
  PaymentSummary,
} from '../types/payment.types';
import { PaymentMethodType } from '../types/paymentMethod.types';
import { GatewayPaymentResult } from '../services/payment/paymentGateway';

interface PaymentQueryRow extends PaymentDetailsRow {
  id: string;
  id_order: string;
  status: OrderPaymentStatus;
  transaction_reference: string | null;
  amount: string;
  amount_paid: string | null;
  paid_at: Date | null;
  notes: string | null;
  created_at: Date;
}

function toPayment(row: PaymentQueryRow): Payment {
  let details: Payment['details'];
  if (row.method_type === 'multicaixa_express') {
    details = {
      methodType: row.method_type,
      customerPhone: row.customer_phone,
      apiTransactionId: row.api_transaction_id,
    };
  } else if (row.method_type === 'multicaixa_reference') {
    if (
      row.entity === null ||
      row.reference === null ||
      row.expires_at === null ||
      row.reference_status === null
    ) {
      throw new Error(`Detalhes de referência em falta para o pagamento ${row.id}.`);
    }
    details = {
      methodType: row.method_type,
      entity: row.entity,
      reference: row.reference,
      expiresAt: row.expires_at,
      referenceStatus: row.reference_status,
    };
  } else {
    if (
      row.destination_iban === null ||
      row.destination_bank === null ||
      row.destination_holder === null
    ) {
      throw new Error(`Detalhes de transferência em falta para o pagamento ${row.id}.`);
    }
    details = {
      methodType: row.method_type,
      destinationIban: row.destination_iban,
      destinationBank: row.destination_bank,
      destinationHolder: row.destination_holder,
      confirmedBy: row.confirmed_by,
    };
  }

  return {
    id: row.id,
    orderId: row.id_order,
    methodType: row.method_type,
    status: row.status,
    amount: Number(row.amount),
    amountPaid: row.amount_paid !== null ? Number(row.amount_paid) : null,
    paidAt: row.paid_at,
    transactionReference: row.transaction_reference,
    notes: row.notes,
    createdAt: row.created_at,
    details,
  };
}

const PAYMENT_SELECT = `SELECT order_payment.id, order_payment.id_order, order_payment.status,
  order_payment.transaction_reference, order_payment.amount, order_payment.amount_paid,
  order_payment.paid_at, order_payment.notes, order_payment.created_at,
  payment_detail.method_type, payment_detail.customer_phone, payment_detail.api_transaction_id,
  multicaixa_reference.entity, multicaixa_reference.reference, multicaixa_reference.expires_at,
  multicaixa_reference.status AS reference_status, payment_detail.destination_iban,
  payment_detail.destination_bank, payment_detail.destination_holder, payment_detail.confirmed_by
  FROM order_payment
  INNER JOIN payment_detail ON payment_detail.id_order_payment = order_payment.id
  LEFT JOIN multicaixa_reference
    ON multicaixa_reference.id = payment_detail.id_multicaixa_reference`;

async function createPayment(
  orderId: string,
  paymentMethodId: string,
  amount: number,
  methodType: PaymentMethodType,
  customerPhone: string | null,
  gatewayResult: GatewayPaymentResult
): Promise<string> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const orderResult = await client.query<{ status: string }>(
      'SELECT status FROM orders WHERE id = $1 FOR UPDATE',
      [orderId]
    );
    const order = orderResult.rows[0];
    if (!order) {
      throw new ConflictError('A encomenda deixou de estar disponível para pagamento.');
    }
    if (order.status !== 'processing') {
      throw new ConflictError('A encomenda não está em processamento.');
    }

    const existing = await client.query<{ status: OrderPaymentStatus }>(
      `SELECT status FROM order_payment
       WHERE id_order = $1 AND status IN ('pending', 'confirmed')
       LIMIT 1`,
      [orderId]
    );
    if (existing.rowCount) {
      throw new ConflictError('Já existe um pagamento pendente ou confirmado para esta encomenda.');
    }

    const status = gatewayResult.status;
    const transactionReference =
      gatewayResult.methodType === 'multicaixa_express' && status === 'confirmed'
        ? gatewayResult.apiTransactionId
        : null;
    const failureNotes =
      gatewayResult.methodType === 'multicaixa_express' && status === 'failed'
        ? (gatewayResult.failureReason ?? 'Pagamento recusado.')
        : null;
    const paymentResult = await client.query<{ id: string }>(
      `INSERT INTO order_payment
         (id_order, id_payment_method, status, transaction_reference, amount,
          amount_paid, paid_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $3 = 'confirmed' THEN NOW() ELSE NULL END, $7)
       RETURNING id`,
      [
        orderId,
        paymentMethodId,
        status,
        transactionReference,
        amount,
        status === 'confirmed' ? amount : null,
        failureNotes,
      ]
    );
    const paymentId = paymentResult.rows[0]?.id;
    if (!paymentId) {
      throw new Error('A base de dados não devolveu o id do pagamento criado.');
    }

    let referenceId: string | null = null;
    if (gatewayResult.methodType === 'multicaixa_reference') {
      const referenceResult = await client.query<{ id: string }>(
        `INSERT INTO multicaixa_reference (id_order, entity, reference, amount, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [orderId, gatewayResult.entity, gatewayResult.reference, amount, gatewayResult.expiresAt]
      );
      referenceId = referenceResult.rows[0]?.id ?? null;
      if (!referenceId) {
        throw new Error('A base de dados não devolveu o id da referência gerada.');
      }
    }

    await client.query(
      `INSERT INTO payment_detail
         (id_order_payment, method_type, customer_phone, api_transaction_id,
          id_multicaixa_reference, destination_iban, destination_bank, destination_holder)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        paymentId,
        methodType,
        customerPhone,
        gatewayResult.methodType === 'multicaixa_express' ? gatewayResult.apiTransactionId : null,
        referenceId,
        gatewayResult.methodType === 'bank_transfer' ? gatewayResult.destinationIban : null,
        gatewayResult.methodType === 'bank_transfer' ? gatewayResult.destinationBank : null,
        gatewayResult.methodType === 'bank_transfer' ? gatewayResult.destinationHolder : null,
      ]
    );
    await client.query(
      `INSERT INTO order_history (id_order, previous_status, new_status, note)
       VALUES ($1, $2, $2, $3)`,
      [
        orderId,
        order.status,
        status === 'confirmed'
          ? 'Pagamento confirmado (simulado).'
          : status === 'failed'
            ? 'Pagamento falhou (simulado).'
            : 'Pagamento iniciado (simulado).',
      ]
    );
    await client.query('COMMIT');
    return paymentId;
  } catch (error) {
    await client.query('ROLLBACK');
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      throw new ConflictError('Já foi gerada uma referência para esta encomenda.');
    }
    throw error;
  } finally {
    client.release();
  }
}

async function findById(id: string): Promise<Payment | null> {
  const result = await query<PaymentQueryRow>(`${PAYMENT_SELECT} WHERE order_payment.id = $1`, [
    id,
  ]);
  const row = result.rows[0];
  return row ? toPayment(row) : null;
}

async function findAllByOrder(orderId: string): Promise<Payment[]> {
  const result = await query<PaymentQueryRow>(
    `${PAYMENT_SELECT}
     WHERE order_payment.id_order = $1
     ORDER BY order_payment.created_at DESC, order_payment.id DESC`,
    [orderId]
  );
  return result.rows.map(toPayment);
}

async function findLatestSummary(orderId: string): Promise<PaymentSummary | null> {
  const result = await query<{
    id: string;
    method_type: PaymentMethodType;
    status: OrderPaymentStatus;
  }>(
    `SELECT order_payment.id, payment_detail.method_type, order_payment.status
     FROM order_payment
     INNER JOIN payment_detail ON payment_detail.id_order_payment = order_payment.id
     WHERE order_payment.id_order = $1
     ORDER BY order_payment.created_at DESC, order_payment.id DESC
     LIMIT 1`,
    [orderId]
  );
  const row = result.rows[0];
  return row ? { id: row.id, methodType: row.method_type, status: row.status } : null;
}

async function confirm(
  adminId: string,
  paymentId: string,
  notes: string | null
): Promise<'not_found' | 'conflict' | 'updated'> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query<{
      id_order: string;
      status: OrderPaymentStatus;
      amount: string;
      order_status: string;
      method_type: PaymentMethodType;
      id_multicaixa_reference: string | null;
    }>(
      `SELECT order_payment.id_order, order_payment.status, order_payment.amount,
              orders.status AS order_status, payment_detail.method_type,
              payment_detail.id_multicaixa_reference
       FROM order_payment
       INNER JOIN orders ON orders.id = order_payment.id_order
       INNER JOIN payment_detail ON payment_detail.id_order_payment = order_payment.id
       WHERE order_payment.id = $1
       FOR UPDATE OF order_payment`,
      [paymentId]
    );
    const payment = result.rows[0];
    if (!payment) {
      await client.query('ROLLBACK');
      return 'not_found';
    }
    if (
      payment.status !== 'pending' ||
      payment.method_type === 'multicaixa_express' ||
      (payment.method_type === 'multicaixa_reference' && !payment.id_multicaixa_reference)
    ) {
      await client.query('ROLLBACK');
      return 'conflict';
    }

    await client.query(
      `UPDATE order_payment
       SET status = 'confirmed', amount_paid = amount, paid_at = NOW(),
           notes = COALESCE($2, notes)
       WHERE id = $1`,
      [paymentId, notes]
    );
    if (payment.method_type === 'bank_transfer') {
      await client.query(
        'UPDATE payment_detail SET confirmed_by = $2 WHERE id_order_payment = $1',
        [paymentId, adminId]
      );
    } else {
      await client.query(
        `UPDATE multicaixa_reference SET status = 'paid', paid_at = NOW()
         WHERE id = $1`,
        [payment.id_multicaixa_reference]
      );
    }
    await client.query(
      `INSERT INTO order_history (id_order, previous_status, new_status, changed_by, note)
       VALUES ($1, $2, $2, $3, $4)`,
      [
        payment.id_order,
        payment.order_status,
        adminId,
        notes ?? 'Pagamento confirmado pelo administrador.',
      ]
    );
    await client.query('COMMIT');
    return 'updated';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function reject(
  adminId: string,
  paymentId: string,
  notes: string | null
): Promise<'not_found' | 'conflict' | 'updated'> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query<{
      id_order: string;
      status: OrderPaymentStatus;
      order_status: string;
      id_multicaixa_reference: string | null;
    }>(
      `SELECT order_payment.id_order, order_payment.status, orders.status AS order_status,
              payment_detail.id_multicaixa_reference
       FROM order_payment
       INNER JOIN orders ON orders.id = order_payment.id_order
       INNER JOIN payment_detail ON payment_detail.id_order_payment = order_payment.id
       WHERE order_payment.id = $1
       FOR UPDATE OF order_payment`,
      [paymentId]
    );
    const payment = result.rows[0];
    if (!payment) {
      await client.query('ROLLBACK');
      return 'not_found';
    }
    if (payment.status !== 'pending') {
      await client.query('ROLLBACK');
      return 'conflict';
    }

    await client.query(
      `UPDATE order_payment
       SET status = 'failed', notes = COALESCE($2, 'Pagamento rejeitado pelo administrador.')
       WHERE id = $1`,
      [paymentId, notes]
    );
    if (payment.id_multicaixa_reference) {
      await client.query(
        `UPDATE multicaixa_reference SET status = 'cancelled'
         WHERE id = $1 AND status = 'pending'`,
        [payment.id_multicaixa_reference]
      );
    }
    await client.query(
      `INSERT INTO order_history (id_order, previous_status, new_status, changed_by, note)
       VALUES ($1, $2, $2, $3, $4)`,
      [
        payment.id_order,
        payment.order_status,
        adminId,
        notes ?? 'Pagamento rejeitado pelo administrador.',
      ]
    );
    await client.query('COMMIT');
    return 'updated';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export const paymentRepository = {
  createPayment,
  findById,
  findAllByOrder,
  findLatestSummary,
  confirm,
  reject,
};

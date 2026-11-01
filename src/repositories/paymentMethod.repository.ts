import { query } from '../database/pool';
import {
  CreatePaymentMethodData,
  PaymentMethod,
  PaymentMethodRow,
} from '../types/paymentMethod.types';
import { UpdatePaymentMethodInput } from '../validators/paymentMethod.validator';

function toPaymentMethod(row: PaymentMethodRow): PaymentMethod {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create(data: CreatePaymentMethodData): Promise<PaymentMethod> {
  const result = await query<PaymentMethodRow>(
    `INSERT INTO payment_method (name, type)
     VALUES ($1, $2)
     RETURNING id, name, type, is_active, created_at, updated_at`,
    [data.name, data.type]
  );

  return toPaymentMethod(result.rows[0] as PaymentMethodRow);
}

async function findAll(): Promise<PaymentMethod[]> {
  const result = await query<PaymentMethodRow>(
    `SELECT id, name, type, is_active, created_at, updated_at
     FROM payment_method
     ORDER BY name ASC`
  );

  return result.rows.map(toPaymentMethod);
}

async function findById(id: string): Promise<PaymentMethod | null> {
  const result = await query<PaymentMethodRow>(
    `SELECT id, name, type, is_active, created_at, updated_at
     FROM payment_method
     WHERE id = $1`,
    [id]
  );

  const row = result.rows[0];
  return row ? toPaymentMethod(row) : null;
}

async function update(id: string, data: UpdatePaymentMethodInput): Promise<PaymentMethod | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex}`);
    values.push(data.name);
    paramIndex += 1;
  }

  if (data.type !== undefined) {
    fields.push(`type = $${paramIndex}`);
    values.push(data.type);
    paramIndex += 1;
  }

  if (fields.length === 0) {
    return findById(id);
  }

  values.push(id);

  const result = await query<PaymentMethodRow>(
    `UPDATE payment_method
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, name, type, is_active, created_at, updated_at`,
    values
  );

  const row = result.rows[0];
  return row ? toPaymentMethod(row) : null;
}

async function deactivate(id: string): Promise<boolean> {
  const result = await query(
    `UPDATE payment_method
     SET is_active = false
     WHERE id = $1 AND is_active = true`,
    [id]
  );

  return (result.rowCount ?? 0) > 0;
}

export const paymentMethodRepository = {
  create,
  findAll,
  findById,
  update,
  deactivate,
};

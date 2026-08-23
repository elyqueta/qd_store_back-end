import { query } from '../database/pool';
import { DeliveryType, DeliveryTypeRow, CreateDeliveryTypeData } from '../types/deliveryType.types';
import { UpdateDeliveryTypeInput } from '../validators/deliveryType.validator';

function toDeliveryType(row: DeliveryTypeRow): DeliveryType {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    type: row.type,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create(data: CreateDeliveryTypeData): Promise<DeliveryType> {
  const result = await query<DeliveryTypeRow>(
    `INSERT INTO delivery_type (name, description, price, type)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, description, price, type, is_active, created_at, updated_at`,
    [data.name, data.description ?? null, data.price, data.type]
  );

  return toDeliveryType(result.rows[0] as DeliveryTypeRow);
}

async function findAll(): Promise<DeliveryType[]> {
  const result = await query<DeliveryTypeRow>(
    `SELECT id, name, description, price, type, is_active, created_at, updated_at
     FROM delivery_type
     ORDER BY name ASC`
  );

  return result.rows.map(toDeliveryType);
}

async function findById(id: string): Promise<DeliveryType | null> {
  const result = await query<DeliveryTypeRow>(
    `SELECT id, name, description, price, type, is_active, created_at, updated_at
     FROM delivery_type
     WHERE id = $1`,
    [id]
  );

  const row = result.rows[0];
  return row ? toDeliveryType(row) : null;
}

async function update(id: string, data: UpdateDeliveryTypeInput): Promise<DeliveryType | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex}`);
    values.push(data.name);
    paramIndex += 1;
  }

  if ('description' in data) {
    fields.push(`description = $${paramIndex}`);
    values.push(data.description);
    paramIndex += 1;
  }

  if (data.price !== undefined) {
    fields.push(`price = $${paramIndex}`);
    values.push(data.price);
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

  const result = await query<DeliveryTypeRow>(
    `UPDATE delivery_type
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, name, description, price, type, is_active, created_at, updated_at`,
    values
  );

  const row = result.rows[0];
  return row ? toDeliveryType(row) : null;
}

async function deactivate(id: string): Promise<boolean> {
  const result = await query(
    `UPDATE delivery_type
     SET is_active = false
     WHERE id = $1 AND is_active = true`,
    [id]
  );

  return (result.rowCount ?? 0) > 0;
}

export const deliveryTypeRepository = {
  create,
  findAll,
  findById,
  update,
  deactivate,
};

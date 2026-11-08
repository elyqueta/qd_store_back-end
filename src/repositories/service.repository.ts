import { query } from '../database/pool';
import { ConflictError } from '../errors';
import { Service, ServiceRow } from '../types/service.types';
import { CreateServiceInput, UpdateServiceInput } from '../validators/service.validator';

function isPgError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function toService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    imageUrl: row.image_url,
    startsFromPrice: row.starts_from_price === null ? null : Number(row.starts_from_price),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const columns = `id, name, description, icon, image_url, starts_from_price,
  is_active, created_at, updated_at`;

async function findAll(includeInactive = false): Promise<Service[]> {
  const result = await query<ServiceRow>(
    `SELECT ${columns} FROM service
     ${includeInactive ? '' : 'WHERE is_active = true'}
     ORDER BY created_at DESC`
  );
  return result.rows.map(toService);
}

async function findById(id: string): Promise<Service | null> {
  const result = await query<ServiceRow>(`SELECT ${columns} FROM service WHERE id = $1`, [id]);
  return result.rows[0] ? toService(result.rows[0]) : null;
}

async function create(
  input: CreateServiceInput & { imageUrl?: string | null; imagePublicId?: string | null }
): Promise<Service> {
  try {
    const result = await query<{ id: string }>(
      `INSERT INTO service
       (name, description, icon, image_url, image_cloudinary_public_id, starts_from_price, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        input.name,
        input.description ?? null,
        input.icon,
        input.imageUrl ?? null,
        input.imagePublicId ?? null,
        input.startsFromPrice ?? null,
        input.isActive,
      ]
    );
    return (await findById(result.rows[0]!.id))!;
  } catch (error) {
    if (isPgError(error) && error.code === '23503') {
      throw new ConflictError('Não foi possível criar o serviço.');
    }
    throw error;
  }
}

async function update(
  id: string,
  input: UpdateServiceInput & { imageUrl?: string | null; imagePublicId?: string | null }
): Promise<Service | null> {
  const fields: string[] = [];
  const params: unknown[] = [];
  const values: Array<[string, unknown]> = [
    ['name', input.name],
    ['description', input.description],
    ['icon', input.icon],
    ['starts_from_price', input.startsFromPrice],
    ['is_active', input.isActive],
    ['image_url', input.imageUrl],
    ['image_cloudinary_public_id', input.imagePublicId],
  ];
  for (const [field, value] of values) {
    if (value !== undefined) {
      params.push(value);
      fields.push(`${field} = $${params.length}`);
    }
  }
  if (!fields.length) return findById(id);
  params.push(id);
  try {
    const result = await query(
      `UPDATE service SET ${fields.join(', ')} WHERE id = $${params.length}`,
      params
    );
    return result.rowCount ? findById(id) : null;
  } catch (error) {
    if (isPgError(error) && error.code === '23503') {
      throw new ConflictError('Não foi possível actualizar o serviço.');
    }
    throw error;
  }
}

export const serviceRepository = { findAll, findById, create, update };

import { getClient, query } from '../database/pool';
import { ConflictError } from '../errors';
import { Highlight, HighlightRow } from '../types/highlight.types';
import { CreateHighlightInput, ReorderHighlightsInput, UpdateHighlightInput } from '../validators/highlight.validator';

function isPgError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

const columns = `h.id, h.placement, h.title, h.subtitle, h.label, h.cta_label, h.cta_url,
  CASE WHEN h.id_product IS NOT NULL THEN
    (SELECT pi.url FROM product_image pi WHERE pi.id_product = p.id ORDER BY pi.display_order, pi.id LIMIT 1)
  ELSE h.image_url END AS image_url,
  h.theme, h.display_order, h.is_active, h.starts_at, h.ends_at,
  h.created_at, h.updated_at,
  CASE WHEN p.id IS NULL THEN NULL ELSE json_build_object(
    'id', p.id, 'name', p.name, 'price', p.price,
    'mainImageUrl', (SELECT pi.url FROM product_image pi WHERE pi.id_product = p.id ORDER BY pi.display_order, pi.id LIMIT 1)
  ) END AS product,
  CASE WHEN c.id IS NULL THEN NULL ELSE json_build_object(
    'id', c.id, 'label', c.label, 'icon', c.icon
  ) END AS category`;
const joins = `FROM highlight h
  LEFT JOIN product p ON p.id = h.id_product
  LEFT JOIN category c ON c.id = h.id_category`;

function toHighlight(row: HighlightRow): Highlight {
  return {
    id: row.id,
    placement: row.placement,
    title: row.title,
    subtitle: row.subtitle,
    label: row.label,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    imageUrl: row.image_url,
    theme: row.theme,
    product: row.product ? { ...row.product, price: Number(row.product.price) } : null,
    category: row.category,
    displayOrder: row.display_order,
    isActive: row.is_active,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findAll(placement?: string, publicOnly = false): Promise<Highlight[]> {
  const conditions = publicOnly
    ? [`h.is_active = true`, `(h.starts_at IS NULL OR h.starts_at <= NOW())`, `(h.ends_at IS NULL OR h.ends_at > NOW())`]
    : [];
  const params = placement ? [placement] : [];
  if (placement) conditions.push(`h.placement = $${params.length}`);
  const result = await query<HighlightRow>(
    `SELECT ${columns} ${joins}${conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''}
     ORDER BY h.display_order ASC, h.created_at ASC`,
    params
  );
  return result.rows.map(toHighlight);
}

async function findById(id: string): Promise<Highlight | null> {
  const result = await query<HighlightRow>(`SELECT ${columns} ${joins} WHERE h.id = $1`, [id]);
  return result.rows[0] ? toHighlight(result.rows[0]) : null;
}

async function create(input: CreateHighlightInput & { imageUrl?: string | null; imagePublicId?: string | null }): Promise<Highlight> {
  try {
    const result = await query<{ id: string }>(
      `INSERT INTO highlight
       (placement, title, subtitle, label, cta_label, cta_url, image_url, image_cloudinary_public_id,
        id_product, id_category, display_order, is_active, starts_at, ends_at, theme)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
      [
        input.placement,
        input.title,
        input.subtitle ?? null,
        input.label ?? null,
        input.ctaLabel ?? null,
        input.ctaUrl ?? null,
        input.imageUrl ?? null,
        input.imagePublicId ?? null,
        input.productId ?? null,
        input.categoryId ?? null,
        input.displayOrder,
        input.isActive,
        input.startsAt ?? null,
        input.endsAt ?? null,
        input.theme,
      ]
    );
    return (await findById(result.rows[0]!.id))!;
  } catch (error) {
    if (isPgError(error) && error.code === '23503') throw new ConflictError('Produto ou categoria associado não existe.');
    throw error;
  }
}

async function update(id: string, input: UpdateHighlightInput & { imageUrl?: string | null; imagePublicId?: string | null }): Promise<Highlight | null> {
  const fields: string[] = [];
  const params: unknown[] = [];
  const map: Array<[string, unknown]> = [
    ['placement', input.placement], ['title', input.title], ['subtitle', input.subtitle],
    ['label', input.label], ['cta_label', input.ctaLabel], ['cta_url', input.ctaUrl],
    ['id_product', input.productId], ['id_category', input.categoryId],
    ['display_order', input.displayOrder], ['is_active', input.isActive],
    ['starts_at', input.startsAt], ['ends_at', input.endsAt], ['theme', input.theme],
    ['image_url', input.imageUrl], ['image_cloudinary_public_id', input.imagePublicId],
  ];
  for (const [field, value] of map) if (value !== undefined) { params.push(value); fields.push(`${field} = $${params.length}`); }
  if (!fields.length) return findById(id);
  params.push(id);
  try {
    const result = await query(`UPDATE highlight SET ${fields.join(', ')} WHERE id = $${params.length}`, params);
    return result.rowCount ? findById(id) : null;
  } catch (error) {
    if (isPgError(error) && error.code === '23503') throw new ConflictError('Produto ou categoria associado não existe.');
    throw error;
  }
}

async function remove(id: string): Promise<boolean> {
  const result = await query('UPDATE highlight SET is_active = false WHERE id = $1', [id]);
  return Boolean(result.rowCount);
}

async function permanentlyRemove(id: string): Promise<boolean> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query<{
      image_cloudinary_public_id: string | null;
      id_product: string | null;
    }>(
      `DELETE FROM highlight
       WHERE id = $1
       RETURNING image_cloudinary_public_id, id_product`,
      [id]
    );
    const highlight = result.rows[0];
    if (!highlight) {
      await client.query('ROLLBACK');
      return false;
    }

    const imagePublicId = highlight.id_product === null
      ? highlight.image_cloudinary_public_id
      : null;
    if (imagePublicId) {
      await client.query(
        `INSERT INTO cloudinary_asset_deletion (public_id)
         VALUES ($1)
         ON CONFLICT (public_id) DO NOTHING`,
        [imagePublicId]
      );
    }
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function reorder(input: ReorderHighlightsInput): Promise<void> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    for (const item of input.items) {
      await client.query('UPDATE highlight SET display_order = $1 WHERE id = $2', [item.displayOrder, item.id]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export const highlightRepository = { findAll, findById, create, update, remove, permanentlyRemove, reorder };

import { getClient, query } from '../database/pool';
import { CreateProductImageData, ProductImage, ProductImageRow } from '../types/productImage.types';
import { UpdateProductImageInput } from '../validators/productImage.validator';

interface UpdateProductImageData extends UpdateProductImageInput {
  cloudinaryPublicId?: string | null;
  previousCloudinaryPublicId?: string | null;
}

export interface ProductImageStorage {
  url: string;
  cloudinaryPublicId: string | null;
}

function toProductImage(row: ProductImageRow): ProductImage {
  return {
    id: row.id,
    productId: row.id_product,
    url: row.url,
    displayOrder: row.display_order,
    width: row.width,
    height: row.height,
    format: row.format,
    sizeBytes: row.size_bytes,
  };
}

const RETURNING_COLUMNS = `id, id_product, url, display_order, width, height, format, size_bytes,
  cloudinary_public_id`;

/**
 * `data.displayOrder ?? 0` aqui replica explicitamente o DEFAULT 0
 * já definido na coluna — não é redundante: o valor explícito no
 * INSERT garante que o tipo de domínio (`ProductImage.displayOrder:
 * number`, nunca `undefined`) é sempre coerente, sem depender de uma
 * segunda leitura para descobrir o que o banco decidiu sozinho.
 */
async function create(data: CreateProductImageData): Promise<ProductImage> {
  const result = await query<ProductImageRow>(
    `INSERT INTO product_image
       (id_product, url, display_order, width, height, format, size_bytes, cloudinary_public_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${RETURNING_COLUMNS}`,
    [
      data.productId,
      data.url,
      data.displayOrder ?? 0,
      data.width ?? null,
      data.height ?? null,
      data.format ?? null,
      data.sizeBytes ?? null,
      data.cloudinaryPublicId ?? null,
    ]
  );

  return toProductImage(result.rows[0] as ProductImageRow);
}

async function findAllByProduct(productId: string): Promise<ProductImage[]> {
  const result = await query<ProductImageRow>(
    `SELECT ${RETURNING_COLUMNS}
     FROM product_image
     WHERE id_product = $1
     ORDER BY display_order ASC`,
    [productId]
  );

  return result.rows.map(toProductImage);
}

async function findById(id: string): Promise<ProductImage | null> {
  const result = await query<ProductImageRow>(
    `SELECT ${RETURNING_COLUMNS} FROM product_image WHERE id = $1`,
    [id]
  );

  const row = result.rows[0];
  return row ? toProductImage(row) : null;
}

async function findStorageById(id: string): Promise<ProductImageStorage | null> {
  const result = await query<Pick<ProductImageRow, 'url' | 'cloudinary_public_id'>>(
    `SELECT url, cloudinary_public_id FROM product_image WHERE id = $1`,
    [id]
  );
  const row = result.rows[0];
  return row ? { url: row.url, cloudinaryPublicId: row.cloudinary_public_id } : null;
}

async function findAllForCleanup(productId: string): Promise<ProductImageStorage[]> {
  const result = await query<Pick<ProductImageRow, 'url' | 'cloudinary_public_id'>>(
    `SELECT url, cloudinary_public_id FROM product_image WHERE id_product = $1`,
    [productId]
  );
  return result.rows.map((row) => ({
    url: row.url,
    cloudinaryPublicId: row.cloudinary_public_id,
  }));
}

async function update(id: string, data: UpdateProductImageData): Promise<ProductImage | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const existingResult = await client.query<
      Pick<ProductImageRow, 'url' | 'cloudinary_public_id'>
    >(`SELECT url, cloudinary_public_id FROM product_image WHERE id = $1 FOR UPDATE`, [id]);
    const existing = existingResult.rows[0];
    if (!existing) {
      await client.query('COMMIT');
      return null;
    }

    const assetChanged = data.cloudinaryPublicId !== undefined;
    const oldPublicId = existing.cloudinary_public_id ?? data.previousCloudinaryPublicId ?? null;
    const nextPublicId =
      data.cloudinaryPublicId !== undefined
        ? data.cloudinaryPublicId
        : existing.cloudinary_public_id;

    if (assetChanged && oldPublicId && oldPublicId !== nextPublicId) {
      await client.query(
        `INSERT INTO cloudinary_asset_deletion (public_id)
         VALUES ($1)
         ON CONFLICT (public_id) DO NOTHING`,
        [oldPublicId]
      );
    }

    if (data.displayOrder !== undefined) {
      fields.push(`display_order = $${paramIndex}`);
      values.push(data.displayOrder);
      paramIndex += 1;
    }
    if ('width' in data) {
      fields.push(`width = $${paramIndex}`);
      values.push(data.width);
      paramIndex += 1;
    }
    if ('height' in data) {
      fields.push(`height = $${paramIndex}`);
      values.push(data.height);
      paramIndex += 1;
    }
    if ('format' in data) {
      fields.push(`format = $${paramIndex}`);
      values.push(data.format);
      paramIndex += 1;
    }
    if ('sizeBytes' in data) {
      fields.push(`size_bytes = $${paramIndex}`);
      values.push(data.sizeBytes);
      paramIndex += 1;
    }
    if (assetChanged) {
      fields.push(`cloudinary_public_id = $${paramIndex}`);
      values.push(nextPublicId);
      paramIndex += 1;
    }

    if (fields.length === 0) {
      await client.query('COMMIT');
      return findById(id);
    }

    values.push(id);

    const result = await client.query<ProductImageRow>(
      `UPDATE product_image
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING ${RETURNING_COLUMNS}`,
      values
    );

    await client.query('COMMIT');
    const row = result.rows[0];
    return row ? toProductImage(row) : null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function remove(id: string, legacyPublicId?: string | null): Promise<boolean> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query<Pick<ProductImageRow, 'cloudinary_public_id'>>(
      `SELECT cloudinary_public_id FROM product_image WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (!result.rows[0]) {
      await client.query('COMMIT');
      return false;
    }

    const publicId = result.rows[0]?.cloudinary_public_id ?? legacyPublicId;
    if (publicId) {
      await client.query(
        `INSERT INTO cloudinary_asset_deletion (public_id)
         VALUES ($1)
         ON CONFLICT (public_id) DO NOTHING`,
        [publicId]
      );
    }

    const deleted = await client.query('DELETE FROM product_image WHERE id = $1', [id]);
    await client.query('COMMIT');
    return (deleted.rowCount ?? 0) > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export const productImageRepository = {
  create,
  findAllByProduct,
  findById,
  findStorageById,
  findAllForCleanup,
  update,
  remove,
};

import { query } from '../database/pool';
import { CreateProductImageData, ProductImage, ProductImageRow } from '../types/productImage.types';
import { UpdateProductImageInput } from '../validators/productImage.validator';

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

const RETURNING_COLUMNS = `id, id_product, url, display_order, width, height, format, size_bytes`;

/**
 * `data.displayOrder ?? 0` aqui replica explicitamente o DEFAULT 0
 * já definido na coluna — não é redundante: o valor explícito no
 * INSERT garante que o tipo de domínio (`ProductImage.displayOrder:
 * number`, nunca `undefined`) é sempre coerente, sem depender de uma
 * segunda leitura para descobrir o que o banco decidiu sozinho.
 */
async function create(data: CreateProductImageData): Promise<ProductImage> {
  const result = await query<ProductImageRow>(
    `INSERT INTO product_image (id_product, url, display_order, width, height, format, size_bytes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${RETURNING_COLUMNS}`,
    [
      data.productId,
      data.url,
      data.displayOrder ?? 0,
      data.width ?? null,
      data.height ?? null,
      data.format ?? null,
      data.sizeBytes ?? null,
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

async function update(id: string, data: UpdateProductImageInput): Promise<ProductImage | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.url !== undefined) {
    fields.push(`url = $${paramIndex}`);
    values.push(data.url);
    paramIndex += 1;
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

  if (fields.length === 0) {
    return findById(id);
  }

  values.push(id);

  const result = await query<ProductImageRow>(
    `UPDATE product_image
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING ${RETURNING_COLUMNS}`,
    values
  );

  const row = result.rows[0];
  return row ? toProductImage(row) : null;
}

async function remove(id: string): Promise<boolean> {
  const result = await query('DELETE FROM product_image WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export const productImageRepository = {
  create,
  findAllByProduct,
  findById,
  update,
  remove,
};

import { query } from '../database/pool';
import {
  CreateProductSpecificationData,
  ProductSpecification,
  ProductSpecificationRow,
} from '../types/productSpecification.types';
import { UpdateProductSpecificationInput } from '../validators/productSpecification.validator';

function toProductSpecification(row: ProductSpecificationRow): ProductSpecification {
  return {
    id: row.id,
    productId: row.product_id,
    specKey: row.spec_key,
    specValue: row.spec_value,
    displayOrder: row.display_order,
  };
}

const RETURNING_COLUMNS = `id, product_id, spec_key, spec_value, display_order`;

async function create(data: CreateProductSpecificationData): Promise<ProductSpecification> {
  const result = await query<ProductSpecificationRow>(
    `INSERT INTO product_specification (product_id, spec_key, spec_value, display_order)
     VALUES ($1, $2, $3, $4)
     RETURNING ${RETURNING_COLUMNS}`,
    [data.productId, data.specKey, data.specValue, data.displayOrder]
  );

  return toProductSpecification(result.rows[0] as ProductSpecificationRow);
}

async function findAllByProduct(productId: string): Promise<ProductSpecification[]> {
  const result = await query<ProductSpecificationRow>(
    `SELECT ${RETURNING_COLUMNS}
     FROM product_specification
     WHERE product_id = $1
     ORDER BY display_order ASC`,
    [productId]
  );

  return result.rows.map(toProductSpecification);
}

async function findById(id: string): Promise<ProductSpecification | null> {
  const result = await query<ProductSpecificationRow>(
    `SELECT ${RETURNING_COLUMNS} FROM product_specification WHERE id = $1`,
    [id]
  );

  const row = result.rows[0];
  return row ? toProductSpecification(row) : null;
}

async function update(
  id: string,
  data: UpdateProductSpecificationInput
): Promise<ProductSpecification | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.specKey !== undefined) {
    fields.push(`spec_key = $${paramIndex}`);
    values.push(data.specKey);
    paramIndex += 1;
  }
  if (data.specValue !== undefined) {
    fields.push(`spec_value = $${paramIndex}`);
    values.push(data.specValue);
    paramIndex += 1;
  }
  if (data.displayOrder !== undefined) {
    fields.push(`display_order = $${paramIndex}`);
    values.push(data.displayOrder);
    paramIndex += 1;
  }

  if (fields.length === 0) {
    return findById(id);
  }

  values.push(id);

  const result = await query<ProductSpecificationRow>(
    `UPDATE product_specification
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING ${RETURNING_COLUMNS}`,
    values
  );

  const row = result.rows[0];
  return row ? toProductSpecification(row) : null;
}

async function remove(id: string): Promise<boolean> {
  const result = await query('DELETE FROM product_specification WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export const productSpecificationRepository = {
  create,
  findAllByProduct,
  findById,
  update,
  remove,
};

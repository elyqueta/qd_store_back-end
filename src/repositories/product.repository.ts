import { getClient, query } from '../database/pool';
import { CreateProductData, Product, ProductFilters, ProductRow } from '../types/product.types';
import { ProductImage } from '../types/productImage.types';
import { PaginatedResult, PaginationParams } from '../types/pagination.types';
import { UpdateProductInput } from '../validators/product.validator';
import { ConflictError } from '../errors';

const PG_FOREIGN_KEY_VIOLATION = '23503';

function isPgError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

/**
 * Converte a linha crua (snake_case, price/original_price como
 * string) para o formato de domínio. `Number(row.original_price)`
 * só roda quando o valor não é null — mesmo cuidado já aplicado em
 * address.repository.ts para latitude/longitude, porque `Number(null)`
 * daria 0, um valor de preço tecnicamente válido e enganoso.
 */
function toProduct(row: ProductRow): Product {
  let mainImage: ProductImage | null = null;
  if (row.main_image_id !== null) {
    if (row.main_image_url === null || row.main_image_display_order === null) {
      throw new Error(`Imagem principal inválida para o produto "${row.id}".`);
    }

    mainImage = {
      id: row.main_image_id,
      productId: row.id,
      url: row.main_image_url,
      displayOrder: row.main_image_display_order,
      width: row.main_image_width,
      height: row.main_image_height,
      format: row.main_image_format,
      sizeBytes: row.main_image_size_bytes,
    };
  }

  return {
    id: row.id,
    categoryId: row.id_category,
    ...(row.category_name !== undefined ? { categoryName: row.category_name } : {}),
    name: row.name,
    description: row.description,
    price: Number(row.price),
    originalPrice: row.original_price !== null ? Number(row.original_price) : null,
    badge: row.badge,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mainImage,
  };
}

const PRODUCT_COLUMNS = `product.id, product.id_category, product.name, product.description,
  product.price, product.original_price, product.badge, product.status,
  product.created_at, product.updated_at`;
const MAIN_IMAGE_COLUMNS = `main_image.id AS main_image_id, main_image.url AS main_image_url,
  main_image.display_order AS main_image_display_order, main_image.width AS main_image_width,
  main_image.height AS main_image_height, main_image.format AS main_image_format,
  main_image.size_bytes AS main_image_size_bytes`;
const MAIN_IMAGE_JOIN = `LEFT JOIN LATERAL (
  SELECT id, url, display_order, width, height, format, size_bytes
  FROM product_image
  WHERE id_product = product.id
  ORDER BY display_order ASC, id ASC
  LIMIT 1
) AS main_image ON true`;

async function create(data: CreateProductData): Promise<Product> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const result = await client.query<{ id: string }>(
      `INSERT INTO product (id_category, name, description, price, original_price, badge)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        data.categoryId,
        data.name,
        data.description ?? null,
        data.price,
        data.originalPrice ?? null,
        data.badge ?? null,
      ]
    );
    const productId = result.rows[0]?.id;

    if (!productId) {
      throw new Error('Não foi possível obter o produto criado.');
    }

    if (data.mainImage) {
      await client.query(
        `INSERT INTO product_image
           (id_product, url, display_order, width, height, format, size_bytes, cloudinary_public_id)
         VALUES ($1, $2, 0, $3, $4, $5, $6, $7)`,
        [
          productId,
          data.mainImage.url,
          data.mainImage.width ?? null,
          data.mainImage.height ?? null,
          data.mainImage.format ?? null,
          data.mainImage.sizeBytes ?? null,
          data.mainImage.cloudinaryPublicId ?? null,
        ]
      );
    }

    const productResult = await client.query<ProductRow>(
      `SELECT ${PRODUCT_COLUMNS}, ${MAIN_IMAGE_COLUMNS}
       FROM product
       ${MAIN_IMAGE_JOIN}
       WHERE product.id = $1`,
      [productId]
    );
    const productRow = productResult.rows[0];

    if (!productRow) {
      throw new Error(`Não foi possível carregar o produto "${productId}" após a criação.`);
    }

    await client.query('COMMIT');
    return toProduct(productRow);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Monta a cláusula WHERE dinamicamente a partir dos filtros
 * recebidos. Devolve tanto o texto SQL quanto os valores dos
 * parâmetros — usados IDENTICAMENTE nas duas queries de findAll
 * (COUNT e SELECT paginado), garantindo que os dois nunca respondem
 * sobre conjuntos diferentes de linhas.
 */
function buildWhereClause(filters: ProductFilters): { clause: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.categoryId !== undefined) {
    values.push(filters.categoryId);
    conditions.push(`id_category = $${values.length}`);
  }

  if (filters.status !== undefined) {
    values.push(filters.status);
    conditions.push(`product.status = $${values.length}`);
  }

  if (filters.availableOnly) {
    values.push('active');
    conditions.push(`product.status = $${values.length}`);
  }

  if (filters.excludeId !== undefined) {
    values.push(filters.excludeId);
    conditions.push(`product.id <> $${values.length}`);
  }

  if (filters.search !== undefined) {
    values.push(`%${filters.search}%`);
    conditions.push(
      `(product.name ILIKE $${values.length} OR product.description ILIKE $${values.length})`
    );
  }

  if (filters.priceMin !== undefined) {
    values.push(filters.priceMin);
    conditions.push(`product.price >= $${values.length}`);
  }

  if (filters.priceMax !== undefined) {
    values.push(filters.priceMax);
    conditions.push(`product.price <= $${values.length}`);
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, values };
}

/**
 * Lista produtos paginados, com filtros opcionais.
 *
 * Por que DUAS queries (COUNT separado do SELECT), em vez de uma
 * window function (COUNT(*) OVER())?
 *
 * Window functions resolveriam isto numa única query, mas tornam o
 * SQL mais difícil de ler para quem está a aprender, e o ganho de
 * performance só é relevante em volumes muito grandes — prematuro
 * otimizar isso agora. Duas queries simples, cada uma fazendo UMA
 * coisa, são mais fáceis de entender e de depurar.
 */
async function findAll(
  filters: ProductFilters,
  pagination: PaginationParams
): Promise<PaginatedResult<Product>> {
  const { clause, values } = buildWhereClause(filters);

  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM product ${clause}`,
    values
  );
  const total = countResult.rows[0]?.count ?? 0;

  const offset = (pagination.page - 1) * pagination.limit;
  const limitParamIndex = values.length + 1;
  const offsetParamIndex = values.length + 2;
  const sortColumns = {
    createdAt_desc: 'product.created_at DESC',
    createdAt_asc: 'product.created_at ASC',
    name_asc: 'product.name ASC',
    name_desc: 'product.name DESC',
    price_asc: 'product.price ASC',
    price_desc: 'product.price DESC',
  } as const;
  const orderBy = sortColumns[filters.sort ?? 'createdAt_desc'];

  const dataResult = await query<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS}, ${MAIN_IMAGE_COLUMNS}, category.label AS category_name
     FROM product
     INNER JOIN category ON category.id = product.id_category
     ${MAIN_IMAGE_JOIN}
     ${clause}
    ORDER BY ${orderBy}, product.id ASC
     LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
    [...values, pagination.limit, offset]
  );

  return {
    data: dataResult.rows.map(toProduct),
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages: Math.ceil(total / pagination.limit),
  };
}

async function findById(id: string): Promise<Product | null> {
  const result = await query<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS}, ${MAIN_IMAGE_COLUMNS}
     FROM product
     ${MAIN_IMAGE_JOIN}
     WHERE product.id = $1`,
    [id]
  );

  const row = result.rows[0];
  return row ? toProduct(row) : null;
}

/**
 * Mesmo padrão dinâmico de category.repository.ts / company.repository.ts:
 * só monta SET para os campos que de facto vieram no payload.
 *
 * `'description' in data`, `'originalPrice' in data`, `'badge' in
 * data` (em vez de `!== undefined`) distinguem "campo ausente" de
 * "campo enviado como null" — honrando a semântica de
 * `.nullable().optional()` já desenhada no validator.
 */
async function update(id: string, data: UpdateProductInput): Promise<Product | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.categoryId !== undefined) {
    fields.push(`id_category = $${paramIndex}`);
    values.push(data.categoryId);
    paramIndex += 1;
  }
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
  if ('originalPrice' in data) {
    fields.push(`original_price = $${paramIndex}`);
    values.push(data.originalPrice);
    paramIndex += 1;
  }
  if ('badge' in data) {
    fields.push(`badge = $${paramIndex}`);
    values.push(data.badge);
    paramIndex += 1;
  }

  if (fields.length === 0) {
    return findById(id);
  }

  values.push(id);

  const result = await query<ProductRow>(
    `UPDATE product
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id`,
    values
  );

  return result.rows[0] ? findById(id) : null;
}

/**
 * DELETE físico. `product_image` e `product_specification` têm
 * ON DELETE CASCADE (saem junto automaticamente) — mas `cart_item` e
 * `order_item` referenciam product SEM cascade, de propósito: um
 * pedido já feito não pode "perder" o item só porque o produto foi
 * removido do catálogo depois. Por isso capturamos a violação de
 * FOREIGN KEY aqui e traduzimos para uma mensagem de negócio clara,
 * em vez de deixar vazar um 500 genérico do Postgres. Os assets são
 * enfileirados na mesma transação para permitir novas tentativas.
 */
async function remove(id: string, cloudinaryPublicIds: string[] = []): Promise<boolean> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const product = await client.query<{ id: string }>(
      'SELECT id FROM product WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (!product.rows[0]) {
      await client.query('COMMIT');
      return false;
    }

    await client.query(
      `INSERT INTO cloudinary_asset_deletion (public_id)
       SELECT cloudinary_public_id
       FROM product_image
       WHERE id_product = $1 AND cloudinary_public_id IS NOT NULL
       ON CONFLICT (public_id) DO NOTHING`,
      [id]
    );

    if (cloudinaryPublicIds.length > 0) {
      await client.query(
        `INSERT INTO cloudinary_asset_deletion (public_id)
         SELECT unnest($1::text[])
         ON CONFLICT (public_id) DO NOTHING`,
        [cloudinaryPublicIds]
      );
    }

    const result = await client.query('DELETE FROM product WHERE id = $1', [id]);
    await client.query('COMMIT');
    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    await client.query('ROLLBACK');
    if (isPgError(err) && err.code === PG_FOREIGN_KEY_VIOLATION) {
      throw new ConflictError(
        'Não é possível remover este produto: existem carrinhos ou pedidos que o referenciam.'
      );
    }
    throw err;
  } finally {
    client.release();
  }
}

export const productRepository = {
  create,
  findAll,
  findById,
  update,
  remove,
};

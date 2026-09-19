import { query } from '../database/pool';
import { CreateProductData, Product, ProductFilters, ProductRow } from '../types/product.types';
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
  };
}

const RETURNING_COLUMNS = `id, id_category, name, description, price, original_price,
  badge, status, created_at, updated_at`;
const LIST_COLUMNS = `product.id, product.id_category, product.name, product.description,
  product.price, product.original_price, product.badge, product.status,
  product.created_at, product.updated_at`;

async function create(data: CreateProductData): Promise<Product> {
  const result = await query<ProductRow>(
    `INSERT INTO product (id_category, name, description, price, original_price, badge)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${RETURNING_COLUMNS}`,
    [
      data.categoryId,
      data.name,
      data.description ?? null,
      data.price,
      data.originalPrice ?? null,
      data.badge ?? null,
    ]
  );

  return toProduct(result.rows[0] as ProductRow);
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
    conditions.push(`status = $${values.length}`);
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

  const dataResult = await query<ProductRow>(
    `SELECT ${LIST_COLUMNS}, category.label AS category_name
     FROM product
     INNER JOIN category ON category.id = product.id_category
     ${clause}
    ORDER BY product.created_at DESC
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
  const result = await query<ProductRow>(`SELECT ${RETURNING_COLUMNS} FROM product WHERE id = $1`, [
    id,
  ]);

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
     RETURNING ${RETURNING_COLUMNS}`,
    values
  );

  const row = result.rows[0];
  return row ? toProduct(row) : null;
}

/**
 * DELETE físico. `product_image` e `product_specification` têm
 * ON DELETE CASCADE (saem junto automaticamente) — mas `cart_item` e
 * `order_item` referenciam product SEM cascade, de propósito: um
 * pedido já feito não pode "perder" o item só porque o produto foi
 * removido do catálogo depois. Por isso capturamos a violação de
 * FOREIGN KEY aqui e traduzimos para uma mensagem de negócio clara,
 * em vez de deixar vazar um 500 genérico do Postgres.
 */
async function remove(id: string): Promise<boolean> {
  try {
    const result = await query('DELETE FROM product WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    if (isPgError(err) && err.code === PG_FOREIGN_KEY_VIOLATION) {
      throw new ConflictError(
        'Não é possível remover este produto: existem carrinhos ou pedidos que o referenciam.'
      );
    }
    throw err;
  }
}

export const productRepository = {
  create,
  findAll,
  findById,
  update,
  remove,
};

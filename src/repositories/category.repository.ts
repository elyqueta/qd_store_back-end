import { query } from '../database/pool';
import { Category, CategoryRow, CreateCategoryData } from '../types/category.types';
import { UpdateCategoryInput } from '../validators/category.validator';
import { ConflictError } from '../errors';

/** Código SQLSTATE do Postgres para violação de UNIQUE constraint. */
const PG_UNIQUE_VIOLATION = '23505';

/** Código SQLSTATE do Postgres para violação de FOREIGN KEY constraint. */
const PG_FOREIGN_KEY_VIOLATION = '23503';

/**
 * Type guard para erros vindos do driver `pg`.
 *
 * O `pg` lança instâncias de `DatabaseError`, mas o TypeScript, ao
 * capturar um erro num `catch`, só sabe que ele é `unknown` (no modo
 * strict). Em vez de fazer um cast direto (`err as any`), verificamos
 * em runtime se o objeto realmente tem a forma esperada antes de
 * acessar `.code` — isso mantém o "no any" que a stack exige, sem
 * abrir mão de segurança de tipos.
 */
function isPgError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

/**
 * Converte uma linha crua do Postgres (snake_case) no formato de
 * domínio (camelCase). Esta é a ÚNICA função em toda a aplicação que
 * deveria conhecer os dois formatos ao mesmo tempo — todo o resto do
 * código só vê `Category`.
 */
function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    icon: row.icon,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Insere uma nova categoria.
 *
 * O `RETURNING` evita uma segunda query: o Postgres já devolve a
 * linha completa (incluindo id, created_at, updated_at gerados por
 * DEFAULT) na mesma viagem ao banco que fez o INSERT.
 */
async function create(data: CreateCategoryData): Promise<Category> {
  try {
    const result = await query<CategoryRow>(
      `INSERT INTO category (slug, label, icon)
       VALUES ($1, $2, $3)
       RETURNING id, slug, label, icon, created_at, updated_at`,
      [data.slug, data.label, data.icon ?? null]
    );

    // result.rows[0] é seguro aqui: um INSERT bem-sucedido com
    // RETURNING sempre devolve exatamente uma linha.
    return toCategory(result.rows[0] as CategoryRow);
  } catch (err) {
    if (isPgError(err) && err.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError(`Já existe uma categoria com o slug "${data.slug}".`);
    }
    // Qualquer outro erro (conexão perdida, sintaxe SQL, etc.) sobe
    // sem tratamento especial — vai cair no errorHandler global como
    // erro inesperado (500), que é o comportamento correto para
    // falhas que não sabemos explicar ao cliente.
    throw err;
  }
}

/**
 * Lista todas as categorias, ordenadas por label.
 *
 * Ordenar por `label` (não por `created_at`) faz mais sentido de
 * produto aqui: um dropdown de categorias num e-commerce deve
 * aparecer em ordem alfabética para o utilizador encontrar rápido,
 * não na ordem em que foram cadastradas no sistema.
 */
async function findAll(): Promise<Category[]> {
  const result = await query<CategoryRow>(
    `SELECT id, slug, label, icon, created_at, updated_at
     FROM category
     ORDER BY label ASC`
  );

  return result.rows.map(toCategory);
}

/**
 * Busca uma categoria por id.
 *
 * Devolve `Category | null` em vez de lançar erro quando não existe.
 * Por quê: "não encontrado" não é uma falha do repository — é um
 * resultado válido de uma busca. Decidir se isso deve virar um HTTP
 * 404 é responsabilidade do service, não do repository. Se o
 * repository lançasse NotFoundError diretamente, estaríamos a
 * misturar a camada de acesso a dados com a camada de regra HTTP.
 */
async function findById(id: string): Promise<Category | null> {
  const result = await query<CategoryRow>(
    `SELECT id, slug, label, icon, created_at, updated_at
     FROM category
     WHERE id = $1`,
    [id]
  );

  const row = result.rows[0];
  return row ? toCategory(row) : null;
}

/**
 * Atualiza parcialmente uma categoria (PATCH).
 *
 * O desafio aqui é que UpdateCategoryInput é PARCIAL — o cliente pode
 * enviar só `label`, só `icon`, ou ambos. Construir o SQL de forma
 * fixa (ex: sempre "SET label = $1, icon = $2") obrigaria a sempre
 * atualizar as duas colunas, sobrescrevendo com `undefined -> NULL`
 * qualquer campo que o cliente não quisesse alterar. Por isso
 * montamos a cláusula SET dinamicamente, incluindo apenas os campos
 * que de facto vieram no payload.
 *
 * Note a distinção entre `undefined` e `null` para `icon`, herdada
 * do UpdateCategoryInput: usamos `'icon' in data` (não apenas
 * `data.icon !== undefined`) para diferenciar "campo ausente" de
 * "campo enviado como null" — só assim conseguimos honrar a
 * intenção de "remover o ícone" desenhada no schema Zod.
 *
 * Não incluímos `updated_at` manualmente: o trigger
 * `trg_category_set_updated_at` já cuida disso no lado do banco.
 */
async function update(id: string, data: UpdateCategoryInput): Promise<Category | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.label !== undefined) {
    fields.push(`label = $${paramIndex}`);
    values.push(data.label);
    paramIndex += 1;
  }

  if ('icon' in data) {
    fields.push(`icon = $${paramIndex}`);
    values.push(data.icon);
    paramIndex += 1;
  }

  // Nada para atualizar — o validator já deveria ter barrado isto
  // com o .refine() no schema, mas mantemos esta guarda aqui também.
  // Repetir a verificação numa camada mais interna é uma prática
  // deliberada (defesa em profundidade): o repository não deveria
  // confiar cegamente que quem o chama sempre validou tudo primeiro.
  if (fields.length === 0) {
    return findById(id);
  }

  values.push(id);

  const result = await query<CategoryRow>(
    `UPDATE category
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, slug, label, icon, created_at, updated_at`,
    values
  );

  const row = result.rows[0];
  return row ? toCategory(row) : null;
}

/**
 * Remove uma categoria.
 *
 * Devolve `boolean`: `true` se algo foi de facto apagado, `false` se
 * o id não existia. Isso permite ao service decidir entre responder
 * 404 (id não existia) e 204 (apagado com sucesso), sem o repository
 * precisar saber nada sobre códigos HTTP.
 *
 * O catch aqui trata especificamente o caso de a categoria ainda ter
 * produtos associados (FOREIGN KEY de `product.id_category`). Sem
 * este tratamento, tentar apagar uma categoria "em uso" devolveria um
 * 500 genérico, quando na verdade é uma situação de negócio esperada
 * e comunicável: "não é possível remover, ainda há produtos aqui".
 */
async function remove(id: string): Promise<boolean> {
  try {
    const result = await query('DELETE FROM category WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    if (isPgError(err) && err.code === PG_FOREIGN_KEY_VIOLATION) {
      throw new ConflictError(
        'Não é possível remover esta categoria: existem produtos associados a ela.'
      );
    }
    throw err;
  }
}

/**
 * Exportado como objeto (não como funções soltas) para que, no
 * service, a origem de cada chamada fique explícita na leitura do
 * código: `categoryRepository.findById(...)`, e não apenas
 * `findById(...)` — importante quando futuramente existirem
 * repositories de outras entidades com nomes de função parecidos.
 */
export const categoryRepository = {
  create,
  findAll,
  findById,
  update,
  remove,
};
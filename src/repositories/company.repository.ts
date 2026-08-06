import { query } from '../database/pool';
import { Company, CompanyRow, CreateCompanyData } from '../types/company.types';
import { UpdateCompanyInput } from '../validators/company.validator';
import { ConflictError } from '../errors';

/** Código SQLSTATE do Postgres para violação de UNIQUE constraint. */
const PG_UNIQUE_VIOLATION = '23505';

function isPgError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

function toCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    nif: row.nif,
    sector: row.sector,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create(data: CreateCompanyData): Promise<Company> {
  try {
    const result = await query<CompanyRow>(
      `INSERT INTO company (name, nif, sector)
       VALUES ($1, $2, $3)
       RETURNING id, name, nif, sector, status, created_at, updated_at`,
      [data.name, data.nif, data.sector ?? null]
    );

    return toCompany(result.rows[0] as CompanyRow);
  } catch (err) {
    if (isPgError(err) && err.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError(`Já existe uma empresa registada com o NIF "${data.nif}".`);
    }
    throw err;
  }
}

async function findAll(): Promise<Company[]> {
  const result = await query<CompanyRow>(
    `SELECT id, name, nif, sector, status, created_at, updated_at
     FROM company
     ORDER BY name ASC`
  );

  return result.rows.map(toCompany);
}

async function findById(id: string): Promise<Company | null> {
  const result = await query<CompanyRow>(
    `SELECT id, name, nif, sector, status, created_at, updated_at
     FROM company
     WHERE id = $1`,
    [id]
  );

  const row = result.rows[0];
  return row ? toCompany(row) : null;
}

/**
 * Note que "nif" NÃO aparece mais aqui — nem no schema (Zod já
 * rejeita o campo antes de chegar até aqui), nem na construção do
 * SET dinâmico. Mesmo que alguém, por engano, tentasse forçar um
 * "nif" no UpdateCompanyInput por fora do TypeScript (ex.: um cast
 * malicioso), este repository simplesmente não tem código nenhum
 * que leia essa propriedade — dupla proteção: tipo + implementação.
 */
async function update(id: string, data: UpdateCompanyInput): Promise<Company | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex}`);
    values.push(data.name);
    paramIndex += 1;
  }

  if ('sector' in data) {
    fields.push(`sector = $${paramIndex}`);
    values.push(data.sector);
    paramIndex += 1;
  }

  if (fields.length === 0) {
    return findById(id);
  }

  values.push(id);

  const result = await query<CompanyRow>(
    `UPDATE company
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, name, nif, sector, status, created_at, updated_at`,
    values
  );

  const row = result.rows[0];
  return row ? toCompany(row) : null;
}

/**
 * Soft delete: mesma convenção de USER — nenhuma empresa é apagada
 * fisicamente, apenas marcada como 'inactive'.
 */
async function deactivate(id: string): Promise<Company | null> {
  const result = await query<CompanyRow>(
    `UPDATE company
     SET status = 'inactive'
     WHERE id = $1 AND status != 'inactive'
     RETURNING id, name, nif, sector, status, created_at, updated_at`,
    [id]
  );

  const row = result.rows[0];
  return row ? toCompany(row) : null;
}

export const companyRepository = {
  create,
  findAll,
  findById,
  update,
  deactivate,
};
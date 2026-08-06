import { query } from '../database/pool';
import { CreateUserCompanyData, UserCompany, UserCompanyRow } from '../types/userCompany.types';
import { ConflictError, NotFoundError } from '../errors';

/** Código SQLSTATE do Postgres para violação de UNIQUE/PRIMARY KEY. */
const PG_UNIQUE_VIOLATION = '23505';
/** Código SQLSTATE do Postgres para violação de FOREIGN KEY. */
const PG_FOREIGN_KEY_VIOLATION = '23503';

function isPgError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

function toUserCompany(row: UserCompanyRow): UserCompany {
  return {
    userId: row.id_user,
    companyId: row.id_company,
    role: row.role,
    createdAt: row.created_at,
  };
}

/**
 * Cria a associação. A existência de id_company já foi confirmada
 * pelo service (via companyService.findById) ANTES de chegar aqui —
 * por isso, se ainda assim ocorrer uma violação de FOREIGN KEY,
 * só pode ser o id_user que não existe. É por isso que a mensagem
 * de erro abaixo é específica a "utilizador", e não genérica.
 */
async function create(data: CreateUserCompanyData): Promise<UserCompany> {
  try {
    const result = await query<UserCompanyRow>(
      `INSERT INTO user_company (id_user, id_company, role)
       VALUES ($1, $2, $3)
       RETURNING id_user, id_company, role, created_at`,
      [data.userId, data.companyId, data.role ?? null]
    );

    return toUserCompany(result.rows[0] as UserCompanyRow);
  } catch (err) {
    if (isPgError(err) && err.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError('Este utilizador já está associado a esta empresa.');
    }
    if (isPgError(err) && err.code === PG_FOREIGN_KEY_VIOLATION) {
      throw new NotFoundError(`Utilizador com id "${data.userId}" não encontrado.`);
    }
    throw err;
  }
}

async function findByCompany(companyId: string): Promise<UserCompany[]> {
  const result = await query<UserCompanyRow>(
    `SELECT id_user, id_company, role, created_at
     FROM user_company
     WHERE id_company = $1
     ORDER BY created_at ASC`,
    [companyId]
  );

  return result.rows.map(toUserCompany);
}

async function updateRole(
  companyId: string,
  userId: string,
  role: string | null
): Promise<UserCompany | null> {
  const result = await query<UserCompanyRow>(
    `UPDATE user_company
     SET role = $1
     WHERE id_company = $2 AND id_user = $3
     RETURNING id_user, id_company, role, created_at`,
    [role, companyId, userId]
  );

  const row = result.rows[0];
  return row ? toUserCompany(row) : null;
}

/**
 * Remove a associação. Devolve boolean, não a linha — quem chama só
 * precisa de saber se algo existia para ser removido (mesmo padrão
 * de category.repository.ts).
 */
async function remove(companyId: string, userId: string): Promise<boolean> {
  const result = await query('DELETE FROM user_company WHERE id_company = $1 AND id_user = $2', [
    companyId,
    userId,
  ]);

  return (result.rowCount ?? 0) > 0;
}

export const userCompanyRepository = {
  create,
  findByCompany,
  updateRole,
  remove,
};

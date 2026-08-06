import { query } from '../database/pool';
import { CreateUserData, User, UserRow, UserWithPasswordHash } from '../types/user.types';
import { ConflictError } from '../errors';

/** Código SQLSTATE do Postgres para violação de UNIQUE constraint. */
const PG_UNIQUE_VIOLATION = '23505';

/**
 * Type guard para erros vindos do driver `pg`.
 * (Mesmo padrão já usado em category.repository.ts — ver comentário
 * lá para a justificativa completa. Poderia ser extraído para um
 * util partilhado se um terceiro repository precisar dele; por
 * agora, duplicar é menos custoso do que criar uma abstração cedo
 * demais para um único caso de uso.)
 */
function isPgError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

/**
 * Converte uma linha crua (snake_case) para o formato de domínio
 * SEGURO — sem password_hash. Esta é a função usada por TODO o
 * resto da aplicação, exceto o fluxo de login.
 */
function toUser(row: UserRow): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    nif: row.nif,
    accountType: row.account_type,
    status: row.status,
    deactivatedAt: row.deactivated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Converte uma linha crua para o formato de domínio COM o hash da
 * senha. Só deve ser chamada por findByEmail, e o valor resultante
 * só deve circular dentro de auth.service.ts.
 */
function toUserWithPasswordHash(row: UserRow): UserWithPasswordHash {
  return {
    ...toUser(row),
    passwordHash: row.password_hash,
  };
}

/**
 * Cria um novo utilizador.
 *
 * `account_type` chega sempre como 'personal' aqui, porque é o
 * único valor aceite pelo registerSchema (ver auth.validator.ts) —
 * o repository não precisa de saber essa regra, só reflete o que o
 * service lhe entrega.
 */
async function create(data: CreateUserData): Promise<User> {
  try {
    const result = await query<UserRow>(
      `INSERT INTO users (full_name, email, password_hash, phone, nif, account_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name, email, password_hash, phone, nif, account_type,
                 status, deactivated_at, created_at, updated_at`,
      [data.fullName, data.email, data.passwordHash, data.phone, data.nif ?? null, data.accountType]
    );

    return toUser(result.rows[0] as UserRow);
  } catch (err) {
    if (isPgError(err) && err.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError(`Já existe uma conta registada com o email "${data.email}".`);
    }
    throw err;
  }
}

/**
 * Busca um utilizador pelo email, INCLUINDO o hash da senha.
 *
 * Usada exclusivamente pelo fluxo de login (auth.service.ts), que
 * precisa do hash para comparar com a senha enviada. Nenhuma outra
 * parte da aplicação deveria importar esta função.
 */
async function findByEmail(email: string): Promise<UserWithPasswordHash | null> {
  const result = await query<UserRow>(
    `SELECT id, full_name, email, password_hash, phone, nif, account_type,
            status, deactivated_at, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  const row = result.rows[0];
  return row ? toUserWithPasswordHash(row) : null;
}

/**
 * Busca um utilizador pelo id — formato SEGURO (sem hash). Usada
 * pelo middleware de autenticação e por qualquer service que precise
 * confirmar dados atuais do utilizador autenticado.
 */
async function findById(id: string): Promise<User | null> {
  const result = await query<UserRow>(
    `SELECT id, full_name, email, password_hash, phone, nif, account_type,
            status, deactivated_at, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  const row = result.rows[0];
  return row ? toUser(row) : null;
}

export const userRepository = {
  create,
  findByEmail,
  findById,
};

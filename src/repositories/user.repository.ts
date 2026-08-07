import { query } from '../database/pool';
import {
  CreateUserData,
  User,
  UserRow,
  UserWithPasswordHash,
} from '../types/user.types';
import { ConflictError } from '../errors';

const PG_UNIQUE_VIOLATION = '23505';

function isPgError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    nif: row.nif,
    accountType: row.account_type,
    role: row.role,
    status: row.status,
    deactivatedAt: row.deactivated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toUserWithPasswordHash(row: UserRow): UserWithPasswordHash {
  return {
    ...toUser(row),
    passwordHash: row.password_hash,
  };
}

/**
 * `data.role ?? 'customer'` é a linha mais importante desta função
 * do ponto de vista de segurança: mesmo que amanhã, por engano,
 * alguém conecte `role` a um input vindo do cliente, esta ainda não
 * seria a única defesa — mas garante que, sem valor explícito, o
 * comportamento é sempre o mais seguro (customer), nunca admin por
 * omissão.
 */
async function create(data: CreateUserData): Promise<User> {
  try {
    const result = await query<UserRow>(
      `INSERT INTO users (full_name, email, password_hash, phone, nif, account_type, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, full_name, email, password_hash, phone, nif, account_type, role,
                 status, deactivated_at, created_at, updated_at`,
      [
        data.fullName,
        data.email,
        data.passwordHash,
        data.phone,
        data.nif ?? null,
        data.accountType,
        data.role ?? 'customer',
      ]
    );

    return toUser(result.rows[0] as UserRow);
  } catch (err) {
    if (isPgError(err) && err.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError(`Já existe uma conta registada com o email "${data.email}".`);
    }
    throw err;
  }
}

async function findByEmail(email: string): Promise<UserWithPasswordHash | null> {
  const result = await query<UserRow>(
    `SELECT id, full_name, email, password_hash, phone, nif, account_type, role,
            status, deactivated_at, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  const row = result.rows[0];
  return row ? toUserWithPasswordHash(row) : null;
}

async function findById(id: string): Promise<User | null> {
  const result = await query<UserRow>(
    `SELECT id, full_name, email, password_hash, phone, nif, account_type, role,
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
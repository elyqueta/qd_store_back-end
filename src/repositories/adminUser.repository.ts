import type { PoolClient } from 'pg';
import { ConflictError, NotFoundError } from '../errors';
import { getClient, query } from '../database/pool';
import { userRepository } from './user.repository';
import type { AdminCompany, AdminUserDetail, AdminUserFilters, AdminUserListResult } from '../types/adminUser.types';
import type { UserRole, UserRow, UserStatus } from '../types/user.types';
import { logger } from '../config/logger';

const SORT_COLUMNS = {
  createdAt: 'u.created_at',
  name: 'u.full_name',
  email: 'u.email',
  status: 'u.status',
} as const;

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

async function findAll(filters: AdminUserFilters, page: number, limit: number): Promise<AdminUserListResult> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  const add = (condition: string, value: unknown): void => {
    values.push(value);
    conditions.push(condition.replace('?', `$${values.length}`));
  };
  if (filters.search) {
    const pattern = `%${escapeLike(filters.search)}%`;
    values.push(pattern, pattern);
    conditions.push(`(u.full_name ILIKE $${values.length - 1} ESCAPE '\\' OR u.email ILIKE $${values.length} ESCAPE '\\')`);
  }
  if (filters.role) add('u.role = ?', filters.role);
  if (filters.status) add('u.status = ?', filters.status);
  if (filters.accountType) add('u.account_type = ?', filters.accountType);
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const count = await query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM users u ${where}`,
    values
  );
  const total = Number(count.rows[0]?.total ?? 0);
  const offset = (page - 1) * limit;
  const result = await query<UserRow>(
    `SELECT u.* FROM users u ${where} ORDER BY ${SORT_COLUMNS[filters.sort]} ASC, u.id ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );
  return {
    data: result.rows.map(userRepository.toSafeUser),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

async function findById(id: string): Promise<AdminUserDetail | null> {
  const result = await query<UserRow & { companies: AdminCompany[] }>(
    `SELECT u.*,
            COALESCE(
              json_agg(json_build_object(
                'id', c.id,
                'name', c.name,
                'nif', c.nif,
                'role', uc.role,
                'status', c.status
              ) ORDER BY c.name) FILTER (WHERE c.id IS NOT NULL),
              '[]'::json
            ) AS companies
     FROM users u
     LEFT JOIN user_company uc ON uc.id_user = u.id
     LEFT JOIN company c ON c.id = uc.id_company
     WHERE u.id = $1
     GROUP BY u.id`,
    [id]
  );
  const row = result.rows[0];
  return row ? { ...userRepository.toSafeUser(row), companies: row.companies } : null;
}

async function updateStatus(id: string, actorId: string, status: UserStatus): Promise<AdminUserDetail> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('qd_admin_user_mutation'))");
    const current = await lockUser(client, id);
    if (!current) throw new NotFoundError('Utilizador não encontrado.');
    if (id === actorId && status !== 'active') throw new ConflictError('Não podes desactivar ou banir a tua própria conta.');
    if (current.role === 'admin' && current.status === 'active' && status !== 'active') await ensureAnotherAdmin(client, id);
    const result = await client.query(`UPDATE users SET status = $1, deactivated_at = CASE WHEN $1 = 'active' THEN NULL ELSE NOW() END WHERE id = $2 RETURNING id`, [status, id]);
    if ((result.rowCount ?? 0) === 0) throw new ConflictError('Utilizador não encontrado.');
    if (status !== 'active') await client.query('DELETE FROM session WHERE id_user = $1', [id]);
    await audit(client, actorId, 'user.status.updated', id, { status });
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  logger.info({ actorId, targetId: id, action: 'user.status.updated', status }, 'Estado de utilizador actualizado por administrador');
  const updated = await findById(id);
  if (!updated) throw new NotFoundError('Utilizador não encontrado.');
  return updated;
}

async function updateRole(id: string, actorId: string, role: UserRole): Promise<AdminUserDetail> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('qd_admin_user_mutation'))");
    const current = await lockUser(client, id);
    if (!current) throw new NotFoundError('Utilizador não encontrado.');
    if (id === actorId && role !== 'admin') throw new ConflictError('Não podes retirar o teu próprio papel de administrador.');
    if (current.role === 'admin' && role !== 'admin' && current.status === 'active') await ensureAnotherAdmin(client, id);
    await client.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    if (current.role !== role) await client.query('DELETE FROM session WHERE id_user = $1', [id]);
    await audit(client, actorId, 'user.role.updated', id, { role });
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  logger.info({ actorId, targetId: id, action: 'user.role.updated', role }, 'Papel de utilizador actualizado por administrador');
  const updated = await findById(id);
  if (!updated) throw new NotFoundError('Utilizador não encontrado.');
  return updated;
}

async function lockUser(client: PoolClient, id: string): Promise<{ role: UserRole; status: UserStatus } | null> {
  const result = await client.query<{ role: UserRole; status: UserStatus }>('SELECT role, status FROM users WHERE id = $1 FOR UPDATE', [id]);
  return result.rows[0] ?? null;
}

async function ensureAnotherAdmin(client: PoolClient, excludedId: string): Promise<void> {
  const result = await client.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM users WHERE role = 'admin' AND status = 'active' AND id <> $1`,
    [excludedId]
  );
  if (Number(result.rows[0]?.count ?? 0) === 0) throw new ConflictError('O último administrador activo não pode perder o acesso.');
}

async function audit(client: PoolClient, actorId: string, action: string, targetId: string, metadata: object): Promise<void> {
  await client.query(
    `INSERT INTO audit_log (id_actor, action, target_type, target_id, metadata) VALUES ($1, $2, 'user', $3, $4)`,
    [actorId, action, targetId, JSON.stringify(metadata)]
  );
}

export const adminUserRepository = { findAll, findById, updateStatus, updateRole };

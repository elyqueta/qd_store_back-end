import { getClient, query } from '../database/pool';
import {
  CreateUserData,
  ProfilePhoto,
  User,
  UserRow,
  UserWithPasswordHash,
} from '../types/user.types';
import { ConflictError } from '../errors';
import type { PoolClient } from 'pg';

const PG_UNIQUE_VIOLATION = '23505';

function isPgError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

export function toSafeUser(row: UserRow): User {
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
    profilePhoto: toProfilePhoto(row),
  };
}

function toProfilePhoto(row: UserRow): ProfilePhoto | null {
  if (
    !row.profile_photo_url ||
    row.profile_photo_width === null ||
    row.profile_photo_height === null ||
    !row.profile_photo_format ||
    row.profile_photo_size_bytes === null
  ) {
    return null;
  }

  return {
    url: row.profile_photo_url,
    width: row.profile_photo_width,
    height: row.profile_photo_height,
    format: row.profile_photo_format,
    sizeBytes: row.profile_photo_size_bytes,
  };
}

const userColumns = `id, full_name, email, password_hash, phone, nif, account_type, role,
  status, deactivated_at, created_at, updated_at, profile_photo_url,
  profile_photo_cloudinary_public_id, profile_photo_width, profile_photo_height,
  profile_photo_format, profile_photo_size_bytes`;

function toUserWithPasswordHash(row: UserRow): UserWithPasswordHash {
  return {
    ...toSafeUser(row),
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
       RETURNING ${userColumns}`,
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

    return toSafeUser(result.rows[0] as UserRow);
  } catch (err) {
    if (isPgError(err) && err.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError(`Já existe uma conta registada com o email "${data.email}".`);
    }
    throw err;
  }
}

async function findByEmail(email: string): Promise<UserWithPasswordHash | null> {
  const result = await query<UserRow>(
    `SELECT ${userColumns}
     FROM users
     WHERE email = $1`,
    [email]
  );

  const row = result.rows[0];
  return row ? toUserWithPasswordHash(row) : null;
}

async function findById(id: string): Promise<User | null> {
  const result = await query<UserRow>(
    `SELECT ${userColumns}
     FROM users
     WHERE id = $1`,
    [id]
  );

  const row = result.rows[0];
  return row ? toSafeUser(row) : null;
}

async function findByIdWithPasswordHash(
  id: string
): Promise<{ user: User; passwordHash: string; profilePhotoPublicId: string | null } | null> {
  const result = await query<UserRow>(
    `SELECT ${userColumns}
     FROM users
     WHERE id = $1`,
    [id]
  );
  const row = result.rows[0];
  return row
    ? {
        user: toSafeUser(row),
        passwordHash: row.password_hash,
        profilePhotoPublicId: row.profile_photo_cloudinary_public_id,
      }
    : null;
}

export interface UpdateUserProfileData {
  userId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  profilePhoto?: {
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    sizeBytes: number;
  } | null;
  previousEmail?: string;
  previousPhone?: string;
  actorId: string;
}

async function updateProfile(data: UpdateUserProfileData): Promise<User> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;
    const add = (field: string, value: unknown): void => {
      fields.push(`${field} = $${index}`);
      values.push(value);
      index += 1;
    };

    if (data.fullName !== undefined) add('full_name', data.fullName);
    if (data.email !== undefined) add('email', data.email);
    if (data.phone !== undefined) add('phone', data.phone);
    if (data.passwordHash !== undefined) add('password_hash', data.passwordHash);
    if (data.profilePhoto !== undefined) {
      add('profile_photo_url', data.profilePhoto?.url ?? null);
      add('profile_photo_cloudinary_public_id', data.profilePhoto?.publicId ?? null);
      add('profile_photo_width', data.profilePhoto?.width ?? null);
      add('profile_photo_height', data.profilePhoto?.height ?? null);
      add('profile_photo_format', data.profilePhoto?.format ?? null);
      add('profile_photo_size_bytes', data.profilePhoto?.sizeBytes ?? null);
    }

    values.push(data.userId);
    const result = await client.query<UserRow>(
      `UPDATE users SET ${fields.join(', ')}
       WHERE id = $${index}
       RETURNING ${userColumns}`,
      values
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Utilizador não encontrado durante a actualização do perfil.');
    }

    if (data.email !== undefined && data.previousEmail !== undefined) {
      await insertHistory(client, data.userId, 'email', data.previousEmail, data.email, data.actorId);
    }
    if (data.phone !== undefined && data.previousPhone !== undefined) {
      await insertHistory(client, data.userId, 'phone', data.previousPhone, data.phone, data.actorId);
    }
    if (data.passwordHash !== undefined) {
      await client.query('DELETE FROM session WHERE id_user = $1', [data.userId]);
    }

    await client.query('COMMIT');
    return toSafeUser(row);
  } catch (error) {
    await client.query('ROLLBACK');
    if (isPgError(error) && error.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError('Já existe uma conta registada com este email.');
    }
    throw error;
  } finally {
    client.release();
  }
}

async function insertHistory(
  client: PoolClient,
  userId: string,
  fieldName: 'email' | 'phone',
  oldValue: string,
  newValue: string,
  actorId: string
): Promise<void> {
  await client.query(
    `INSERT INTO user_profile_history (id_user, field_name, old_value, new_value, changed_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, fieldName, oldValue, newValue, actorId]
  );
}

export const userRepository = {
  create,
  findByEmail,
  findById,
  findByIdWithPasswordHash,
  updateProfile,
  toSafeUser,
};

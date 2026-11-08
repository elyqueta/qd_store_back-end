import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clientQuery: vi.fn(),
  release: vi.fn(),
  getClient: vi.fn(),
  query: vi.fn(),
}));

vi.mock('../src/database/pool', () => ({
  getClient: mocks.getClient,
  query: mocks.query,
}));

import { ConflictError } from '../src/errors';
import { adminUserRepository } from '../src/repositories/adminUser.repository';
import {
  adminListUsersQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from '../src/validators/adminUser.validator';

describe('admin user contracts', () => {
  it('applies pagination defaults and caps limit at 100', () => {
    expect(adminListUsersQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 20,
      sort: 'createdAt',
    });
    expect(adminListUsersQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
    expect(adminListUsersQuerySchema.safeParse({ unexpected: 'value' }).success).toBe(false);
  });

  it('accepts only supported status and role values', () => {
    expect(updateUserStatusSchema.safeParse({ status: 'banned' }).success).toBe(true);
    expect(updateUserStatusSchema.safeParse({ status: 'deleted' }).success).toBe(false);
    expect(updateUserRoleSchema.safeParse({ role: 'admin' }).success).toBe(true);
    expect(updateUserRoleSchema.safeParse({ role: 'owner' }).success).toBe(false);
  });
});

describe('admin user protections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getClient.mockResolvedValue({ query: mocks.clientQuery, release: mocks.release });
  });

  it('prevents an administrator from deactivating their own account', async () => {
    mocks.clientQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ role: 'admin', status: 'active' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await expect(
      adminUserRepository.updateStatus('admin-id', 'admin-id', 'inactive')
    ).rejects.toBeInstanceOf(ConflictError);
    expect(mocks.clientQuery).toHaveBeenCalledWith('ROLLBACK');
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it('prevents removing the last active administrator', async () => {
    mocks.clientQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ role: 'admin', status: 'active' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await expect(
      adminUserRepository.updateRole('target-admin', 'acting-admin', 'customer')
    ).rejects.toBeInstanceOf(ConflictError);
    expect(mocks.clientQuery).toHaveBeenCalledWith('ROLLBACK');
    expect(mocks.clientQuery.mock.calls.some(([sql]) => String(sql).startsWith('UPDATE users'))).toBe(false);
  });

  it('escapes wildcard characters in search and never returns password hashes', async () => {
    const now = new Date();
    mocks.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 'user-id',
          full_name: 'Utilizador de Teste',
          email: 'teste@example.com',
          password_hash: 'must-not-leak',
          phone: '+244900000000',
          nif: null,
          account_type: 'personal',
          role: 'customer',
          status: 'active',
          deactivated_at: null,
          created_at: now,
          updated_at: now,
          profile_photo_url: null,
          profile_photo_cloudinary_public_id: null,
          profile_photo_width: null,
          profile_photo_height: null,
          profile_photo_format: null,
          profile_photo_size_bytes: null,
        }],
      });

    const result = await adminUserRepository.findAll(
      { search: 'a%_', sort: 'createdAt' },
      1,
      20
    );

    expect(mocks.query.mock.calls[0]?.[0]).toContain("ILIKE $1 ESCAPE '\\'");
    expect(mocks.query.mock.calls[0]?.[1]).toEqual(['%a\\%\\_%', '%a\\%\\_%']);
    expect(result.data).toHaveLength(1);
    expect('passwordHash' in result.data[0] || 'password_hash' in result.data[0]).toBe(false);
  });
});

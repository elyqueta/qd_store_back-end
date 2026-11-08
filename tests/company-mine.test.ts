import express from 'express';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock('../src/database/pool', () => ({
  query: queryMock,
  getClient: vi.fn(),
}));

import { errorHandler } from '../src/middlewares/errorHandler';
import { swaggerSpec } from '../src/config/swagger';
import companyRoutes from '../src/routes/v1/company.routes';
import { generateAccessToken } from '../src/utils/token.util';

const date = new Date('2026-01-02T03:04:05.000Z');
const ownerMember = {
  id: 'user-owner-member',
  fullName: 'Owner Member',
  email: 'owner@example.test',
  companyRole: 'Proprietário',
};
const companyMember = {
  id: 'user-member',
  fullName: 'Member One',
  email: 'member@example.test',
  companyRole: 'Comprador',
};
const coworker = {
  id: 'user-coworker',
  fullName: 'Coworker',
  email: 'coworker@example.test',
  companyRole: null,
};
const ownedCompanyMember = {
  id: 'user-owned-company-member',
  fullName: 'Associated Employee',
  email: 'employee@example.test',
  companyRole: 'Gerente',
};
const adminCompanyMember = {
  id: 'user-admin-company-member',
  fullName: 'Admin Company Member',
  email: 'admin-member@example.test',
  companyRole: null,
};

const companies = [
  {
    id: 'company-owned-inactive',
    id_owner: 'user-owner',
    name: 'Owned Inactive',
    nif: '100',
    sector: null,
    status: 'inactive',
    created_at: date,
    updated_at: date,
    users: [ownedCompanyMember],
  },
  {
    id: 'company-member',
    id_owner: 'someone-else',
    name: 'Member Company',
    nif: '200',
    sector: 'Technology',
    status: 'active',
    created_at: date,
    updated_at: date,
    users: [coworker, companyMember],
  },
  {
    id: 'company-unrelated',
    id_owner: 'third-party',
    name: 'Secret Company',
    nif: '300',
    sector: null,
    status: 'active',
    created_at: date,
    updated_at: date,
    users: [{ ...coworker, id: 'unrelated-member' }],
  },
  {
    id: 'company-admin',
    id_owner: 'platform-admin',
    name: 'Admin Company',
    nif: '400',
    sector: null,
    status: 'banned',
    created_at: date,
    updated_at: date,
    users: [adminCompanyMember],
  },
  {
    id: 'company-owner-associated',
    id_owner: 'user-owner-member',
    name: 'Owner Also Member',
    nif: '500',
    sector: null,
    status: 'active',
    created_at: date,
    updated_at: date,
    users: [ownerMember],
  },
];

let server: ReturnType<typeof createServer>;
let baseUrl: string;

function token(sub: string, role: 'customer' | 'admin' = 'customer'): string {
  return generateAccessToken({
    sub,
    email: `${sub}@example.test`,
    accountType: 'personal',
    role,
  });
}

async function get(path: string, sub?: string, role: 'customer' | 'admin' = 'customer') {
  return fetch(`${baseUrl}${path}`, {
    headers: sub ? { Authorization: `Bearer ${token(sub, role)}` } : {},
  });
}

beforeEach(async () => {
  queryMock.mockImplementation(async (sql: string, params?: unknown[]) => {
    if (sql.includes('EXISTS (')) {
      const userId = params?.[0];
      const rows = companies.filter(
        (company) => company.id_owner === userId || company.users.some((user) => user.id === userId)
      );
      return { rows, rowCount: rows.length };
    }

    if (sql.includes('FROM company') && !sql.includes('json_agg')) {
      const rows = companies.map(({ users: _users, ...company }) => company);
      return { rows, rowCount: rows.length };
    }

    throw new Error(`Consulta inesperada no teste: ${sql}`);
  });

  const app = express();
  app.use('/api/v1/companies', companyRoutes);
  app.use(errorHandler);
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  queryMock.mockReset();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('GET /api/v1/companies/mine', () => {
  it('documents the authenticated endpoint and CompanyWithUsers response in OpenAPI', () => {
    expect(swaggerSpec.paths?.['/api/v1/companies/mine']).toMatchObject({
      get: {
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Empresas próprias ou associadas, sem duplicados.',
          },
        },
      },
    });
  });

  it('requires authentication and returns an empty list when the user has no companies', async () => {
    const unauthenticated = await get('/api/v1/companies/mine');
    expect(unauthenticated.status).toBe(401);

    const response = await get('/api/v1/companies/mine', 'user-with-no-companies');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'success', data: [] });
  });

  it('returns an owned inactive company and its associated members without requiring an owner association', async () => {
    const response = await get('/api/v1/companies/mine', 'user-owner');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: 'success',
      data: [
        {
          id: 'company-owned-inactive',
          ownerId: 'user-owner',
          status: 'inactive',
          users: [ownedCompanyMember],
        },
      ],
    });
    expect(body.data[0].users).not.toContainEqual(expect.objectContaining({ id: 'user-owner' }));
    expect(body.data).toHaveLength(1);
  });

  it('returns the member company and all its linked members, but no unrelated company data', async () => {
    const response = await get('/api/v1/companies/mine', 'user-member');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.data.map((company: { id: string }) => company.id)).toEqual(['company-member']);
    expect(body.data[0].users).toEqual([coworker, companyMember]);
    expect(body.data[0].users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'user-member',
          fullName: 'Member One',
          email: 'member@example.test',
          companyRole: 'Comprador',
        }),
        expect.objectContaining({ id: 'user-coworker', companyRole: null }),
      ])
    );
    expect(JSON.stringify(body)).not.toContain('Secret Company');
    expect(JSON.stringify(body)).not.toContain('company-unrelated');
  });

  it('uses only the authenticated subject and rejects client-supplied userId filters', async () => {
    const response = await get('/api/v1/companies/mine?userId=user-owner', 'user-member');

    expect(response.status).toBe(422);
    expect(queryMock).not.toHaveBeenCalled();

    const ownScope = await get('/api/v1/companies/mine', 'user-member');
    expect(ownScope.status).toBe(200);
    const mineQuery = queryMock.mock.calls[0]?.[0] as string;
    expect(mineQuery).toContain('c.id_owner = $1');
    expect(mineQuery).toContain('membership.id_user = $1');
    expect(mineQuery).toContain('GROUP BY c.id');
    expect(mineQuery).not.toContain("status = 'active'");
    expect(queryMock.mock.calls[0]?.[1]).toEqual(['user-member']);
  });

  it('does not duplicate a company when its owner is also associated, and keeps admin access scoped to their own companies', async () => {
    const ownerResponse = await get('/api/v1/companies/mine', 'user-owner-member');
    const ownerBody = await ownerResponse.json();
    expect(ownerBody.data.map((company: { id: string }) => company.id)).toEqual([
      'company-owner-associated',
    ]);

    const adminResponse = await get('/api/v1/companies/mine', 'platform-admin', 'admin');
    const adminBody = await adminResponse.json();
    expect(adminBody.data.map((company: { id: string }) => company.id)).toEqual(['company-admin']);
  });

  it('keeps GET /api/v1/companies restricted to admins', async () => {
    const forbidden = await get('/api/v1/companies', 'user-member');
    expect(forbidden.status).toBe(403);

    const adminResponse = await get('/api/v1/companies', 'platform-admin', 'admin');
    expect(adminResponse.status).toBe(200);
    expect((await adminResponse.json()).data).toHaveLength(companies.length);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
}));

vi.mock('../src/database/pool', () => ({
  query: mocks.query,
}));

import { NotFoundError } from '../src/errors';
import { quoteRequestRepository } from '../src/repositories/quoteRequest.repository';
import {
  createQuoteRequestSchema,
  listQuoteRequestsQuerySchema,
  updateQuoteRequestStatusSchema,
} from '../src/validators/quoteRequest.validator';

const validInput = {
  companyName: 'Empresa Exemplo, Lda.',
  nif: '500000001',
  contactName: 'Ana Exemplo',
  email: ' ANA@EXAMPLE.COM ',
  phone: '+244 923 456 789',
  province: ' luanda ',
  municipality: 'INGOMBOTA',
  sector: 'Tecnologia',
  volume: '10 a 20 unidades por mês',
  categories: ['Portáteis', 'Acessórios'],
  message: 'Solicito uma proposta.',
};

const quoteRequestRow = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  company_name: 'Empresa Exemplo, Lda.',
  nif: '500000001',
  contact_name: 'Ana Exemplo',
  email: 'ana@example.com',
  phone: '+244 923 456 789',
  province: 'Luanda',
  municipality: 'Ingombota',
  sector: 'Tecnologia',
  volume: '10 a 20 unidades por mês',
  categories: ['Portáteis', 'Acessórios'],
  message: 'Solicito uma proposta.',
  status: 'new' as const,
  created_at: new Date('2026-11-08T10:00:00.000Z'),
  updated_at: new Date('2026-11-08T10:00:00.000Z'),
};

describe('quote request validation', () => {
  it('validates input and canonicalizes email and Angola location names', () => {
    expect(createQuoteRequestSchema.parse(validInput)).toMatchObject({
      email: 'ana@example.com',
      province: 'Luanda',
      municipality: 'Ingombota',
    });
  });

  it('rejects invalid tax numbers, phone numbers, province/municipality pairs and extra fields', () => {
    expect(createQuoteRequestSchema.safeParse({ ...validInput, nif: '123' }).success).toBe(false);
    expect(createQuoteRequestSchema.safeParse({ ...validInput, phone: '12345' }).success).toBe(
      false
    );
    expect(
      createQuoteRequestSchema.safeParse({
        ...validInput,
        province: 'Luanda',
        municipality: 'Lobito',
      }).success
    ).toBe(false);
    expect(createQuoteRequestSchema.safeParse({ ...validInput, admin: true }).success).toBe(false);
  });

  it('requires non-empty, unique categories and accepts only known triage states', () => {
    expect(createQuoteRequestSchema.safeParse({ ...validInput, categories: [] }).success).toBe(
      false
    );
    expect(
      createQuoteRequestSchema.safeParse({ ...validInput, categories: ['Portáteis', 'Portáteis'] })
        .success
    ).toBe(false);
    expect(updateQuoteRequestStatusSchema.safeParse({ status: 'contacted' }).success).toBe(true);
    expect(updateQuoteRequestStatusSchema.safeParse({ status: 'pending' }).success).toBe(false);
    expect(listQuoteRequestsQuerySchema.parse({}).limit).toBe(20);
    expect(listQuoteRequestsQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
    expect(listQuoteRequestsQuerySchema.safeParse({ unknown: 'value' }).success).toBe(false);
  });
});

describe('quote request repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns camel-cased data and pagination, escaping search wildcards', async () => {
    mocks.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [quoteRequestRow] });

    const result = await quoteRequestRepository.findAll({ search: 'a%_', status: 'new' }, 1, 20);

    expect(mocks.query.mock.calls[0]?.[0]).toContain("ILIKE $2 ESCAPE '\\'");
    expect(mocks.query.mock.calls[0]?.[1]).toEqual(['new', '%a\\%\\_%', '%a\\%\\_%', '%a\\%\\_%']);
    expect(result.data[0]).toMatchObject({
      id: quoteRequestRow.id,
      companyName: quoteRequestRow.company_name,
      contactName: quoteRequestRow.contact_name,
      categories: quoteRequestRow.categories,
      status: 'new',
    });
    expect(result).toMatchObject({ page: 1, limit: 20, total: 1, totalPages: 1 });
  });

  it('reports an explicit 404 when an admin changes a nonexistent request', async () => {
    mocks.query.mockResolvedValueOnce({ rows: [] });
    await expect(
      quoteRequestRepository.updateStatus(quoteRequestRow.id, { status: 'closed' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

import { NotFoundError } from '../errors';
import { query } from '../database/pool';
import type {
  CreateQuoteRequestInput,
  UpdateQuoteRequestStatusInput,
} from '../validators/quoteRequest.validator';
import type {
  QuoteRequest,
  QuoteRequestFilters,
  QuoteRequestListResult,
} from '../types/quoteRequest.types';

interface QuoteRequestRow {
  id: string;
  company_name: string;
  nif: string;
  contact_name: string;
  email: string;
  phone: string;
  province: string;
  municipality: string;
  sector: string;
  volume: string;
  categories: string[];
  message: string | null;
  status: QuoteRequest['status'];
  created_at: Date;
  updated_at: Date;
}

function toQuoteRequest(row: QuoteRequestRow): QuoteRequest {
  return {
    id: row.id,
    companyName: row.company_name,
    nif: row.nif,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    province: row.province,
    municipality: row.municipality,
    sector: row.sector,
    volume: row.volume,
    categories: row.categories,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

async function create(input: CreateQuoteRequestInput): Promise<QuoteRequest> {
  const result = await query<QuoteRequestRow>(
    `INSERT INTO quote_request
      (company_name, nif, contact_name, email, phone, province, municipality, sector, volume, categories, message)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      input.companyName,
      input.nif,
      input.contactName,
      input.email,
      input.phone,
      input.province,
      input.municipality,
      input.sector,
      input.volume,
      input.categories,
      input.message ?? null,
    ]
  );

  const row = result.rows[0];
  if (!row) throw new Error('A criação do pedido de orçamento não devolveu o registo.');
  return toQuoteRequest(row);
}

async function findAll(
  filters: QuoteRequestFilters,
  page: number,
  limit: number
): Promise<QuoteRequestListResult> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }
  if (filters.search) {
    const pattern = `%${escapeLike(filters.search)}%`;
    values.push(pattern, pattern, pattern);
    conditions.push(
      `(company_name ILIKE $${values.length - 2} ESCAPE '\\' OR contact_name ILIKE $${values.length - 1} ESCAPE '\\' OR email ILIKE $${values.length} ESCAPE '\\')`
    );
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM quote_request ${where}`,
    values
  );
  const total = Number(countResult.rows[0]?.total ?? 0);
  const offset = (page - 1) * limit;
  const result = await query<QuoteRequestRow>(
    `SELECT * FROM quote_request ${where}
     ORDER BY created_at DESC, id DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  return {
    data: result.rows.map(toQuoteRequest),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

async function updateStatus(
  id: string,
  input: UpdateQuoteRequestStatusInput
): Promise<QuoteRequest> {
  const result = await query<QuoteRequestRow>(
    'UPDATE quote_request SET status = $1 WHERE id = $2 RETURNING *',
    [input.status, id]
  );
  const row = result.rows[0];
  if (!row) throw new NotFoundError('Pedido de orçamento não encontrado.');
  return toQuoteRequest(row);
}

export const quoteRequestRepository = { create, findAll, updateStatus };

import { createHash } from 'node:crypto';

import { query } from '../database/pool';

export type IdempotencyStatus = 'in_progress' | 'completed' | 'failed';

export interface IdempotencyOperationRow {
  id: string;
  id_user: string;
  operation_type: string;
  idempotency_key: string;
  request_hash: string;
  response_payload: unknown;
  resource_type: string | null;
  resource_id: string | null;
  status: IdempotencyStatus;
  created_at: Date;
  updated_at: Date;
}

export interface IdempotencyOperation extends Omit<IdempotencyOperationRow, 'id_user' | 'operation_type' | 'idempotency_key' | 'request_hash' | 'response_payload' | 'resource_type' | 'resource_id' | 'created_at' | 'updated_at'> {
  userId: string;
  operationType: string;
  idempotencyKey: string;
  requestHash: string;
  responsePayload: unknown;
  resourceType: string | null;
  resourceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toOperation(row: IdempotencyOperationRow): IdempotencyOperation {
  return {
    id: row.id,
    userId: row.id_user,
    operationType: row.operation_type,
    idempotencyKey: row.idempotency_key,
    requestHash: row.request_hash,
    responsePayload: row.response_payload,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function normalizeIdempotencyKey(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;

  const headerValue = Array.isArray(value) ? value[0] ?? '' : value ?? '';
  const trimmed = headerValue.trim();
  if (!trimmed) return undefined;

  return trimmed;
}

export function hashRequest(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export async function getOperation(
  userId: string,
  operationType: string,
  idempotencyKey: string
): Promise<IdempotencyOperation | null> {
  const result = await query<IdempotencyOperationRow>(
    `SELECT id, id_user, operation_type, idempotency_key, request_hash, response_payload,
            resource_type, resource_id, status, created_at, updated_at
     FROM idempotency_operation
     WHERE id_user = $1 AND operation_type = $2 AND idempotency_key = $3`,
    [userId, operationType, idempotencyKey]
  );

  const row = result.rows[0];
  if (!row) return null;

  return toOperation(row);
}

export async function beginOperation(
  userId: string,
  operationType: string,
  idempotencyKey: string,
  requestHash: string
): Promise<IdempotencyOperation | null> {
  const result = await query<IdempotencyOperationRow>(
    `INSERT INTO idempotency_operation (id_user, operation_type, idempotency_key, request_hash, status)
     VALUES ($1, $2, $3, $4, 'in_progress')
     ON CONFLICT (id_user, operation_type, idempotency_key) DO UPDATE
     SET status = 'in_progress', updated_at = NOW()
     WHERE idempotency_operation.status = 'failed'
       AND idempotency_operation.request_hash = EXCLUDED.request_hash
     RETURNING id, id_user, operation_type, idempotency_key, request_hash, response_payload,
               resource_type, resource_id, status, created_at, updated_at`,
    [userId, operationType, idempotencyKey, requestHash]
  );

  const row = result.rows[0];
  return row ? toOperation(row) : null;
}

export async function completeOperation(
  id: string,
  resourceType: string,
  resourceId: string,
  responsePayload: unknown
): Promise<void> {
  await query(
    `UPDATE idempotency_operation
     SET status = 'completed',
         resource_type = $2,
         resource_id = $3,
         response_payload = $4::jsonb,
         updated_at = NOW()
     WHERE id = $1`,
    [id, resourceType, resourceId, JSON.stringify(responsePayload)]
  );
}

export async function failOperation(id: string): Promise<void> {
  await query(
    `UPDATE idempotency_operation
     SET status = 'failed', updated_at = NOW()
     WHERE id = $1`,
    [id]
  );
}

import { query } from '../database/pool';
import { Notification, NotificationRow, NotificationType } from '../types/notification.types';
import { PaginatedResult, PaginationParams } from '../types/pagination.types';

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.id_user,
    type: row.type,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

async function create(userId: string, type: NotificationType, message: string): Promise<void> {
  await query('INSERT INTO notification (id_user, type, message) VALUES ($1, $2, $3)', [
    userId,
    type,
    message,
  ]);
}

async function findAllByUser(
  userId: string,
  unreadOnly: boolean,
  pagination: PaginationParams
): Promise<PaginatedResult<Notification>> {
  const conditions = ['id_user = $1'];
  const values: unknown[] = [userId];
  if (unreadOnly) {
    conditions.push('is_read = false');
  }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM notification ${where}`,
    values
  );
  const total = countResult.rows[0]?.count ?? 0;
  const result = await query<NotificationRow>(
    `SELECT id, id_user, type, message, is_read, created_at
     FROM notification ${where}
     ORDER BY created_at DESC, id DESC
     LIMIT $2 OFFSET $3`,
    [userId, pagination.limit, (pagination.page - 1) * pagination.limit]
  );
  return {
    data: result.rows.map(toNotification),
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages: Math.ceil(total / pagination.limit),
  };
}

async function unreadCount(userId: string): Promise<number> {
  const result = await query<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM notification WHERE id_user = $1 AND is_read = false',
    [userId]
  );
  return result.rows[0]?.count ?? 0;
}

async function markRead(userId: string, id: string): Promise<boolean> {
  const result = await query(
    'UPDATE notification SET is_read = true WHERE id = $1 AND id_user = $2',
    [id, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

async function markAllRead(userId: string): Promise<number> {
  const result = await query(
    'UPDATE notification SET is_read = true WHERE id_user = $1 AND is_read = false',
    [userId]
  );
  return result.rowCount ?? 0;
}

export const notificationRepository = {
  create,
  findAllByUser,
  unreadCount,
  markRead,
  markAllRead,
};

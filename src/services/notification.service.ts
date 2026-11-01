import { notificationRepository } from '../repositories/notification.repository';
import { Notification, NotificationType } from '../types/notification.types';
import { PaginatedResult, PaginationParams } from '../types/pagination.types';

async function findAll(
  userId: string,
  unreadOnly: boolean,
  pagination: PaginationParams
): Promise<PaginatedResult<Notification>> {
  return notificationRepository.findAllByUser(userId, unreadOnly, pagination);
}

async function unreadCount(userId: string): Promise<number> {
  return notificationRepository.unreadCount(userId);
}

async function markRead(userId: string, id: string): Promise<boolean> {
  return notificationRepository.markRead(userId, id);
}

async function markAllRead(userId: string): Promise<number> {
  return notificationRepository.markAllRead(userId);
}

async function notify(userId: string, type: NotificationType, message: string): Promise<void> {
  await notificationRepository.create(userId, type, message);
}

export const notificationService = { findAll, unreadCount, markRead, markAllRead, notify };

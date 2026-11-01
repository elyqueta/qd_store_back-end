import { Request, Response } from 'express';
import { NotFoundError } from '../errors';
import { asyncHandler } from '../middlewares/asyncHandler';
import { notificationService } from '../services/notification.service';
import { ListNotificationsQuery, NotificationIdParam } from '../validators/notification.validator';

const findAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, unreadOnly } = req.query as unknown as ListNotificationsQuery;
  const result = await notificationService.findAll(req.user!.sub, unreadOnly, { page, limit });
  res.status(200).json({
    status: 'success',
    data: result.data,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationService.unreadCount(req.user!.sub);
  res.status(200).json({ status: 'success', data: { count } });
});

const markRead = asyncHandler(async (req: Request<NotificationIdParam>, res: Response) => {
  const updated = await notificationService.markRead(req.user!.sub, req.params.id);
  if (!updated) {
    throw new NotFoundError('Notificação não encontrada.');
  }
  res.status(200).json({ status: 'success', data: { updated: true } });
});

const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const updated = await notificationService.markAllRead(req.user!.sub);
  res.status(200).json({ status: 'success', data: { updated } });
});

export const notificationController = { findAll, unreadCount, markRead, markAllRead };

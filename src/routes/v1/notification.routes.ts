import { Router } from 'express';
import { notificationController } from '../../controllers/notification.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from '../../validators/notification.validator';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /api/v1/notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Conta notificações não lidas
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Contagem de notificações não lidas. }
 *       401: { description: Não autenticado. }
 */
router.get('/unread-count', notificationController.unreadCount);

/**
 * @openapi
 * /api/v1/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Marca todas as notificações como lidas
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Número de notificações actualizadas. }
 *       401: { description: Não autenticado. }
 */
router.patch('/read-all', notificationController.markAllRead);

/**
 * @openapi
 * /api/v1/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Lista notificações do utilizador autenticado
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, maximum: 100, default: 20 }
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean, default: false }
 *     responses:
 *       200: { description: Lista paginada de notificações. }
 *       401: { description: Não autenticado. }
 *       422: { description: Filtros inválidos. }
 */
router.get('/', validate({ query: listNotificationsQuerySchema }), notificationController.findAll);

/**
 * @openapi
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Marca uma notificação própria como lida
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Notificação marcada como lida. }
 *       401: { description: Não autenticado. }
 *       404: { description: Notificação não encontrada. }
 *       422: { description: Id inválido. }
 */
router.patch(
  '/:id/read',
  validate({ params: notificationIdParamSchema }),
  notificationController.markRead
);

export default router;

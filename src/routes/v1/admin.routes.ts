import { Router } from 'express';
import { adminController } from '../../controllers/admin.controller';
import { authenticate } from '../../middlewares/authenticate';
import { requireRole } from '../../middlewares/requireRole';
import { validate } from '../../middlewares/validate';
import {
  adminListOrdersQuerySchema,
  orderIdParamSchema,
  updateOrderStatusSchema,
} from '../../validators/order.validator';
import {
  adminConfirmPaymentSchema,
  adminRejectPaymentSchema,
  orderIdParamSchema as orderPaymentIdParamSchema,
  paymentIdParamSchema,
} from '../../validators/payment.validator';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Admin
 *   description: Endpoints restritos a administradores
 */

/**
 * @openapi
 * /api/v1/admin/companies:
 *   get:
 *     tags: [Admin]
 *     summary: Lista todas as empresas e os utilizadores vinculados a cada uma
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empresas com utilizadores vinculados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 count: { type: integer, example: 2 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/CompanyWithUsers' }
 *       401:
 *         description: Token de acesso ausente, inválido ou expirado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Utilizador autenticado, mas sem papel de administrador.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/companies', authenticate, requireRole('admin'), adminController.listCompanies);

/**
 * @openapi
 * /api/v1/admin/orders:
 *   get:
 *     tags: [Admin]
 *     summary: Lista encomendas para administração
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, maximum: 100, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [processing, in_transit, delivered, cancelled] }
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Lista paginada de encomendas. }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores. }
 *       422: { description: Filtros inválidos. }
 */
router.get(
  '/orders',
  authenticate,
  requireRole('admin'),
  validate({ query: adminListOrdersQuerySchema }),
  adminController.listOrders
);

/**
 * @openapi
 * /api/v1/admin/orders/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Obtém qualquer encomenda
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Encomenda completa. }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores. }
 *       404: { description: Encomenda não encontrada. }
 *       422: { description: Id inválido. }
 */
router.get(
  '/orders/:id',
  authenticate,
  requireRole('admin'),
  validate({ params: orderIdParamSchema }),
  adminController.findOrderById
);

/**
 * @openapi
 * /api/v1/admin/orders/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Actualiza o estado de uma encomenda
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateOrderStatusInput' }
 *     responses:
 *       200: { description: Estado actualizado. }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores. }
 *       404: { description: Encomenda não encontrada. }
 *       409: { description: Transição de estado inválida. }
 *       422: { description: Dados inválidos. }
 */
router.patch(
  '/orders/:id/status',
  authenticate,
  requireRole('admin'),
  validate({ params: orderIdParamSchema, body: updateOrderStatusSchema }),
  adminController.updateOrderStatus
);

/**
 * @openapi
 * /api/v1/admin/orders/{orderId}/payments:
 *   get:
 *     tags: [Admin]
 *     summary: Lista pagamentos de qualquer encomenda
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Histórico dos pagamentos. }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores. }
 *       404: { description: Encomenda não encontrada. }
 *       422: { description: Id inválido. }
 */
router.get(
  '/orders/:orderId/payments',
  authenticate,
  requireRole('admin'),
  validate({ params: orderPaymentIdParamSchema }),
  adminController.listOrderPayments
);

/**
 * @openapi
 * /api/v1/admin/payments/{paymentId}/confirm:
 *   post:
 *     tags: [Admin]
 *     summary: Confirma pagamento pendente manualmente
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AdminPaymentActionInput' }
 *     responses:
 *       200: { description: Pagamento confirmado. }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores ou confirmação automática do gateway. }
 *       404: { description: Pagamento não encontrado. }
 *       409: { description: Pagamento não está pendente. }
 *       422: { description: Id inválido. }
 */
router.post(
  '/payments/:paymentId/confirm',
  authenticate,
  requireRole('admin'),
  validate({ params: paymentIdParamSchema, body: adminConfirmPaymentSchema }),
  adminController.confirmPayment
);

/**
 * @openapi
 * /api/v1/admin/payments/{paymentId}/reject:
 *   post:
 *     tags: [Admin]
 *     summary: Rejeita pagamento pendente
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AdminPaymentActionInput' }
 *     responses:
 *       200: { description: Pagamento rejeitado. }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores. }
 *       404: { description: Pagamento não encontrado. }
 *       409: { description: Pagamento não está pendente. }
 *       422: { description: Id inválido. }
 */
router.post(
  '/payments/:paymentId/reject',
  authenticate,
  requireRole('admin'),
  validate({ params: paymentIdParamSchema, body: adminRejectPaymentSchema }),
  adminController.rejectPayment
);

export default router;

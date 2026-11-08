import { Router } from 'express';
import { quoteRequestController } from '../../controllers/quoteRequest.controller';
import { authenticate } from '../../middlewares/authenticate';
import { requireRole } from '../../middlewares/requireRole';
import { validate } from '../../middlewares/validate';
import {
  listQuoteRequestsQuerySchema,
  quoteRequestIdParamSchema,
  updateQuoteRequestStatusSchema,
} from '../../validators/quoteRequest.validator';

const router = Router();
router.use(authenticate, requireRole('admin'));

/**
 * @openapi
 * /api/v1/admin/quote-requests:
 *   get:
 *     tags: [Quote Requests]
 *     summary: Lista pedidos de orçamento para triagem
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: search, schema: { type: string, maxLength: 255 } }
 *       - { in: query, name: status, schema: { type: string, enum: [new, contacted, closed] } }
 *     responses:
 *       200: { description: Lista paginada de pedidos. }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores. }
 *       422: { description: Filtros inválidos. }
 */
router.get('/', validate({ query: listQuoteRequestsQuerySchema }), quoteRequestController.list);

/**
 * @openapi
 * /api/v1/admin/quote-requests/{id}/status:
 *   patch:
 *     tags: [Quote Requests]
 *     summary: Actualiza o estado de triagem de um pedido
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateQuoteRequestStatusInput' }
 *     responses:
 *       200: { description: Estado actualizado. }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores. }
 *       404: { description: Pedido não encontrado. }
 *       422: { description: UUID ou estado inválido. }
 */
router.patch(
  '/:id/status',
  validate({ params: quoteRequestIdParamSchema, body: updateQuoteRequestStatusSchema }),
  quoteRequestController.updateStatus
);

export default router;

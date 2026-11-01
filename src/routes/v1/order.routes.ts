import { Router } from 'express';
import { orderController } from '../../controllers/order.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import paymentRoutes from './payment.routes';
import {
  createOrderSchema,
  listOrdersQuerySchema,
  orderIdParamSchema,
} from '../../validators/order.validator';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /api/v1/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Cria uma encomenda a partir do carrinho
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateOrderInput' }
 *     responses:
 *       201: { description: Encomenda criada; o carrinho é esvaziado atomicamente. }
 *       400: { description: Carrinho vazio. }
 *       401: { description: Não autenticado. }
 *       404: { description: Endereço, entrega ou método não encontrado. }
 *       409: { description: Empresa ou produto indisponível. }
 *       422: { description: Dados inválidos. }
 */
router.post('/', validate({ body: createOrderSchema }), orderController.create);

/**
 * @openapi
 * /api/v1/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Lista as encomendas do utilizador autenticado
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
 *     responses:
 *       200: { description: Lista paginada das encomendas próprias. }
 *       401: { description: Não autenticado. }
 *       422: { description: Filtros inválidos. }
 */
router.get('/', validate({ query: listOrdersQuerySchema }), orderController.findAll);

/**
 * @openapi
 * /api/v1/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Obtém uma encomenda própria
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Encomenda completa. }
 *       401: { description: Não autenticado. }
 *       404: { description: Encomenda não encontrada. }
 *       422: { description: Id inválido. }
 */
router.get('/:id', validate({ params: orderIdParamSchema }), orderController.findById);

/**
 * @openapi
 * /api/v1/orders/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancela uma encomenda em processamento
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Encomenda cancelada. }
 *       401: { description: Não autenticado. }
 *       404: { description: Encomenda não encontrada. }
 *       409: { description: Estado da encomenda não permite cancelamento. }
 *       422: { description: Id inválido. }
 */
router.post('/:id/cancel', validate({ params: orderIdParamSchema }), orderController.cancel);

router.use('/:orderId/payments', paymentRoutes);

export default router;

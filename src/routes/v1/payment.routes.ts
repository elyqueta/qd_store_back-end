import { Router } from 'express';
import { paymentController } from '../../controllers/payment.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { createPaymentSchema, orderIdParamSchema } from '../../validators/payment.validator';

const router = Router({ mergeParams: true });
router.use(authenticate);

/**
 * @openapi
 * /api/v1/orders/{orderId}/payments:
 *   post:
 *     tags: [Payments]
 *     summary: Inicia um pagamento simulado para uma encomenda própria
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreatePaymentInput' }
 *     responses:
 *       201: { description: Pagamento iniciado, confirmado ou recusado pela simulação. }
 *       401: { description: Não autenticado. }
 *       404: { description: Encomenda não encontrada. }
 *       409: { description: Estado ou método incompatível; pagamento pendente/confirmado. }
 *       422: { description: Dados inválidos. }
 */
router.post(
  '/',
  validate({ params: orderIdParamSchema, body: createPaymentSchema }),
  paymentController.pay
);

/**
 * @openapi
 * /api/v1/orders/{orderId}/payments:
 *   get:
 *     tags: [Payments]
 *     summary: Lista as tentativas de pagamento de uma encomenda própria
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Histórico do pagamento, do mais recente para o mais antigo. }
 *       401: { description: Não autenticado. }
 *       404: { description: Encomenda não encontrada. }
 *       422: { description: Id inválido. }
 */
router.get('/', validate({ params: orderIdParamSchema }), paymentController.findAllByOrder);

export default router;

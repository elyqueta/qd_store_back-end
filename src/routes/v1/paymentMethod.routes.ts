import { Router } from 'express';
import { paymentMethodController } from '../../controllers/paymentMethod.controller';
import { authenticate } from '../../middlewares/authenticate';
import { requireAdmin } from '../../middlewares/requireAdmin';
import { validate } from '../../middlewares/validate';
import {
  createPaymentMethodSchema,
  paymentMethodIdParamSchema,
  updatePaymentMethodSchema,
} from '../../validators/paymentMethod.validator';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Payment Methods
 *   description: Gestão dos métodos de pagamento
 */

/**
 * @openapi
 * /api/v1/payment-methods:
 *   post:
 *     tags: [Payment Methods]
 *     summary: Cria um método de pagamento (apenas administradores)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentMethodInput'
 *     responses:
 *       201:
 *         description: Método de pagamento criado com sucesso.
 *       401:
 *         description: Token de acesso ausente, inválido ou expirado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Utilizador autenticado, mas sem papel de administrador.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Dados inválidos.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate({ body: createPaymentMethodSchema }),
  paymentMethodController.create
);

/**
 * @openapi
 * /api/v1/payment-methods:
 *   get:
 *     tags: [Payment Methods]
 *     summary: Lista os métodos de pagamento activos (público)
 *     responses:
 *       200:
 *         description: Lista de métodos de pagamento activos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 count: { type: integer, example: 3 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/PaymentMethod' }
 */
router.get('/', paymentMethodController.findAll);

/**
 * @openapi
 * /api/v1/payment-methods/{id}:
 *   get:
 *     tags: [Payment Methods]
 *     summary: Busca um método de pagamento pelo id (público)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Método de pagamento encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/PaymentMethod' }
 *       404:
 *         description: Método de pagamento não encontrado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Id inválido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get(
  '/:id',
  validate({ params: paymentMethodIdParamSchema }),
  paymentMethodController.findById
);

/**
 * @openapi
 * /api/v1/payment-methods/{id}:
 *   patch:
 *     tags: [Payment Methods]
 *     summary: Actualiza parcialmente um método de pagamento (apenas administradores)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePaymentMethodInput'
 *     responses:
 *       200:
 *         description: Método de pagamento actualizado.
 *       401:
 *         description: Token de acesso ausente, inválido ou expirado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Utilizador autenticado, mas sem papel de administrador.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Método de pagamento não encontrado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Dados inválidos, id inválido ou payload vazio.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ params: paymentMethodIdParamSchema, body: updatePaymentMethodSchema }),
  paymentMethodController.update
);

/**
 * @openapi
 * /api/v1/payment-methods/{id}:
 *   delete:
 *     tags: [Payment Methods]
 *     summary: Desactiva um método de pagamento (apenas administradores)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Método de pagamento desactivado com sucesso (sem conteúdo).
 *       401:
 *         description: Token de acesso ausente, inválido ou expirado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Utilizador autenticado, mas sem papel de administrador.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Método de pagamento não encontrado ou já inactivo.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Id inválido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ params: paymentMethodIdParamSchema }),
  paymentMethodController.remove
);

export default router;

import { Router } from 'express';
import { deliveryTypeController } from '../controllers/deliveryType.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import {
  createDeliveryTypeSchema,
  deliveryTypeIdParamSchema,
  updateDeliveryTypeSchema,
} from '../validators/deliveryType.validator';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Delivery Types
 *   description: Gestão dos tipos de entrega
 */

/**
 * @openapi
 * /api/delivery-types:
 *   post:
 *     tags: [Delivery Types]
 *     summary: Cria um tipo de entrega (apenas administradores)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDeliveryTypeInput'
 *     responses:
 *       201:
 *         description: Tipo de entrega criado com sucesso.
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
  validate({ body: createDeliveryTypeSchema }),
  deliveryTypeController.create
);

/**
 * @openapi
 * /api/delivery-types:
 *   get:
 *     tags: [Delivery Types]
 *     summary: Lista os tipos de entrega activos (público)
 *     responses:
 *       200:
 *         description: Lista de tipos de entrega activos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 count: { type: integer, example: 4 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/DeliveryType' }
 */
router.get('/', deliveryTypeController.findAll);

/**
 * @openapi
 * /api/delivery-types/{id}:
 *   get:
 *     tags: [Delivery Types]
 *     summary: Busca um tipo de entrega pelo id (público)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tipo de entrega encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/DeliveryType' }
 *       404:
 *         description: Tipo de entrega não encontrado.
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
  validate({ params: deliveryTypeIdParamSchema }),
  deliveryTypeController.findById
);

/**
 * @openapi
 * /api/delivery-types/{id}:
 *   patch:
 *     tags: [Delivery Types]
 *     summary: Atualiza parcialmente um tipo de entrega (apenas administradores)
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
 *             $ref: '#/components/schemas/UpdateDeliveryTypeInput'
 *     responses:
 *       200:
 *         description: Tipo de entrega atualizado.
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
 *         description: Tipo de entrega não encontrado.
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
  validate({ params: deliveryTypeIdParamSchema, body: updateDeliveryTypeSchema }),
  deliveryTypeController.update
);

/**
 * @openapi
 * /api/delivery-types/{id}:
 *   delete:
 *     tags: [Delivery Types]
 *     summary: Desactiva um tipo de entrega (apenas administradores)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Tipo de entrega desactivado com sucesso (sem conteúdo).
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
 *         description: Tipo de entrega não encontrado ou já inactivo.
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
  validate({ params: deliveryTypeIdParamSchema }),
  deliveryTypeController.remove
);

export default router;

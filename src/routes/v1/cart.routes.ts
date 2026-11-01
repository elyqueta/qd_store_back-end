import { Router } from 'express';
import { cartController } from '../../controllers/cart.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import {
  addCartItemSchema,
  cartItemIdParamSchema,
  updateCartItemSchema,
} from '../../validators/cart.validator';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /api/v1/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Obtém o carrinho do utilizador autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Carrinho atual.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/Cart' }
 *       401: { description: Não autenticado. }
 */
router.get('/', cartController.getCart);

/**
 * @openapi
 * /api/v1/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Adiciona produto ao carrinho, somando quantidade quando já existe
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AddCartItemInput' }
 *     responses:
 *       201: { description: Item adicionado. }
 *       401: { description: Não autenticado. }
 *       404: { description: Produto não encontrado. }
 *       409: { description: Produto indisponível. }
 *       422: { description: Dados inválidos. }
 */
router.post('/items', validate({ body: addCartItemSchema }), cartController.addItem);

/**
 * @openapi
 * /api/v1/cart/items/{itemId}:
 *   patch:
 *     tags: [Cart]
 *     summary: Define a quantidade de um item do carrinho
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateCartItemInput' }
 *     responses:
 *       200: { description: Carrinho atualizado. }
 *       401: { description: Não autenticado. }
 *       404: { description: Item não encontrado. }
 *       422: { description: Dados inválidos. }
 */
router.patch(
  '/items/:itemId',
  validate({ params: cartItemIdParamSchema, body: updateCartItemSchema }),
  cartController.updateItem
);

/**
 * @openapi
 * /api/v1/cart/items/{itemId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove um item do carrinho
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Item removido. }
 *       401: { description: Não autenticado. }
 *       404: { description: Item não encontrado. }
 *       422: { description: Id inválido. }
 */
router.delete(
  '/items/:itemId',
  validate({ params: cartItemIdParamSchema }),
  cartController.removeItem
);

/**
 * @openapi
 * /api/v1/cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Esvazia o carrinho
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Carrinho esvaziado. }
 *       401: { description: Não autenticado. }
 */
router.delete('/', cartController.clear);

export default router;

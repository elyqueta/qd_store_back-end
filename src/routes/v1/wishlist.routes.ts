import { Router } from 'express';
import { wishlistController } from '../../controllers/wishlist.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import {
  addWishlistItemSchema,
  wishlistProductIdParamSchema,
} from '../../validators/wishlist.validator';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /api/v1/wishlist:
 *   get:
 *     tags: [Wishlist]
 *     summary: Lista a wishlist do utilizador autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Produtos guardados, do mais recente para o mais antigo. }
 *       401: { description: Não autenticado. }
 */
router.get('/', wishlistController.findAll);

/**
 * @openapi
 * /api/v1/wishlist:
 *   post:
 *     tags: [Wishlist]
 *     summary: Adiciona produto à wishlist de forma idempotente
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AddWishlistItemInput' }
 *     responses:
 *       200: { description: Produto já estava guardado. }
 *       201: { description: Produto guardado. }
 *       401: { description: Não autenticado. }
 *       404: { description: Produto não encontrado. }
 *       422: { description: Dados inválidos. }
 */
router.post('/', validate({ body: addWishlistItemSchema }), wishlistController.add);

/**
 * @openapi
 * /api/v1/wishlist/{productId}:
 *   delete:
 *     tags: [Wishlist]
 *     summary: Remove produto da wishlist (idempotente)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Produto removido ou não estava guardado. }
 *       401: { description: Não autenticado. }
 *       422: { description: Id inválido. }
 */
router.delete(
  '/:productId',
  validate({ params: wishlistProductIdParamSchema }),
  wishlistController.remove
);

export default router;

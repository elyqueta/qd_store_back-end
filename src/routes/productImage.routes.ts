import { Router } from 'express';
import { productImageController } from '../controllers/productImage.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import {
  createProductImageSchema,
  productIdOnlyParamSchema,
  productImageParamSchema,
  updateProductImageSchema,
} from '../validators/productImage.validator';

/** mergeParams: true — mesmo motivo já documentado em userCompany.routes.ts. */
const router = Router({ mergeParams: true });

/**
 * @openapi
 * tags:
 *   name: Product Images
 *   description: Imagens associadas a um produto
 */

/**
 * @openapi
 * /api/products/{productId}/images:
 *   post:
 *     tags: [Product Images]
 *     summary: 'Adiciona uma imagem a um produto (apenas administradores)'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductImageInput'
 *     responses:
 *       201:
 *         description: Imagem criada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/ProductImage' }
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
 *       404:
 *         description: Produto não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Dados inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate({ params: productIdOnlyParamSchema, body: createProductImageSchema }),
  productImageController.create
);

/**
 * @openapi
 * /api/products/{productId}/images:
 *   get:
 *     tags: [Product Images]
 *     summary: 'Lista as imagens de um produto, ordenadas por displayOrder (público)'
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lista de imagens.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 count: { type: integer, example: 3 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProductImage' }
 *       404:
 *         description: Produto não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', validate({ params: productIdOnlyParamSchema }), productImageController.findAll);

/**
 * @openapi
 * /api/products/{productId}/images/{id}:
 *   patch:
 *     tags: [Product Images]
 *     summary: 'Atualiza uma imagem (apenas administradores)'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductImageInput'
 *     responses:
 *       200:
 *         description: Imagem atualizada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/ProductImage' }
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
 *       404:
 *         description: Imagem não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Dados inválidos ou payload vazio.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ params: productImageParamSchema, body: updateProductImageSchema }),
  productImageController.update
);

/**
 * @openapi
 * /api/products/{productId}/images/{id}:
 *   delete:
 *     tags: [Product Images]
 *     summary: 'Remove uma imagem (apenas administradores)'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Imagem removida com sucesso (sem conteúdo).
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
 *       404:
 *         description: Imagem não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ params: productImageParamSchema }),
  productImageController.remove
);

export default router;

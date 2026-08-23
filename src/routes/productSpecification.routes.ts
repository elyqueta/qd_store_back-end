import { Router } from 'express';
import { productSpecificationController } from '../controllers/productSpecification.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import {
  createProductSpecificationSchema,
  productIdOnlyParamSchema,
  productSpecificationParamSchema,
  updateProductSpecificationSchema,
} from '../validators/productSpecification.validator';

const router = Router({ mergeParams: true });

/**
 * @openapi
 * tags:
 *   name: Product Specifications
 *   description: Especificações técnicas (chave/valor) associadas a um produto
 */

/**
 * @openapi
 * /api/products/{productId}/specifications:
 *   post:
 *     tags: [Product Specifications]
 *     summary: 'Adiciona uma especificação a um produto (apenas administradores)'
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
 *             $ref: '#/components/schemas/CreateProductSpecificationInput'
 *     responses:
 *       201:
 *         description: Especificação criada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/ProductSpecification' }
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
  validate({ params: productIdOnlyParamSchema, body: createProductSpecificationSchema }),
  productSpecificationController.create
);

/**
 * @openapi
 * /api/products/{productId}/specifications:
 *   get:
 *     tags: [Product Specifications]
 *     summary: 'Lista as especificações de um produto (público)'
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lista de especificações.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 count: { type: integer, example: 5 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProductSpecification' }
 *       404:
 *         description: Produto não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/',
  validate({ params: productIdOnlyParamSchema }),
  productSpecificationController.findAll
);

/**
 * @openapi
 * /api/products/{productId}/specifications/{id}:
 *   patch:
 *     tags: [Product Specifications]
 *     summary: 'Atualiza uma especificação (apenas administradores)'
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
 *             $ref: '#/components/schemas/UpdateProductSpecificationInput'
 *     responses:
 *       200:
 *         description: Especificação atualizada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/ProductSpecification' }
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
 *         description: Especificação não encontrada.
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
  validate({ params: productSpecificationParamSchema, body: updateProductSpecificationSchema }),
  productSpecificationController.update
);

/**
 * @openapi
 * /api/products/{productId}/specifications/{id}:
 *   delete:
 *     tags: [Product Specifications]
 *     summary: 'Remove uma especificação (apenas administradores)'
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
 *         description: Especificação removida com sucesso (sem conteúdo).
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
 *         description: Especificação não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ params: productSpecificationParamSchema }),
  productSpecificationController.remove
);

export default router;

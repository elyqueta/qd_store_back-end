import { Router } from 'express';
import { productController } from '../../controllers/product.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { requireAdmin } from '../../middlewares/requireAdmin';
import { publicReadCache } from '../../middlewares/apiCachePolicy';
import { uploadProductImage } from '../../middlewares/productImageUpload';
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  productDetailQuerySchema,
  updateProductSchema,
} from '../../validators/product.validator';
import productImageRoutes from './productImage.routes';
import productSpecificationRoutes from './productSpecification.routes';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Products
 *   description: Catálogo de produtos
 */

/**
 * @openapi
 * /api/v1/products:
 *   post:
 *     tags: [Products]
 *     summary: Cria um novo produto (apenas administradores)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductInput'
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [categoryId, name, price]
 *             properties:
 *               categoryId: { type: string, format: uuid }
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               originalPrice: { type: number }
 *               badge: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Produto criado com sucesso. Se `image` for enviada, é enviada ao Cloudinary e associada como imagem principal.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/Product' }
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
 *         description: Categoria não encontrada.
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
  uploadProductImage,
  validate({ body: createProductSchema }),
  productController.create
);

/**
 * @openapi
 * /api/v1/products:
 *   get:
 *     tags: [Products]
 *     summary: Lista produtos paginados, com filtros opcionais (público)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, out_of_stock] }
 *       - in: query
 *         name: search
 *         description: Pesquisa parcial no nome e descrição.
 *         schema: { type: string, maxLength: 200 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [createdAt_desc, createdAt_asc, name_asc, name_desc, price_asc, price_desc], default: createdAt_desc }
 *       - in: query
 *         name: priceMin
 *         schema: { type: number, minimum: 0 }
 *       - in: query
 *         name: priceMax
 *         schema: { type: number, minimum: 0 }
 *       - in: query
 *         name: availableOnly
 *         description: Filtra produtos com status active; o modelo actual não tem stock quantitativo.
 *         schema: { type: boolean }
 *       - in: query
 *         name: excludeId
 *         description: Exclui um produto (por exemplo, o produto da página de detalhe).
 *         schema: { type: string, format: uuid }
 *     description: Cada produto inclui `mainImage` (a imagem com menor `displayOrder`) ou `null` se ainda não tiver imagem.
 *     responses:
 *       200:
 *         description: Lista paginada de produtos; paginação inclui page, limit, total, totalPages e aliases currentPage, totalItems e hasNextPage.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Product' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get('/', publicReadCache, validate({ query: listProductsQuerySchema }), productController.findAll);

/**
 * @openapi
 * /api/v1/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Busca um produto pelo id (público)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: include
 *         description: Includes opcionais separados por vírgula; propriedades não pedidas não são adicionadas.
 *         schema: { type: string, enum: [images, specifications, 'images,specifications'] }
 *         example: images,specifications
 *     responses:
 *       200:
 *         description: Produto encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/ProductDetails' }
 *       404:
 *         description: Produto não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/:id',
  publicReadCache,
  validate({ params: productIdParamSchema, query: productDetailQuerySchema }),
  productController.findById
);

/**
 * @openapi
 * /api/v1/products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Atualiza parcialmente um produto (apenas administradores)
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
 *             $ref: '#/components/schemas/UpdateProductInput'
 *     responses:
 *       200:
 *         description: Produto atualizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/Product' }
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
 *         description: Produto ou categoria não encontrados.
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
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  productController.update
);

/**
 * @openapi
 * /api/v1/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Remove um produto (apenas administradores)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Produto removido com sucesso (sem conteúdo).
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
 *       409:
 *         description: Produto referenciado por carrinhos ou pedidos existentes.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ params: productIdParamSchema }),
  productController.remove
);

router.use('/:productId/images', productImageRoutes);
router.use('/:productId/specifications', productSpecificationRoutes);

export default router;

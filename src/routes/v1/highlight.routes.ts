import { Router } from 'express';
import { highlightController } from '../../controllers/highlight.controller';
import { authenticate } from '../../middlewares/authenticate';
import { requireRole } from '../../middlewares/requireRole';
import { uploadImageFile } from '../../middlewares/productImageUpload';
import { validate } from '../../middlewares/validate';
import { publicReadCache } from '../../middlewares/apiCachePolicy';
import {
  createHighlightSchema, highlightIdParamSchema, listHighlightsQuerySchema,
  reorderHighlightsSchema, updateHighlightSchema,
} from '../../validators/highlight.validator';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Highlights
 *   description: Destaques configuráveis da Home
 */
router.get('/', publicReadCache, validate({ query: listHighlightsQuerySchema }), highlightController.list);
/**
 * @openapi
 * /api/v1/highlights:
 *   get:
 *     tags: [Highlights]
 *     summary: Lista destaques activos dentro da janela temporal
 *     parameters:
 *       - in: query
 *         name: placement
 *         schema: { type: string, enum: [hero, showcase, category_block] }
 *     responses:
 *       200:
 *         description: Destaques públicos ordenados por displayOrder.
 */
/**
 * @openapi
 * /api/v1/highlights/admin:
 *   get:
 *     tags: [Highlights]
 *     summary: Lista todos os destaques para o back-office
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista administrativa de destaques. }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores. }
 */
router.get('/admin', authenticate, requireRole('admin'), validate({ query: listHighlightsQuerySchema }), highlightController.listAdmin);
/**
 * @openapi
 * /api/v1/highlights/reorder:
 *   patch:
 *     tags: [Highlights]
 *     summary: Reordena destaques numa transacção
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReorderHighlightsInput' }
 *     responses:
 *       204: { description: Ordem actualizada. }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores. }
 */
router.patch('/reorder', authenticate, requireRole('admin'), validate({ body: reorderHighlightsSchema }), highlightController.reorder);
/**
 * @openapi
 * /api/v1/highlights:
 *   post:
 *     tags: [Highlights]
 *     summary: Cria um destaque com imagem de produto ou upload editorial
 *     description: Com productId, a API usa automaticamente a imagem principal do produto activo. Sem productId, é obrigatório enviar uma imagem no campo image.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { $ref: '#/components/schemas/CreateHighlightInput' }
 *     responses:
 *       201: { description: Destaque criado. }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores. }
 *       422: { description: Dados ou imagem inválidos. }
 */
router.post('/', authenticate, requireRole('admin'), uploadImageFile('image'), validate({ body: createHighlightSchema }), highlightController.create);
router.patch('/:id', authenticate, requireRole('admin'), uploadImageFile('image'), validate({ params: highlightIdParamSchema, body: updateHighlightSchema }), highlightController.update);
/**
 * @openapi
 * /api/v1/highlights/{id}/permanent:
 *   delete:
 *     tags: [Highlights]
 *     summary: Elimina definitivamente um destaque
 *     description: Remove o destaque e agenda a remoção da sua imagem editorial do Cloudinary. A imagem de um produto associado não é removida.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Destaque eliminado. }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores. }
 *       404: { description: Destaque não encontrado. }
 */
router.delete('/:id/permanent', authenticate, requireRole('admin'), validate({ params: highlightIdParamSchema }), highlightController.permanentlyRemove);
router.delete('/:id', authenticate, requireRole('admin'), validate({ params: highlightIdParamSchema }), highlightController.remove);
export default router;

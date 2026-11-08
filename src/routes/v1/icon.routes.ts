import { Router } from 'express';
import { publicReferenceCache } from '../../middlewares/apiCachePolicy';
import { iconController } from '../../controllers/icon.controller';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Icons
 *   description: Catálogo estático de ícones Font Awesome disponíveis
 */

/**
 * @openapi
 * /api/v1/icons:
 *   get:
 *     tags: [Icons]
 *     summary: Lista os ícones Font Awesome disponíveis
 *     responses:
 *       200:
 *         description: Catálogo de ícones para selecção no back-office.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 count: { type: integer, example: 16 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/IconCatalogEntry' }
 */
router.get('/', publicReferenceCache, iconController.list);

export default router;

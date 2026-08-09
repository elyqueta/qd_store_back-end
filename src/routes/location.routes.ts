import { Router } from 'express';
import { locationController } from '../controllers/location.controller';
import { validate } from '../middlewares/validate';
import { provinceSlugParamSchema } from '../validators/location.validator';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Locations
 *   description: Consulta de províncias e municípios de Angola (dado de referência, público)
 */

/**
 * @openapi
 * /api/locations:
 *   get:
 *     tags: [Locations]
 *     summary: Lista todas as 21 províncias, cada uma já com os seus municípios
 *     description: >
 *       Pensado para o front-end carregar UMA VEZ (ex: no bootstrap
 *       da aplicação) e montar toda a cascata província -> município
 *       localmente, sem chamadas de rede adicionais.
 *     responses:
 *       200:
 *         description: Lista completa de províncias com municípios.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 count: { type: integer, example: 21 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProvinceWithMunicipalities' }
 */
router.get('/', locationController.listAll);

/**
 * @openapi
 * /api/locations/provinces:
 *   get:
 *     tags: [Locations]
 *     summary: Lista as 21 províncias (sem os municípios)
 *     description: >
 *       Útil quando o consumidor só precisa da lista de províncias,
 *       sem o peso adicional de carregar todos os municípios.
 *     responses:
 *       200:
 *         description: Lista de províncias.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 count: { type: integer, example: 21 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Province' }
 */
router.get('/provinces', locationController.listProvinces);

/**
 * @openapi
 * /api/locations/provinces/{province}/municipalities:
 *   get:
 *     tags: [Locations]
 *     summary: Lista os municípios de uma província específica
 *     parameters:
 *       - in: path
 *         name: province
 *         required: true
 *         description: 'Slug da província, conforme devolvido por GET /api/locations/provinces (ex: "icolo-e-bengo").'
 *         schema: { type: string, example: 'luanda' }
 *     responses:
 *       200:
 *         description: Lista de municípios da província.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 count: { type: integer, example: 16 }
 *                 data:
 *                   type: array
 *                   items: { type: string }
 *                   example: ['Belas', 'Cacuaco', 'Cazenga', 'Talatona', 'Viana']
 *       404:
 *         description: Nenhuma província encontrada com este slug.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/provinces/:province/municipalities',
  validate({ params: provinceSlugParamSchema }),
  locationController.listMunicipalities
);

export default router;

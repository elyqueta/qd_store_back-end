import { Router } from 'express';
import { companyController } from '../controllers/company.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import {
  companyIdParamSchema,
  createCompanySchema,
  updateCompanySchema,
} from '../validators/company.validator';
import userCompanyRoutes from './userCompany.routes';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Companies
 *   description: Gestão de contas empresariais (B2B)
 */

/**
 * Todas as rotas de empresa exigem autenticação: diferente de
 * CATEGORY (dado público de catálogo), COMPANY é informação de conta
 * — ninguém deve conseguir listar ou consultar empresas sem estar
 * autenticado.
 */
router.use(authenticate);

/**
 * @openapi
 * /api/companies:
 *   post:
 *     tags: [Companies]
 *     summary: Regista uma nova empresa (conta B2B)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCompanyInput'
 *     responses:
 *       201:
 *         description: Empresa criada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/Company' }
 *       401:
 *         description: Não autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Já existe uma empresa com este NIF.
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
router.post('/', validate({ body: createCompanySchema }), companyController.create);

/**
 * @openapi
 * /api/companies:
 *   get:
 *     tags: [Companies]
 *     summary: Lista todas as empresas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empresas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 count: { type: integer, example: 2 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Company' }
 */
router.get('/', companyController.findAll);

/**
 * @openapi
 * /api/companies/{id}:
 *   get:
 *     tags: [Companies]
 *     summary: Busca uma empresa pelo id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Empresa encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/Company' }
 *       404:
 *         description: Empresa não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', validate({ params: companyIdParamSchema }), companyController.findById);

/**
 * @openapi
 * /api/companies/{id}:
 *   patch:
 *     tags: [Companies]
 *     summary: Atualiza parcialmente uma empresa
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
 *             $ref: '#/components/schemas/UpdateCompanyInput'
 *     responses:
 *       200:
 *         description: Empresa atualizada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/Company' }
 *       404:
 *         description: Empresa não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: NIF já usado por outra empresa.
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
  validate({ params: companyIdParamSchema, body: updateCompanySchema }),
  companyController.update
);

/**
 * @openapi
 * /api/companies/{id}:
 *   delete:
 *     tags: [Companies]
 *     summary: Desativa uma empresa (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Empresa desativada com sucesso (sem conteúdo).
 *       404:
 *         description: Empresa não encontrada ou já inactiva.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', validate({ params: companyIdParamSchema }), companyController.remove);

/**
 * Rotas aninhadas: /api/companies/:companyId/users/...
 * Gestão da associação N:N entre utilizadores e esta empresa.
 */
router.use('/:companyId/users', userCompanyRoutes);

export default router;

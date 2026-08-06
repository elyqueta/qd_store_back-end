// src/routes/userCompany.routes.ts
import { Router } from 'express';
import { userCompanyController } from '../controllers/userCompany.controller';
import { validate } from '../middlewares/validate';
import {
  companyIdParamOnlySchema,
  createUserCompanySchema,
  updateUserCompanySchema,
  userCompanyParamSchema,
} from '../validators/userCompany.validator';

/**
 * mergeParams: true é obrigatório aqui — sem isso, este router (montado
 * em /api/companies/:companyId/users) NÃO enxergaria o :companyId
 * capturado pelo router pai (company.routes.ts). Cada router do Express
 * tem o seu próprio req.params por padrão; mergeParams funde os dois.
 */
const router = Router({ mergeParams: true });

/**
 * @openapi
 * tags:
 *   name: Company Users
 *   description: Associação entre utilizadores e empresas (contas B2B)
 */

/**
 * @openapi
 * /api/companies/{companyId}/users:
 *   post:
 *     tags: [Company Users]
 *     summary: Associa um utilizador a uma empresa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserCompanyInput'
 *     responses:
 *       201:
 *         description: Associação criada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/UserCompany' }
 *       404:
 *         description: Empresa ou utilizador não encontrados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Utilizador já associado a esta empresa.
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
  validate({ params: companyIdParamOnlySchema, body: createUserCompanySchema }),
  userCompanyController.associate
);

/**
 * @openapi
 * /api/companies/{companyId}/users:
 *   get:
 *     tags: [Company Users]
 *     summary: Lista os utilizadores associados a uma empresa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lista de associações.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 count: { type: integer, example: 2 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/UserCompany' }
 *       404:
 *         description: Empresa não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', validate({ params: companyIdParamOnlySchema }), userCompanyController.findAll);

/**
 * @openapi
 * /api/companies/{companyId}/users/{userId}:
 *   patch:
 *     tags: [Company Users]
 *     summary: Atualiza o cargo (role) de um utilizador numa empresa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserCompanyInput'
 *     responses:
 *       200:
 *         description: Associação atualizada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/UserCompany' }
 *       404:
 *         description: Associação não encontrada.
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
router.patch(
  '/:userId',
  validate({ params: userCompanyParamSchema, body: updateUserCompanySchema }),
  userCompanyController.update
);

/**
 * @openapi
 * /api/companies/{companyId}/users/{userId}:
 *   delete:
 *     tags: [Company Users]
 *     summary: Remove a associação entre um utilizador e uma empresa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Associação removida com sucesso (sem conteúdo).
 *       404:
 *         description: Associação não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:userId',
  validate({ params: userCompanyParamSchema }),
  userCompanyController.remove
);

export default router;

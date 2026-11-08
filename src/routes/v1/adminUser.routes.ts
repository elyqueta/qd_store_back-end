import { Router } from 'express';
import { adminUserController } from '../../controllers/adminUser.controller';
import { authenticate } from '../../middlewares/authenticate';
import { requireRole } from '../../middlewares/requireRole';
import { validate } from '../../middlewares/validate';
import {
  adminListUsersQuerySchema,
  adminUserIdParamSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from '../../validators/adminUser.validator';

const router = Router();

router.use(authenticate, requireRole('admin'));

/**
 * @openapi
 * /api/v1/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Lista utilizadores para o back-office
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: search, schema: { type: string, maxLength: 255 } }
 *       - { in: query, name: role, schema: { type: string, enum: [customer, admin] } }
 *       - { in: query, name: status, schema: { type: string, enum: [active, inactive, banned] } }
 *       - { in: query, name: accountType, schema: { type: string, enum: [personal, business] } }
 *       - { in: query, name: sort, schema: { type: string, enum: [createdAt, name, email, status] } }
 *     responses:
 *       200:
 *         description: Lista paginada sem password_hash.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { type: array, items: { $ref: '#/components/schemas/AdminUser' } }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores. }
 *       422: { description: Filtros inválidos. }
 */
router.get('/', validate({ query: adminListUsersQuerySchema }), adminUserController.list);

/**
 * @openapi
 * /api/v1/admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Obtém um utilizador e as empresas associadas
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Detalhe sem password_hash.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/AdminUser' }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores. }
 *       404: { description: Utilizador não encontrado. }
 *       422: { description: UUID inválido. }
 */
router.get('/:id', validate({ params: adminUserIdParamSchema }), adminUserController.findById);

/**
 * @openapi
 * /api/v1/admin/users/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Altera o estado de um utilizador
 *     description: Ao inactivar ou banir, remove as sessões de refresh. Access tokens emitidos anteriormente podem continuar válidos até expirarem (até 15 minutos).
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateAdminUserStatusInput' }
 *     responses:
 *       200: { description: Estado actualizado; resposta sem password_hash. }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores. }
 *       404: { description: Utilizador não encontrado. }
 *       409: { description: Auto-desactivação ou tentativa de remover o último administrador activo. }
 *       422: { description: UUID ou estado inválido. }
 */
router.patch(
  '/:id/status',
  validate({ params: adminUserIdParamSchema, body: updateUserStatusSchema }),
  adminUserController.updateStatus
);

/**
 * @openapi
 * /api/v1/admin/users/{id}/role:
 *   patch:
 *     tags: [Admin]
 *     summary: Altera o papel de plataforma de um utilizador
 *     description: Access tokens anteriormente emitidos podem manter o papel anterior até expirarem (até 15 minutos).
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateAdminUserRoleInput' }
 *     responses:
 *       200: { description: Papel actualizado; resposta sem password_hash. }
 *       401: { description: Não autenticado. }
 *       403: { description: Apenas administradores. }
 *       404: { description: Utilizador não encontrado. }
 *       409: { description: Auto-revogação ou tentativa de remover o último administrador activo. }
 *       422: { description: UUID ou papel inválido. }
 */
router.patch(
  '/:id/role',
  validate({ params: adminUserIdParamSchema, body: updateUserRoleSchema }),
  adminUserController.updateRole
);

export default router;

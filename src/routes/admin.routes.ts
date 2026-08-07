import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Admin
 *   description: Endpoints restritos a administradores
 */

/**
 * @openapi
 * /api/admin/companies:
 *   get:
 *     tags: [Admin]
 *     summary: Lista todas as empresas e os utilizadores vinculados a cada uma
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empresas com utilizadores vinculados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 count: { type: integer, example: 2 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/CompanyWithUsers' }
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
 */
router.get('/companies', authenticate, requireRole('admin'), adminController.listCompanies);

export default router;

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { uploadImageFile } from '../../middlewares/productImageUpload';
import { validate } from '../../middlewares/validate';
import { userProfileController } from '../../controllers/userProfile.controller';
import { updateUserProfileSchema } from '../../validators/userProfile.validator';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Obtém o perfil do utilizador autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Perfil sem password_hash. }
 *       401: { description: Não autenticado. }
 */
router.get('/me', userProfileController.get);

/**
 * @openapi
 * /api/v1/users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Actualiza o perfil e pode trocar a foto
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserProfileInput'
 *     responses:
 *       200: { description: Perfil actualizado. }
 *       401: { description: Não autenticado ou password actual incorrecta. }
 *       409: { description: Email já utilizado. }
 *       422: { description: Dados ou imagem inválidos. }
 */
router.patch(
  '/me',
  uploadImageFile('photo'),
  validate({ body: updateUserProfileSchema }),
  userProfileController.update
);

/**
 * @openapi
 * /api/v1/users/me/photo:
 *   delete:
 *     tags: [Users]
 *     summary: Remove a foto de perfil
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Foto removida. }
 *       401: { description: Não autenticado. }
 */
router.delete('/me/photo', userProfileController.removePhoto);

export default router;

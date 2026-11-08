import { Router } from 'express';
import { serviceController } from '../../controllers/service.controller';
import { authenticate } from '../../middlewares/authenticate';
import { publicReadCache } from '../../middlewares/apiCachePolicy';
import { requireRole } from '../../middlewares/requireRole';
import { uploadImageFile } from '../../middlewares/productImageUpload';
import { validate } from '../../middlewares/validate';
import {
  createServiceSchema,
  listServicesQuerySchema,
  publicListServicesQuerySchema,
  serviceIdParamSchema,
  updateServiceSchema,
} from '../../validators/service.validator';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Services
 *   description: Serviços da QD Store
 */
router.get(
  '/',
  publicReadCache,
  validate({ query: publicListServicesQuerySchema }),
  serviceController.list
);
router.get(
  '/admin',
  authenticate,
  requireRole('admin'),
  validate({ query: listServicesQuerySchema }),
  serviceController.listAdmin
);
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  uploadImageFile('image'),
  validate({ body: createServiceSchema }),
  serviceController.create
);
router.patch(
  '/:id',
  authenticate,
  requireRole('admin'),
  uploadImageFile('image'),
  validate({ params: serviceIdParamSchema, body: updateServiceSchema }),
  serviceController.update
);
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  validate({ params: serviceIdParamSchema }),
  serviceController.remove
);

export default router;

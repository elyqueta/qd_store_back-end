import { Router } from 'express';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import companyRoutes from './company.routes';
import adminRoutes from './admin.routes';
import locationRoutes from './location.routes';
import addressRoutes from './address.routes';
import productRoutes from './product.routes';
import deliveryTypeRoutes from './deliveryType.routes';
import paymentMethodRoutes from './paymentMethod.routes';

/**
 * Router agregador da versão 1 da API.
 *
 * Cada router de domínio é montado AQUI, sem prefixo próprio, e este
 * router é montado em app.ts sob `/api/v1`. Quando (e se) surgir uma
 * v2, basta criar `src/routes/v2/` com o mesmo formato e montá-lo
 * sob `/api/v2` — os domínios da v1 continuam intocados, servindo
 * clientes antigos sem quebra de contrato.
 *
 * productImage.routes, productSpecification.routes e
 * userCompany.routes NÃO aparecem aqui de propósito: são routers
 * aninhados, montados dentro de product.routes.ts e
 * company.routes.ts (ex: `/products/:productId/images`), herdando o
 * prefixo do router pai via mergeParams.
 */
const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/companies', companyRoutes);
router.use('/admin', adminRoutes);
router.use('/locations', locationRoutes);
router.use('/addresses', addressRoutes);
router.use('/products', productRoutes);
router.use('/delivery-types', deliveryTypeRoutes);
router.use('/payment-methods', paymentMethodRoutes);

export default router;

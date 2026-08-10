import { closePool } from '../../database/pool';
import { SEED_PASSWORD } from './data';
import { seedUsers } from './seedUsers';
import { seedCompanies, seedUserCompanies } from './seedCompanies';
import { seedCategories, seedProducts } from './seedCatalog';
import { seedAddresses } from './seedAddresses';
import { seedDeliveryTypes, seedPaymentMethods } from './seedDeliveryPayment';
import { seedCarts, seedCartItems } from './seedCarts';
import { seedOrders } from './seedOrders';
import { seedWishlists, seedNotifications } from './seedEngagement';

async function runSeeds(): Promise<void> {
  console.warn('\n=== A iniciar seeds ===\n');

  console.warn('--- Utilizadores ---');
  const userIds = await seedUsers();

  console.warn('\n--- Empresas ---');
  const companyIds = await seedCompanies();
  console.warn('\n--- Associações utilizador-empresa ---');
  await seedUserCompanies(userIds, companyIds);

  console.warn('\n--- Categorias ---');
  const categoryIds = await seedCategories();
  console.warn('\n--- Produtos ---');
  await seedProducts(categoryIds);

  console.warn('\n--- Endereços ---');
  await seedAddresses(userIds);

  console.warn('\n--- Tipos de entrega ---');
  const deliveryTypeIds = await seedDeliveryTypes();
  console.warn('\n--- Métodos de pagamento ---');
  const paymentMethodIds = await seedPaymentMethods();

  console.warn('\n--- Carrinhos ---');
  await seedCarts(userIds);
  console.warn('\n--- Itens de carrinho ---');
  await seedCartItems(userIds);

  console.warn('\n--- Pedidos ---');
  await seedOrders(userIds, deliveryTypeIds, paymentMethodIds);

  console.warn('\n--- Wishlists ---');
  await seedWishlists(userIds);
  console.warn('\n--- Notificações ---');
  await seedNotifications(userIds);

  console.warn('\n=== Seeds concluídos com sucesso ===\n');
  console.warn('Credenciais de teste (senha única para todos):');
  console.warn(`  Senha:        ${SEED_PASSWORD}`);
  console.warn(`  Admin:        admin@qd.co.ao`);
  console.warn(`  Cliente 1:    joao.silva@example.com`);
  console.warn(`  Cliente 2:    maria.santos@example.com`);
  console.warn(`  Empresa:      empresa.tech@example.com`);
}

runSeeds()
  .catch((err: unknown) => {
    console.error('Erro ao executar seeds:', err);
    process.exit(1);
  })
  .finally(async () => {
    await closePool();
  });
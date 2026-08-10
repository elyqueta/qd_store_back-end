/**
 * Script de seeds — NÃO é parte da API HTTP. Corre manualmente via
 * `npm run seed`.
 *
 * Este ficheiro é apenas um ponto de entrada que delega para o
 * orquestrador modular em `seeds/index.ts`. A estrutura está dividida
 * por responsabilidade:
 *
 *   seeds/index.ts            -> orquestrador principal (executa tudo)
 *   seeds/data.ts             -> dados centrais (única fonte de verdade)
 *   seeds/seedUsers.ts        -> utilizadores
 *   seeds/seedCompanies.ts    -> empresas e associações
 *   seeds/seedCatalog.ts      -> categorias, produtos, imagens, specs
 *   seeds/seedAddresses.ts    -> endereços
 *   seeds/seedDeliveryPayment.ts -> tipos de entrega e métodos de pagamento
 *   seeds/seedCarts.ts        -> carrinhos e itens
 *   seeds/seedOrders.ts       -> pedidos
 *   seeds/seedEngagement.ts   -> wishlists e notificações
 */
import './seeds/index';
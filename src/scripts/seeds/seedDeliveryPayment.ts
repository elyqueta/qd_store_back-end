import { query } from '../../database/pool';
import { SEED_DELIVERY_TYPES, SEED_PAYMENT_METHODS } from './data';

/**
 * Seed de TIPOS DE ENTREGA e MÉTODOS DE PAGAMENTO.
 *
 * Responsabilidade única: garantir que as opções de entrega e
 * pagamento existem. Devolve Maps<nome, id> para referência no
 * módulo de pedidos.
 */
export async function seedDeliveryTypes(): Promise<Map<string, string>> {
  const nameToId = new Map<string, string>();

  for (const delivery of SEED_DELIVERY_TYPES) {
    const existing = await query<{ id: string }>('SELECT id FROM delivery_type WHERE name = $1', [
      delivery.name,
    ]);

    if (existing.rows[0]) {
      console.warn(`Tipo de entrega "${delivery.name}" já existe (id: ${existing.rows[0].id}). Nada a fazer.`);
      nameToId.set(delivery.name, existing.rows[0].id);
      continue;
    }

    const result = await query<{ id: string }>(
      `INSERT INTO delivery_type (name, description, price, type)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [delivery.name, delivery.description, delivery.price, delivery.type]
    );

    console.warn(`Tipo de entrega criado: ${delivery.name} (id: ${result.rows[0]?.id})`);
    nameToId.set(delivery.name, result.rows[0]?.id ?? '');
  }

  return nameToId;
}

export async function seedPaymentMethods(): Promise<Map<string, string>> {
  const nameToId = new Map<string, string>();

  for (const method of SEED_PAYMENT_METHODS) {
    const existing = await query<{ id: string }>('SELECT id FROM payment_method WHERE name = $1', [
      method.name,
    ]);

    if (existing.rows[0]) {
      console.warn(`Método de pagamento "${method.name}" já existe (id: ${existing.rows[0].id}). Nada a fazer.`);
      nameToId.set(method.name, existing.rows[0].id);
      continue;
    }

    const result = await query<{ id: string }>(
      `INSERT INTO payment_method (name, type)
       VALUES ($1, $2)
       RETURNING id`,
      [method.name, method.type]
    );

    console.warn(`Método de pagamento criado: ${method.name} (id: ${result.rows[0]?.id})`);
    nameToId.set(method.name, result.rows[0]?.id ?? '');
  }

  return nameToId;
}
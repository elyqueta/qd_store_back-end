import { addressRepository } from '../../repositories/address.repository';
import { query } from '../../database/pool';
import { SEED_ADDRESSES } from './data';

/**
 * Seed de ENDEREÇOS.
 *
 * Responsabilidade única: garantir que os endereços de teste existem
 * para os utilizadores. Respeita a regra de negócio "primeiro
 * endereço vira padrão automaticamente" (isDefault = true no primeiro).
 */
export async function seedAddresses(userIds: Map<string, string>): Promise<void> {
  for (const address of SEED_ADDRESSES) {
    const userId = userIds.get(address.userEmail);

    if (!userId) {
      console.error(`Utilizador "${address.userEmail}" não encontrado para o endereço "${address.label}".`);
      continue;
    }

    const existing = await query<{ id: string }>(
      `SELECT id FROM address
       WHERE id_user = $1 AND label = $2 AND province = $3 AND municipality = $4`,
      [userId, address.label, address.province, address.municipality]
    );

    if (existing.rows[0]) {
      console.warn(`Endereço "${address.label}" de "${address.userEmail}" já existe. Nada a fazer.`);
      continue;
    }

    const existingCount = await addressRepository.countByUser(userId);

    const created = await addressRepository.create({
      userId,
      label: address.label,
      province: address.province,
      municipality: address.municipality,
      neighborhood: address.neighborhood,
      address: address.address,
      reference: address.reference ?? null,
      latitude: address.latitude ?? null,
      longitude: address.longitude ?? null,
      isDefault: existingCount === 0,
    });

    console.warn(`Endereço criado: "${created.label}" de "${address.userEmail}" (id: ${created.id})`);
  }
}
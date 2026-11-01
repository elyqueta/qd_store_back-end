import { userRepository } from '../../repositories/user.repository';
import { hashPassword } from '../../utils/password.util';
import { logger } from '../../config/logger';
import { SEED_USERS } from './data';

/**
 * Seed dedicado ao utilizador ADMINISTRADOR.
 *
 * Útil em ambientes novos (desenvolvimento, staging) onde se quer o
 * primeiro admin sem correr o seed completo (que popula catálogo,
 * endereços, pedidos, etc.). É idempotente: se o admin já existe,
 * não faz nada.
 *
 * Os dados vêm de scripts/seeds/data.ts (SEED_USERS[0]).
 */
export async function seedAdmin(): Promise<void> {
  const admin = SEED_USERS.find((u) => u.email === 'admin@qd.co.ao');

  if (!admin) {
    logger.error('Utilizador admin não encontrado em scripts/seeds/data.ts');
    process.exit(1);
  }

  const passwordHash = await hashPassword('Teste1234');

  const existing = await userRepository.findByEmail(admin.email);

  if (existing) {
    logger.warn(`Admin "${admin.email}" já existe (id: ${existing.id}). Nada a fazer.`);
    return;
  }

  const created = await userRepository.create({
    fullName: admin.fullName,
    email: admin.email,
    passwordHash,
    phone: admin.phone,
    nif: admin.nif ?? null,
    accountType: admin.accountType,
    role: admin.role ?? 'admin',
  });

  logger.info(`Admin criado: ${created.email} (id: ${created.id})`);
}

seedAdmin()
  .catch((err: unknown) => {
    logger.error({ err }, 'Erro ao criar admin');
    process.exit(1);
  })
  .finally(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { closePool } = await import('../../database/pool.js');
    await closePool();
  });

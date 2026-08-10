import { userRepository } from '../../repositories/user.repository';
import { hashPassword } from '../../utils/password.util';
import { SEED_USERS, SEED_PASSWORD } from './data';

/**
 * Seed de UTILIZADORES.
 *
 * Responsabilidade única: garantir que os utilizadores de teste
 * existem na base de dados. Devolve um Map<email, id> para que os
 * outros módulos possam referenciar utilizadores sem repetir queries.
 */
export async function seedUsers(): Promise<Map<string, string>> {
  const emailToId = new Map<string, string>();
  const passwordHash = await hashPassword(SEED_PASSWORD);

  for (const user of SEED_USERS) {
    const existing = await userRepository.findByEmail(user.email);

    if (existing) {
      console.warn(`Utilizador "${user.email}" já existe (id: ${existing.id}). Nada a fazer.`);
      emailToId.set(user.email, existing.id);
      continue;
    }

    const created = await userRepository.create({
      fullName: user.fullName,
      email: user.email,
      passwordHash,
      phone: user.phone,
      nif: user.nif ?? null,
      accountType: user.accountType,
      role: user.role ?? 'customer',
    });

    console.warn(`Utilizador criado: ${created.email} (id: ${created.id})`);
    emailToId.set(user.email, created.id);
  }

  return emailToId;
}
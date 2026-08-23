import { companyRepository } from '../../repositories/company.repository';
import { userCompanyRepository } from '../../repositories/userCompany.repository';
import { query } from '../../database/pool';
import { SEED_COMPANIES, SEED_USER_COMPANIES } from './data';

/**
 * Seed de EMPRESAS e ASSOCIAÇÕES UTILIZADOR-EMPRESA.
 *
 * Responsabilidade única: garantir que as empresas de teste existem
 * e que os utilizadores estão associados a elas com os cargos
 * correctos. Devolve um Map<nome, id> para referência noutros módulos.
 */
export async function seedCompanies(userIds: Map<string, string>): Promise<Map<string, string>> {
  const nameToId = new Map<string, string>();

  for (const company of SEED_COMPANIES) {
    const existing = await query<{ id: string }>('SELECT id FROM company WHERE nif = $1', [
      company.nif,
    ]);

    if (existing.rows[0]) {
      console.warn(
        `Empresa "${company.name}" já existe (id: ${existing.rows[0].id}). Nada a fazer.`
      );
      nameToId.set(company.name, existing.rows[0].id);
      continue;
    }

    const ownerId = userIds.get(company.ownerEmail);

    if (!ownerId) {
      console.error(
        `Proprietário "${company.ownerEmail}" não encontrado para a empresa "${company.name}".`
      );
      continue;
    }

    const created = await companyRepository.create({
      ownerId,
      name: company.name,
      nif: company.nif,
      sector: company.sector,
    });

    console.warn(`Empresa criada: ${created.name} (id: ${created.id})`);
    nameToId.set(company.name, created.id);
  }

  return nameToId;
}

export async function seedUserCompanies(
  userIds: Map<string, string>,
  companyIds: Map<string, string>
): Promise<void> {
  for (const assoc of SEED_USER_COMPANIES) {
    const userId = userIds.get(assoc.userEmail);
    const companyId = companyIds.get(assoc.companyName);

    if (!userId || !companyId) {
      console.error(`Associação inválida: ${assoc.userEmail} -> ${assoc.companyName}`);
      continue;
    }

    const isMember = await userCompanyRepository.isMember(companyId, userId);

    if (isMember) {
      console.warn(
        `Associação ${assoc.userEmail} -> ${assoc.companyName} já existe. Nada a fazer.`
      );
      continue;
    }

    await userCompanyRepository.create({
      userId,
      companyId,
      role: assoc.role,
    });

    console.warn(`Associação criada: ${assoc.userEmail} -> ${assoc.companyName} (${assoc.role})`);
  }
}

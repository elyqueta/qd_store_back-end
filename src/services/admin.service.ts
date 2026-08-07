import { companyRepository } from '../repositories/company.repository';
import { CompanyWithUsers } from '../types/company.types';

/**
 * Camada fina de propósito: hoje só delega ao repository, mas fica
 * pronta para crescer (ex.: paginação, filtros por status) sem
 * precisar de mudar o controller — mesmo princípio já aplicado em
 * category.service.ts.
 */
async function listCompaniesWithUsers(): Promise<CompanyWithUsers[]> {
  return companyRepository.findAllWithUsers();
}

export const adminService = {
  listCompaniesWithUsers,
};
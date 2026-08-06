import { userCompanyRepository } from '../repositories/userCompany.repository';
import { companyService } from './company.service';
import { UserCompany } from '../types/userCompany.types';
import {
  CreateUserCompanyInput,
  UpdateUserCompanyInput,
} from '../validators/userCompany.validator';
import { NotFoundError } from '../errors';

/**
 * `await companyService.findById(companyId)` aqui não serve para usar
 * o valor devolvido — serve só para forçar um 404 CLARO ("empresa não
 * encontrada") antes de sequer tentar o INSERT. Sem isto, um
 * companyId inválido só seria detectado pela FOREIGN KEY do Postgres,
 * misturado com o caso "userId inválido" na mesma exceção — perderíamos
 * a distinção entre os dois erros.
 */
async function associate(companyId: string, input: CreateUserCompanyInput): Promise<UserCompany> {
  await companyService.findById(companyId);

  return userCompanyRepository.create({
    userId: input.userId,
    companyId,
    role: input.role ?? null,
  });
}

async function listByCompany(companyId: string): Promise<UserCompany[]> {
  await companyService.findById(companyId);
  return userCompanyRepository.findByCompany(companyId);
}

async function updateRole(
  companyId: string,
  userId: string,
  input: UpdateUserCompanyInput
): Promise<UserCompany> {
  const updated = await userCompanyRepository.updateRole(companyId, userId, input.role);

  if (!updated) {
    throw new NotFoundError('Associação entre este utilizador e esta empresa não encontrada.');
  }

  return updated;
}

async function remove(companyId: string, userId: string): Promise<void> {
  const removed = await userCompanyRepository.remove(companyId, userId);

  if (!removed) {
    throw new NotFoundError('Associação entre este utilizador e esta empresa não encontrada.');
  }
}

export const userCompanyService = {
  associate,
  listByCompany,
  updateRole,
  remove,
};

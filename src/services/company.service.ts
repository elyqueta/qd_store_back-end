import { companyRepository } from '../repositories/company.repository';
import {
  beginOperation,
  completeOperation,
  failOperation,
  getOperation,
  hashRequest,
  normalizeIdempotencyKey,
} from '../repositories/idempotency.repository';
import { userCompanyRepository } from '../repositories/userCompany.repository';
import { Company, CompanyAssociation, CompanyWithUsers } from '../types/company.types';
import { CreateCompanyInput, UpdateCompanyInput } from '../validators/company.validator';
import { ConflictError, NotFoundError, ValidationError } from '../errors';

function normalizeNif(nif: string): string {
  return nif.replace(/\s+/g, '').toUpperCase();
}

async function create(
  input: CreateCompanyInput,
  ownerId: string,
  idempotencyKey?: string
): Promise<{ company: Company; association: CompanyAssociation }> {
  const normalizedKey = normalizeIdempotencyKey(idempotencyKey);

  if (normalizedKey) {
    const requestHash = hashRequest({ ownerId, ...input, nif: normalizeNif(input.nif) });
    const existingOperation = await getOperation(ownerId, 'company_create', normalizedKey);

    if (existingOperation) {
      if (existingOperation.status === 'in_progress') {
        throw new ConflictError(
          'A operação de criação da empresa já está em curso.',
          undefined,
          'COMPANY_OPERATION_IN_PROGRESS'
        );
      }

      if (existingOperation.status === 'completed') {
        if (existingOperation.requestHash !== requestHash) {
          throw new ConflictError(
            'Já existe uma operação idempotente para a mesma chave com payload diferente.',
            undefined,
            'COMPANY_CREATION_ALREADY_EXISTS'
          );
        }

        return existingOperation.responsePayload as {
          company: Company;
          association: CompanyAssociation;
        };
      }

      if (existingOperation.requestHash !== requestHash) {
        throw new ConflictError(
          'Já existe uma operação idempotente para a mesma chave com payload diferente.',
          undefined,
          'COMPANY_CREATION_ALREADY_EXISTS'
        );
      }
    }

    const started = await beginOperation(ownerId, 'company_create', normalizedKey, requestHash);
    if (!started) {
      const operation = await getOperation(ownerId, 'company_create', normalizedKey);
      if (!operation) {
        throw new ValidationError('Operação de idempotência inválida.');
      }

      if (operation.status === 'in_progress') {
        throw new ConflictError(
          'A operação de criação da empresa já está em curso.',
          undefined,
          'COMPANY_OPERATION_IN_PROGRESS'
        );
      }

      if (operation.status === 'completed') {
        if (operation.requestHash !== requestHash) {
          throw new ConflictError(
            'Já existe uma operação idempotente para a mesma chave com payload diferente.',
            undefined,
            'COMPANY_CREATION_ALREADY_EXISTS'
          );
        }

        return operation.responsePayload as {
          company: Company;
          association: CompanyAssociation;
        };
      }
    }

    try {
      const nif = normalizeNif(input.nif);
      const existing = await companyRepository.findByNif(nif);
      if (existing) {
        const isMember =
          existing.ownerId === ownerId || (await userCompanyRepository.isMember(existing.id, ownerId));
        if (isMember) {
          throw new ConflictError(
            'Esta empresa já está associada à sua conta.',
            undefined,
            'COMPANY_ALREADY_MEMBER'
          );
        }
        throw new ConflictError(
          'Esta empresa já está registada, mas o utilizador não está associado a ela.',
          undefined,
          'COMPANY_EXISTS_NOT_MEMBER'
        );
      }

      const created = await companyRepository.create({
        ownerId,
        name: input.name,
        nif,
        sector: input.sector ?? null,
        role: input.role,
      });

      await completeOperation(started!.id, 'company', created.company.id, created);
      return created;
    } catch (error) {
      await failOperation(started!.id);
      throw error;
    }
  }

  const nif = normalizeNif(input.nif);
  const existing = await companyRepository.findByNif(nif);
  if (existing) {
    const isMember =
      existing.ownerId === ownerId || (await userCompanyRepository.isMember(existing.id, ownerId));
    if (isMember) {
      throw new ConflictError(
        'Esta empresa já está associada à sua conta.',
        undefined,
        'COMPANY_ALREADY_MEMBER'
      );
    }
    throw new ConflictError(
      'Esta empresa já está registada, mas o utilizador não está associado a ela.',
      undefined,
      'COMPANY_EXISTS_NOT_MEMBER'
    );
  }
  return companyRepository.create({
    ownerId,
    name: input.name,
    nif,
    sector: input.sector ?? null,
    role: input.role,
  });
}

async function resolve(
  nif: string,
  userId: string
): Promise<
  | { state: 'not_found'; company: null }
  | { state: 'exists_not_member'; company: null }
  | { state: 'mine'; company: { id: string; name: string; nif: string } }
> {
  const company = await companyRepository.findByNif(normalizeNif(nif));
  if (!company) return { state: 'not_found' as const, company: null };
  const isMember =
    company.ownerId === userId || (await userCompanyRepository.isMember(company.id, userId));
  if (!isMember) return { state: 'exists_not_member' as const, company: null };
  return {
    state: 'mine' as const,
    company: { id: company.id, name: company.name, nif: company.nif },
  };
}

async function findAll(): Promise<Company[]> {
  return companyRepository.findAll();
}

async function findMineWithUsers(userId: string): Promise<CompanyWithUsers[]> {
  return companyRepository.findMineWithUsers(userId);
}

async function findById(id: string): Promise<Company> {
  const company = await companyRepository.findById(id);

  if (!company) {
    throw new NotFoundError(`Empresa com id "${id}" não encontrada.`);
  }

  return company;
}

async function update(id: string, input: UpdateCompanyInput): Promise<Company> {
  const updated = await companyRepository.update(id, input);

  if (!updated) {
    throw new NotFoundError(`Empresa com id "${id}" não encontrada.`);
  }

  return updated;
}

async function deactivate(id: string): Promise<void> {
  const deactivated = await companyRepository.deactivate(id);

  if (!deactivated) {
    throw new NotFoundError(`Empresa com id "${id}" não encontrada ou já está inactiva.`);
  }
}

export const companyService = {
  create,
  findAll,
  findMineWithUsers,
  resolve,
  findById,
  update,
  deactivate,
};

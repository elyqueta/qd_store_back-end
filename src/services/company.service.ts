import { companyRepository } from '../repositories/company.repository';
import { Company } from '../types/company.types';
import { CreateCompanyInput, UpdateCompanyInput } from '../validators/company.validator';
import { NotFoundError } from '../errors';

async function create(input: CreateCompanyInput): Promise<Company> {
  return companyRepository.create({
    name: input.name,
    nif: input.nif,
    sector: input.sector ?? null,
  });
}

async function findAll(): Promise<Company[]> {
  return companyRepository.findAll();
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
  findById,
  update,
  deactivate,
};

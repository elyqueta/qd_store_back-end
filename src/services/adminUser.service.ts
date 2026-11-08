import { NotFoundError } from '../errors';
import { adminUserRepository } from '../repositories/adminUser.repository';
import type { AdminListUsersQuery, UpdateUserRoleInput, UpdateUserStatusInput } from '../validators/adminUser.validator';

async function list(input: AdminListUsersQuery) {
  const { page, limit, ...filters } = input;
  return adminUserRepository.findAll(filters, page, limit);
}

async function findById(id: string) {
  const user = await adminUserRepository.findById(id);
  if (!user) throw new NotFoundError('Utilizador não encontrado.');
  return user;
}

async function updateStatus(actorId: string, id: string, input: UpdateUserStatusInput) {
  return adminUserRepository.updateStatus(id, actorId, input.status);
}

async function updateRole(actorId: string, id: string, input: UpdateUserRoleInput) {
  return adminUserRepository.updateRole(id, actorId, input.role);
}

export const adminUserService = { list, findById, updateStatus, updateRole };

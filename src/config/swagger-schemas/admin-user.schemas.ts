import type { OpenApiSchemas } from './types';

export const adminUserSchemas: OpenApiSchemas = {
  AdminUser: {
    type: 'object',
    required: ['id', 'fullName', 'email', 'phone', 'accountType', 'role', 'status'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      fullName: { type: 'string', example: 'Utilizador Exemplo' },
      email: { type: 'string', format: 'email' },
      phone: { type: 'string' },
      nif: { type: 'string', nullable: true },
      accountType: { type: 'string', enum: ['personal', 'business'] },
      role: { type: 'string', enum: ['customer', 'admin'] },
      status: { type: 'string', enum: ['active', 'inactive', 'banned'] },
      deactivatedAt: { type: 'string', format: 'date-time', nullable: true },
      profilePhoto: { type: 'object', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      companies: { type: 'array', items: { $ref: '#/components/schemas/AdminUserCompany' } },
    },
  },
  AdminUserCompany: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      nif: { type: 'string' },
      role: { type: 'string', nullable: true },
      status: { type: 'string', enum: ['active', 'inactive', 'banned'] },
    },
  },
  UpdateAdminUserStatusInput: {
    type: 'object',
    required: ['status'],
    additionalProperties: false,
    properties: { status: { type: 'string', enum: ['active', 'inactive', 'banned'] } },
  },
  UpdateAdminUserRoleInput: {
    type: 'object',
    required: ['role'],
    additionalProperties: false,
    properties: { role: { type: 'string', enum: ['customer', 'admin'] } },
  },
};

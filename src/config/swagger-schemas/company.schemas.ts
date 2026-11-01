import type { OpenApiSchemas } from './types';

export const companySchemas: OpenApiSchemas = {
  CompanyUser: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      fullName: { type: 'string', example: 'Maria Fernandes' },
      email: { type: 'string', format: 'email', example: 'maria@empresa.co.ao' },
      companyRole: { type: 'string', nullable: true, example: 'Gerente' },
    },
  },
  Company: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      ownerId: { type: 'string', format: 'uuid' },
      name: { type: 'string', example: 'Tech Solutions Lda' },
      nif: { type: 'string', example: '5417896230' },
      sector: { type: 'string', nullable: true, example: 'Tecnologia' },
      status: { type: 'string', enum: ['active', 'inactive', 'banned'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CompanyWithUsers: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      ownerId: { type: 'string', format: 'uuid' },
      name: { type: 'string', example: 'Tech Solutions Lda' },
      nif: { type: 'string', example: '5417896230' },
      sector: { type: 'string', nullable: true, example: 'Tecnologia' },
      status: { type: 'string', enum: ['active', 'inactive', 'banned'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      users: {
        type: 'array',
        items: { $ref: '#/components/schemas/CompanyUser' },
      },
    },
  },
  CreateCompanyInput: {
    type: 'object',
    required: ['name', 'nif'],
    properties: {
      name: { type: 'string', maxLength: 200, example: 'Tech Solutions Lda' },
      nif: { type: 'string', maxLength: 20, example: '005123456LA042' },
      sector: { type: 'string', maxLength: 100, example: 'Tecnologia' },
    },
  },
  UpdateCompanyInput: {
    type: 'object',
    properties: {
      name: { type: 'string', maxLength: 200, example: 'Tech Solutions Lda' },
      sector: { type: 'string', maxLength: 100, nullable: true, example: 'Tecnologia' },
    },
  },
  UserCompany: {
    type: 'object',
    properties: {
      userId: { type: 'string', format: 'uuid' },
      companyId: { type: 'string', format: 'uuid' },
      role: { type: 'string', nullable: true, example: 'Gerente' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateUserCompanyInput: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string', format: 'uuid' },
      role: { type: 'string', maxLength: 100, example: 'Gerente' },
    },
  },
  UpdateUserCompanyInput: {
    type: 'object',
    required: ['role'],
    properties: {
      role: { type: 'string', maxLength: 100, nullable: true, example: 'Comprador' },
    },
  },
};

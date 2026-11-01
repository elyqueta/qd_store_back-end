import type { OpenApiSchemas } from './types';

export const catalogSchemas: OpenApiSchemas = {
  Category: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      slug: { type: 'string', example: 'portateis' },
      label: { type: 'string', example: 'Portáteis' },
      icon: { type: 'string', nullable: true, example: '🖥️' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateCategoryInput: {
    type: 'object',
    required: ['label'],
    properties: {
      label: { type: 'string', maxLength: 100, example: 'Portáteis' },
      icon: { type: 'string', maxLength: 10, example: '🖥️' },
    },
  },
  UpdateCategoryInput: {
    type: 'object',
    properties: {
      label: { type: 'string', maxLength: 100, example: 'Portáteis' },
      icon: {
        type: 'string',
        maxLength: 10,
        nullable: true,
        example: '🖥️',
      },
    },
  },
  DeliveryType: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', example: 'Entrega Express' },
      description: { type: 'string', nullable: true, example: 'Entrega prioritária' },
      price: { type: 'number', minimum: 0, example: 2500 },
      type: { type: 'string', enum: ['standard', 'express', 'corporate', 'pickup'] },
      isActive: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateDeliveryTypeInput: {
    type: 'object',
    required: ['name', 'price', 'type'],
    properties: {
      name: { type: 'string', maxLength: 100, example: 'Entrega Express' },
      description: { type: 'string', maxLength: 200, example: 'Entrega prioritária' },
      price: { type: 'number', minimum: 0, example: 2500 },
      type: { type: 'string', enum: ['standard', 'express', 'corporate', 'pickup'] },
    },
  },
  UpdateDeliveryTypeInput: {
    type: 'object',
    properties: {
      name: { type: 'string', maxLength: 100, example: 'Entrega Express' },
      description: { type: 'string', maxLength: 200, nullable: true },
      price: { type: 'number', minimum: 0, example: 2500 },
      type: { type: 'string', enum: ['standard', 'express', 'corporate', 'pickup'] },
    },
  },
  /** Schemas do domínio PAYMENT_METHOD, o catálogo de métodos de pagamento disponíveis. */
  PaymentMethod: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', example: 'Multicaixa Express' },
      type: {
        type: 'string',
        enum: ['multicaixa_express', 'multicaixa_reference', 'bank_transfer'],
      },
      isActive: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreatePaymentMethodInput: {
    type: 'object',
    required: ['name', 'type'],
    properties: {
      name: { type: 'string', maxLength: 100, example: 'Multicaixa Express' },
      type: {
        type: 'string',
        enum: ['multicaixa_express', 'multicaixa_reference', 'bank_transfer'],
      },
    },
  },
  UpdatePaymentMethodInput: {
    type: 'object',
    properties: {
      name: { type: 'string', maxLength: 100, example: 'Multicaixa Express' },
      type: {
        type: 'string',
        enum: ['multicaixa_express', 'multicaixa_reference', 'bank_transfer'],
      },
    },
  },
};

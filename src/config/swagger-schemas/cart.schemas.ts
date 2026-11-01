import type { OpenApiSchemas } from './types';

export const cartSchemas: OpenApiSchemas = {
  CartItem: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      productId: { type: 'string', format: 'uuid' },
      productName: { type: 'string', example: 'Computador portátil' },
      imageUrl: { type: 'string', nullable: true },
      quantity: { type: 'integer', minimum: 1, maximum: 99 },
      unitPrice: { type: 'number', example: 350000 },
      subtotal: { type: 'number', example: 700000 },
      productStatus: { type: 'string', enum: ['active', 'inactive', 'out_of_stock'] },
    },
  },
  Cart: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
      itemsCount: { type: 'integer', example: 2 },
      total: { type: 'number', example: 700000 },
    },
  },
  AddCartItemInput: {
    type: 'object',
    required: ['productId'],
    additionalProperties: false,
    properties: {
      productId: { type: 'string', format: 'uuid' },
      quantity: { type: 'integer', minimum: 1, maximum: 99, default: 1 },
    },
  },
  UpdateCartItemInput: {
    type: 'object',
    required: ['quantity'],
    additionalProperties: false,
    properties: {
      quantity: { type: 'integer', minimum: 1, maximum: 99 },
    },
  },
};

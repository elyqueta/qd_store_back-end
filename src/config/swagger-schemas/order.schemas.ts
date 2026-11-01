import type { OpenApiSchemas } from './types';

export const orderSchemas: OpenApiSchemas = {
  OrderItem: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      productId: { type: 'string', format: 'uuid' },
      productName: { type: 'string' },
      quantity: { type: 'integer' },
      unitPrice: { type: 'number' },
      subtotal: { type: 'number' },
    },
  },
  OrderAddress: {
    type: 'object',
    properties: {
      province: { type: 'string' },
      municipality: { type: 'string' },
      neighborhood: { type: 'string' },
      address: { type: 'string' },
      reference: { type: 'string', nullable: true },
      latitude: { type: 'number', nullable: true },
      longitude: { type: 'number', nullable: true },
    },
  },
  OrderHistoryEntry: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      previousStatus: {
        type: 'string',
        enum: ['processing', 'in_transit', 'delivered', 'cancelled'],
        nullable: true,
      },
      newStatus: {
        type: 'string',
        enum: ['processing', 'in_transit', 'delivered', 'cancelled'],
      },
      changedBy: { type: 'string', format: 'uuid', nullable: true },
      note: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  OrderSummary: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      reference: { type: 'string', example: 'QD-20261101-A1B2C3' },
      type: { type: 'string', enum: ['personal', 'business'] },
      status: { type: 'string', enum: ['processing', 'in_transit', 'delivered', 'cancelled'] },
      total: { type: 'number', example: 702500 },
      itemsCount: { type: 'integer', example: 2 },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  Order: {
    allOf: [
      { $ref: '#/components/schemas/OrderSummary' },
      {
        type: 'object',
        properties: {
          userId: { type: 'string', format: 'uuid' },
          companyId: { type: 'string', format: 'uuid', nullable: true },
          paymentMethodId: { type: 'string', format: 'uuid' },
          deliveryTypeId: { type: 'string', format: 'uuid' },
          deliveryPrice: { type: 'number' },
          notes: { type: 'string', nullable: true },
          address: { $ref: '#/components/schemas/OrderAddress' },
          items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
          history: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderHistoryEntry' },
          },
          payment: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string', format: 'uuid' },
              methodType: {
                type: 'string',
                enum: ['multicaixa_express', 'multicaixa_reference', 'bank_transfer'],
              },
              status: { type: 'string', enum: ['pending', 'confirmed', 'failed', 'refunded'] },
            },
          },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    ],
  },
  CreateOrderInput: {
    type: 'object',
    required: ['deliveryTypeId', 'paymentMethodId', 'addressId'],
    additionalProperties: false,
    properties: {
      deliveryTypeId: { type: 'string', format: 'uuid' },
      paymentMethodId: { type: 'string', format: 'uuid' },
      addressId: { type: 'string', format: 'uuid' },
      companyId: { type: 'string', format: 'uuid' },
      notes: { type: 'string', maxLength: 1000 },
    },
  },
  UpdateOrderStatusInput: {
    type: 'object',
    required: ['status'],
    additionalProperties: false,
    properties: {
      status: { type: 'string', enum: ['in_transit', 'delivered', 'cancelled'] },
      note: { type: 'string', maxLength: 500 },
    },
  },
};

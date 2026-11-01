import type { OpenApiSchemas } from './types';

export const paymentSchemas: OpenApiSchemas = {
  PaymentExpressDetails: {
    type: 'object',
    required: ['methodType'],
    properties: {
      methodType: { type: 'string', enum: ['multicaixa_express'] },
      customerPhone: { type: 'string', nullable: true },
      apiTransactionId: { type: 'string', nullable: true },
    },
  },
  PaymentReferenceDetails: {
    type: 'object',
    required: ['methodType', 'entity', 'reference', 'expiresAt', 'referenceStatus'],
    properties: {
      methodType: { type: 'string', enum: ['multicaixa_reference'] },
      entity: { type: 'string' },
      reference: { type: 'string', example: '123456789' },
      expiresAt: { type: 'string', format: 'date-time' },
      referenceStatus: {
        type: 'string',
        enum: ['pending', 'paid', 'expired', 'cancelled'],
      },
    },
  },
  PaymentBankTransferDetails: {
    type: 'object',
    required: ['methodType', 'destinationIban', 'destinationBank', 'destinationHolder'],
    properties: {
      methodType: { type: 'string', enum: ['bank_transfer'] },
      destinationIban: { type: 'string' },
      destinationBank: { type: 'string' },
      destinationHolder: { type: 'string' },
      confirmedBy: { type: 'string', format: 'uuid', nullable: true },
    },
  },
  Payment: {
    type: 'object',
    required: ['id', 'orderId', 'methodType', 'status', 'amount', 'createdAt', 'details'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      orderId: { type: 'string', format: 'uuid' },
      methodType: {
        type: 'string',
        enum: ['multicaixa_express', 'multicaixa_reference', 'bank_transfer'],
      },
      status: { type: 'string', enum: ['pending', 'confirmed', 'failed', 'refunded'] },
      amount: { type: 'number' },
      amountPaid: { type: 'number', nullable: true },
      paidAt: { type: 'string', format: 'date-time', nullable: true },
      transactionReference: { type: 'string', nullable: true },
      notes: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      details: {
        oneOf: [
          { $ref: '#/components/schemas/PaymentExpressDetails' },
          { $ref: '#/components/schemas/PaymentReferenceDetails' },
          { $ref: '#/components/schemas/PaymentBankTransferDetails' },
        ],
        discriminator: { propertyName: 'methodType' },
      },
    },
  },
  PaymentSummary: {
    type: 'object',
    required: ['id', 'methodType', 'status'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      methodType: {
        type: 'string',
        enum: ['multicaixa_express', 'multicaixa_reference', 'bank_transfer'],
      },
      status: { type: 'string', enum: ['pending', 'confirmed', 'failed', 'refunded'] },
    },
  },
  CreatePaymentInput: {
    oneOf: [
      {
        type: 'object',
        required: ['methodType', 'customerPhone'],
        additionalProperties: false,
        properties: {
          methodType: { type: 'string', enum: ['multicaixa_express'] },
          customerPhone: { type: 'string', minLength: 9, maxLength: 20 },
        },
      },
      {
        type: 'object',
        required: ['methodType'],
        additionalProperties: false,
        properties: { methodType: { type: 'string', enum: ['multicaixa_reference'] } },
      },
      {
        type: 'object',
        required: ['methodType'],
        additionalProperties: false,
        properties: { methodType: { type: 'string', enum: ['bank_transfer'] } },
      },
    ],
    discriminator: { propertyName: 'methodType' },
  },
  AdminPaymentActionInput: {
    type: 'object',
    additionalProperties: false,
    properties: { notes: { type: 'string', maxLength: 500 } },
  },
};

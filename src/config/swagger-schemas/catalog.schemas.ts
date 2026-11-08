import type { OpenApiSchemas } from './types';

export const catalogSchemas: OpenApiSchemas = {
  Category: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      slug: { type: 'string', example: 'portateis' },
      label: { type: 'string', example: 'Portáteis' },
      icon: { type: 'string', nullable: true, example: 'laptop' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateCategoryInput: {
    type: 'object',
    required: ['label'],
    properties: {
      label: { type: 'string', maxLength: 100, example: 'Portáteis' },
      icon: { type: 'string', maxLength: 60, example: 'laptop' },
    },
  },
  UpdateCategoryInput: {
    type: 'object',
    properties: {
      label: { type: 'string', maxLength: 100, example: 'Portáteis' },
      icon: {
        type: 'string',
        maxLength: 60,
        nullable: true,
        example: 'laptop',
      },
    },
  },
  IconCatalogEntry: {
    type: 'object',
    required: ['name', 'label', 'keywords'],
    properties: {
      name: { type: 'string', example: 'laptop' },
      label: { type: 'string', example: 'Portátil' },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        example: ['computador', 'portátil', 'pc'],
      },
      Highlight: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          placement: { type: 'string', enum: ['hero', 'showcase', 'category_block'] },
          title: { type: 'string', example: 'Tecnologia para o teu negócio' },
          subtitle: { type: 'string', nullable: true },
          label: { type: 'string', nullable: true, example: 'Novidade' },
          ctaLabel: { type: 'string', nullable: true, example: 'Ver produtos' },
          ctaUrl: { type: 'string', nullable: true, example: '/products' },
          imageUrl: { type: 'string', nullable: true, format: 'uri' },
          theme: { type: 'string', enum: ['dark', 'light'] },
          product: { type: 'object', nullable: true },
          category: { type: 'object', nullable: true },
          displayOrder: { type: 'integer' },
          isActive: { type: 'boolean' },
          startsAt: { type: 'string', nullable: true, format: 'date-time' },
          endsAt: { type: 'string', nullable: true, format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateHighlightInput: {
        type: 'object',
        description: 'Se productId for enviado, a imagem principal é usada automaticamente e não se envia image. Sem productId, image é obrigatório.',
        required: ['placement', 'title'],
        properties: {
          placement: { type: 'string', enum: ['hero', 'showcase', 'category_block'] },
          title: { type: 'string', maxLength: 120 },
          subtitle: { type: 'string', maxLength: 255, nullable: true },
          label: { type: 'string', maxLength: 60, nullable: true },
          ctaLabel: { type: 'string', maxLength: 60, nullable: true },
          ctaUrl: { type: 'string', maxLength: 255, example: '/products' },
          productId: { type: 'string', format: 'uuid', nullable: true },
          categoryId: { type: 'string', format: 'uuid', nullable: true },
          displayOrder: { type: 'integer', minimum: 0 },
          isActive: { type: 'boolean' },
          startsAt: { type: 'string', format: 'date-time', nullable: true },
          endsAt: { type: 'string', format: 'date-time', nullable: true },
          theme: { type: 'string', enum: ['dark', 'light'] },
          image: { type: 'string', format: 'binary' },
        },
      },
      ReorderHighlightsInput: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'displayOrder'],
              properties: {
                id: { type: 'string', format: 'uuid' },
                displayOrder: { type: 'integer', minimum: 0 },
              },
              Service: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string', example: 'Instalação e configuração' },
                  description: { type: 'string', nullable: true },
                  icon: { type: 'string', example: 'screwdriver-wrench' },
                  imageUrl: { type: 'string', nullable: true, format: 'uri' },
                  startsFromPrice: { type: 'number', nullable: true, example: 15000 },
                  isActive: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
              CreateServiceInput: {
                type: 'object',
                required: ['name', 'icon'],
                properties: {
                  name: { type: 'string', maxLength: 120 },
                  description: { type: 'string', maxLength: 5000, nullable: true },
                  icon: { type: 'string', example: 'screwdriver-wrench' },
                  startsFromPrice: { type: 'number', minimum: 0, nullable: true },
                  isActive: { type: 'boolean' },
                  image: { type: 'string', format: 'binary' },
                },
              },
              UpdateServiceInput: {
                type: 'object',
                properties: {
                  name: { type: 'string', maxLength: 120 },
                  description: { type: 'string', maxLength: 5000, nullable: true },
                  icon: { type: 'string' },
                  startsFromPrice: { type: 'number', minimum: 0, nullable: true },
                  isActive: { type: 'boolean' },
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
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

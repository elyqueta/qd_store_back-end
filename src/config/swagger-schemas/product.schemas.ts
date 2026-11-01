import type { OpenApiSchemas } from './types';

export const productSchemas: OpenApiSchemas = {
  /**
   * Schema genérico de paginação — reutilizado por QUALQUER
   * endpoint que devolva uma lista paginada (PRODUCT é o
   * primeiro, ORDER e WISHLIST vão reaproveitar este mesmo
   * schema no futuro, em vez de cada um definir o seu).
   */
  Pagination: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      total: { type: 'integer', example: 137 },
      totalPages: { type: 'integer', example: 7 },
    },
  },
  /**
   * Schemas do domínio PRODUCT.
   *
   * price/originalPrice aparecem como `number` aqui — mesmo o
   * Postgres guardando DECIMAL e o driver `pg` devolvendo string
   * internamente (ver product.types.ts) — porque o Swagger
   * documenta o CONTRATO HTTP (JSON), não os detalhes internos de
   * armazenamento. O repository já converte antes da resposta.
   */
  Product: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      categoryId: { type: 'string', format: 'uuid' },
      categoryName: { type: 'string', example: 'Portáteis' },
      name: { type: 'string', example: 'Portátil Dell Inspiron 15' },
      description: { type: 'string', nullable: true },
      price: { type: 'number', example: 450000 },
      originalPrice: { type: 'number', nullable: true, example: 520000 },
      badge: { type: 'string', nullable: true, example: 'Promoção' },
      status: { type: 'string', enum: ['active', 'inactive', 'out_of_stock'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateProductInput: {
    type: 'object',
    required: ['categoryId', 'name', 'price'],
    properties: {
      categoryId: { type: 'string', format: 'uuid' },
      name: { type: 'string', maxLength: 200, example: 'Portátil Dell Inspiron 15' },
      description: { type: 'string', maxLength: 5000 },
      price: { type: 'number', example: 450000 },
      originalPrice: { type: 'number', example: 520000 },
      badge: { type: 'string', maxLength: 50, example: 'Promoção' },
    },
  },
  UpdateProductInput: {
    type: 'object',
    properties: {
      categoryId: { type: 'string', format: 'uuid' },
      name: { type: 'string', maxLength: 200 },
      description: { type: 'string', maxLength: 5000, nullable: true },
      price: { type: 'number' },
      originalPrice: { type: 'number', nullable: true },
      badge: { type: 'string', maxLength: 50, nullable: true },
    },
  },
  ProductImage: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      productId: { type: 'string', format: 'uuid' },
      url: { type: 'string', example: 'https://cdn.exemplo.co.ao/produtos/abc.jpg' },
      displayOrder: { type: 'integer', example: 0 },
      width: { type: 'integer', nullable: true, example: 1200 },
      height: { type: 'integer', nullable: true, example: 900 },
      format: { type: 'string', nullable: true, example: 'jpg' },
      sizeBytes: { type: 'integer', nullable: true, example: 204800 },
    },
  },
  CreateProductImageInput: {
    type: 'object',
    required: ['url'],
    properties: {
      url: { type: 'string', example: 'https://cdn.exemplo.co.ao/produtos/abc.jpg' },
      displayOrder: { type: 'integer', example: 0 },
      width: { type: 'integer', example: 1200 },
      height: { type: 'integer', example: 900 },
      format: { type: 'string', maxLength: 10, example: 'jpg' },
      sizeBytes: { type: 'integer', example: 204800 },
    },
  },
  UpdateProductImageInput: {
    type: 'object',
    properties: {
      url: { type: 'string' },
      displayOrder: { type: 'integer' },
      width: { type: 'integer', nullable: true },
      height: { type: 'integer', nullable: true },
      format: { type: 'string', maxLength: 10, nullable: true },
      sizeBytes: { type: 'integer', nullable: true },
    },
  },
  ProductSpecification: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      productId: { type: 'string', format: 'uuid' },
      specKey: { type: 'string', example: 'RAM' },
      specValue: { type: 'string', example: '16GB' },
      displayOrder: { type: 'integer', example: 0 },
    },
  },
  CreateProductSpecificationInput: {
    type: 'object',
    required: ['specKey', 'specValue', 'displayOrder'],
    properties: {
      specKey: { type: 'string', maxLength: 255, example: 'RAM' },
      specValue: { type: 'string', maxLength: 255, example: '16GB' },
      displayOrder: { type: 'integer', example: 0 },
    },
  },
  UpdateProductSpecificationInput: {
    type: 'object',
    properties: {
      specKey: { type: 'string', maxLength: 255 },
      specValue: { type: 'string', maxLength: 255 },
      displayOrder: { type: 'integer' },
    },
  },
};

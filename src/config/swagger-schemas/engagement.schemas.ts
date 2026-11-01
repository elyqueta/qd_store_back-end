import type { OpenApiSchemas } from './types';

export const engagementSchemas: OpenApiSchemas = {
  WishlistItem: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      productId: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      price: { type: 'number' },
      originalPrice: { type: 'number', nullable: true },
      badge: { type: 'string', nullable: true },
      status: { type: 'string', enum: ['active', 'inactive', 'out_of_stock'] },
      imageUrl: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  AddWishlistItemInput: {
    type: 'object',
    required: ['productId'],
    additionalProperties: false,
    properties: { productId: { type: 'string', format: 'uuid' } },
  },
  Notification: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
      type: { type: 'string', enum: ['order', 'promotion', 'newsletter', 'system'] },
      message: { type: 'string' },
      isRead: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
};

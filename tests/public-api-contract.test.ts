import express from 'express';
import { createServer } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { privateNoStore, publicReadCache } from '../src/middlewares/apiCachePolicy';
import { listProductsQuerySchema } from '../src/validators/product.validator';
import {
  createProductImageSchema,
  updateProductImageSchema,
} from '../src/validators/productImage.validator';
import { createProductSchema } from '../src/validators/product.validator';

const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        })
    )
  );
});

describe('public API contract', () => {
  it('validates product filters and rejects unknown or inconsistent queries', () => {
    const parsed = listProductsQuerySchema.parse({
      page: '2',
      limit: '10',
      search: ' Dell ',
      sort: 'price_asc',
      priceMin: '100',
      priceMax: '200',
      availableOnly: 'true',
    });

    expect(parsed).toMatchObject({
      page: 2,
      limit: 10,
      search: 'Dell',
      sort: 'price_asc',
      priceMin: 100,
      priceMax: 200,
      availableOnly: true,
    });
    expect(
      listProductsQuerySchema.safeParse({ priceMin: '500', priceMax: '100' }).success
    ).toBe(false);
    expect(listProductsQuerySchema.safeParse({ stock: 'true' }).success).toBe(false);
  });

  it('requires uploads instead of manually supplied image URLs and parses multipart fields', () => {
    expect(createProductImageSchema.safeParse({ url: 'https://cdn.example.com/product.jpg' }).success)
      .toBe(false);
    expect(createProductImageSchema.parse({ displayOrder: '0' })).toMatchObject({
      displayOrder: 0,
    });
    expect(
      createProductSchema.safeParse({
        categoryId: '00000000-0000-4000-8000-000000000001',
        name: 'Produto',
        price: '1250.50',
        mainImage: { url: 'https://cdn.example.com/product.jpg' },
      }).success
    ).toBe(false);
    expect(
      createProductSchema.parse({
        categoryId: '00000000-0000-4000-8000-000000000001',
        name: 'Produto',
        price: '1250.50',
      }).price
    ).toBe(1250.5);
    expect(updateProductImageSchema.safeParse({ url: 'https://cdn.example.com/product.jpg' }).success)
      .toBe(false);
    expect(updateProductImageSchema.parse({ width: '1200', height: null })).toMatchObject({
      width: 1200,
      height: null,
    });
  });

  it('uses weak ETags and returns 304 for a matching conditional public GET', async () => {
    const app = express();
    app.set('etag', 'weak');
    app.get('/public', publicReadCache, (_req, res) => {
      res.json({ status: 'success', data: ['stable'] });
    });
    app.get('/private', privateNoStore, (_req, res) => {
      res.json({ status: 'success', data: ['private'] });
    });

    const server = createServer(app);
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Servidor de teste não disponibilizou uma porta TCP.');
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;
    const firstResponse = await fetch(`${baseUrl}/public`);
    const etag = firstResponse.headers.get('etag');

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.headers.get('cache-control')).toContain('public');
    if (!etag) {
      throw new Error('A resposta pública não incluiu ETag.');
    }

    const conditionalResponse = await fetch(`${baseUrl}/public`, {
      headers: { 'If-None-Match': etag },
    });
    expect(conditionalResponse.status).toBe(304);

    const privateResponse = await fetch(`${baseUrl}/private`);
    expect(privateResponse.headers.get('cache-control')).toBe('private, no-store');
  });
});

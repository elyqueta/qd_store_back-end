import { describe, expect, it } from 'vitest';
import { productIdParamSchema } from '../src/validators/product.validator';

describe('productIdParamSchema', () => {
  it('accepts PostgreSQL UUID values regardless of version and variant bits', () => {
    expect(
      productIdParamSchema.safeParse({ id: '2432da43-3441-e804-df45-97ccaded0b7e' }).success
    ).toBe(true);
  });

  it('rejects values that are not UUID-shaped', () => {
    expect(productIdParamSchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
  });
});

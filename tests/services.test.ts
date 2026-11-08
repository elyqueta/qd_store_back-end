import { describe, expect, it } from 'vitest';
import { createServiceSchema, updateServiceSchema } from '../src/validators/service.validator';

describe('services contract', () => {
  it('accepts a service with a catalog icon and price zero', () => {
    const service = createServiceSchema.parse({
      name: 'Instalação',
      icon: 'screwdriver-wrench',
      startsFromPrice: '0',
      isActive: 'true',
    });
    expect(service.startsFromPrice).toBe(0);
    expect(service.isActive).toBe(true);
  });

  it('rejects unknown icons and negative prices', () => {
    expect(createServiceSchema.safeParse({ name: 'Serviço', icon: 'unknown' }).success).toBe(false);
    expect(
      createServiceSchema.safeParse({ name: 'Serviço', icon: 'laptop', startsFromPrice: '-1' }).success
    ).toBe(false);
  });

  it('supports partial updates and null clearing', () => {
    expect(updateServiceSchema.safeParse({ description: null }).success).toBe(true);
    expect(updateServiceSchema.safeParse({ icon: 'laptop' }).success).toBe(true);
    expect(updateServiceSchema.safeParse({}).success).toBe(false);
  });
});

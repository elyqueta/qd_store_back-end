import { describe, expect, it } from 'vitest';
import { createCompanySchema } from '../src/validators/company.validator';
import { createOrderSchema } from '../src/validators/order.validator';

const baseOrder = {
  deliveryTypeId: '00000000-0000-4000-8000-000000000001',
  paymentMethodId: '00000000-0000-4000-8000-000000000002',
  addressId: '00000000-0000-4000-8000-000000000003',
};

describe('business checkout contract', () => {
  it('requires a valid company role and normalised-format NIF when creating a company', () => {
    expect(
      createCompanySchema.safeParse({
        name: 'Empresa Exemplo Lda',
        nif: '000000000',
        sector: 'Tecnologia',
        role: 'Gerente',
      }).success
    ).toBe(true);
    expect(
      createCompanySchema.safeParse({
        name: 'Empresa Exemplo Lda',
        nif: '123',
        role: 'Gerente',
      }).success
    ).toBe(false);
    expect(
      createCompanySchema.safeParse({ name: 'Empresa Exemplo Lda', nif: '000000000' }).success
    ).toBe(false);
  });

  it('accepts a company snapshot and rejects two business contexts together', () => {
    expect(
      createOrderSchema.safeParse({
        ...baseOrder,
        companyId: null,
        companySnapshot: {
          name: 'Empresa Exemplo Lda',
          nif: '000000000',
          role: 'Gerente',
        },
      }).success
    ).toBe(true);
    expect(
      createOrderSchema.safeParse({
        ...baseOrder,
        companyId: '00000000-0000-4000-8000-000000000004',
        companySnapshot: {
          name: 'Empresa Exemplo Lda',
          nif: '000000000',
          role: 'Gerente',
        },
      }).success
    ).toBe(false);
  });
});

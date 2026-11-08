import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
  findUserIdByEmail: vi.fn(),
  create: vi.fn(),
}));

vi.mock('../src/services/company.service', () => ({
  companyService: { findById: mocks.findById },
}));

vi.mock('../src/repositories/userCompany.repository', () => ({
  userCompanyRepository: {
    findUserIdByEmail: mocks.findUserIdByEmail,
    create: mocks.create,
  },
}));

import { NotFoundError } from '../src/errors';
import { userCompanyService } from '../src/services/userCompany.service';
import { createUserCompanySchema } from '../src/validators/userCompany.validator';

describe('company member association input', () => {
  it('accepts a normalized email or the legacy UUID payload, but not both', () => {
    expect(createUserCompanySchema.parse({ email: '  MARIA@EXEMPLO.CO.AO  ' })).toEqual({
      email: 'maria@exemplo.co.ao',
    });
    expect(createUserCompanySchema.safeParse({ userId: '00000000-0000-4000-8000-000000000001' }).success)
      .toBe(true);
    expect(createUserCompanySchema.safeParse({
      email: 'maria@exemplo.co.ao',
      userId: '00000000-0000-4000-8000-000000000001',
    }).success).toBe(false);
    expect(createUserCompanySchema.safeParse({}).success).toBe(false);
    expect(createUserCompanySchema.safeParse({ email: 'invalido' }).success).toBe(false);
    expect(createUserCompanySchema.safeParse({ email: 'a@b.co', extra: true }).success).toBe(false);
  });
});

describe('userCompanyService.associate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findById.mockResolvedValue({ id: 'company-id' });
    mocks.create.mockResolvedValue({
      userId: 'user-id',
      companyId: 'company-id',
      role: 'Comprador',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('resolves an email inside the association flow without exposing a lookup endpoint', async () => {
    mocks.findUserIdByEmail.mockResolvedValue('user-id');

    await userCompanyService.associate('company-id', {
      email: 'maria@exemplo.co.ao',
      role: 'Comprador',
    });

    expect(mocks.findUserIdByEmail).toHaveBeenCalledWith('maria@exemplo.co.ao');
    expect(mocks.create).toHaveBeenCalledWith({
      userId: 'user-id',
      companyId: 'company-id',
      role: 'Comprador',
    });
  });

  it('returns not found when no account matches the exact email', async () => {
    mocks.findUserIdByEmail.mockResolvedValue(null);

    await expect(
      userCompanyService.associate('company-id', { email: 'inexistente@exemplo.co.ao' })
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('preserves the UUID association contract', async () => {
    await userCompanyService.associate('company-id', {
      userId: '00000000-0000-4000-8000-000000000001',
    });

    expect(mocks.findUserIdByEmail).not.toHaveBeenCalled();
    expect(mocks.create).toHaveBeenCalledWith({
      userId: '00000000-0000-4000-8000-000000000001',
      companyId: 'company-id',
      role: null,
    });
  });
});

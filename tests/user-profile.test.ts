import { describe, expect, it } from 'vitest';
import { updateUserProfileSchema } from '../src/validators/userProfile.validator';

describe('user profile contract', () => {
  it('accepts profile fields and parses multipart booleans', () => {
    expect(
      updateUserProfileSchema.parse({
        fullName: 'Maria Silva',
        email: 'MARIA@EXEMPLO.CO.AO',
        phone: '923456789',
        currentPassword: 'SenhaActual1',
        newPassword: 'SenhaNova2',
        removePhoto: 'false',
      })
    ).toMatchObject({
      fullName: 'Maria Silva',
      email: 'maria@exemplo.co.ao',
      removePhoto: false,
    });
  });

  it('rejects NIF and unknown multipart fields', () => {
    expect(updateUserProfileSchema.safeParse({ nif: '005123456LA042' }).success).toBe(false);
    expect(updateUserProfileSchema.safeParse({ photo: 'not-a-file' }).success).toBe(false);
  });

  it('requires the current password for sensitive changes', () => {
    expect(updateUserProfileSchema.safeParse({ email: 'novo@exemplo.co.ao' }).success).toBe(false);
    expect(updateUserProfileSchema.safeParse({ newPassword: 'SenhaNova2' }).success).toBe(false);
    expect(
      updateUserProfileSchema.safeParse({
        currentPassword: 'SenhaActual1',
        newPassword: 'SenhaNova2',
      }).success
    ).toBe(true);
  });

  it('rejects conflicting photo operations and no-op payloads', () => {
    expect(updateUserProfileSchema.safeParse({ currentPassword: 'SenhaActual1' }).success).toBe(
      false
    );
    expect(
      updateUserProfileSchema.safeParse({ removePhoto: 'true', photo: 'ignored' }).success
    ).toBe(false);
  });
});

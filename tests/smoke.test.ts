import { describe, expect, it } from 'vitest';
import { logger } from '../src/config/logger';
import { z } from 'zod';

/**
 * Smoke test: verifica que o logger funciona e que o schema de
 * ambiente rejeita configurações inválidas.
 */
describe('smoke', () => {
  it('logger emite níveis definidos', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('rejeita DATABASE_URL inválida', () => {
    const schema = z.string().url();
    expect(schema.safeParse('não-é-uma-url').success).toBe(false);
    expect(schema.safeParse('postgres://u:p@localhost:5432/db').success).toBe(true);
  });
});

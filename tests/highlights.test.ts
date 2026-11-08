import { describe, expect, it } from 'vitest';
import {
  createHighlightSchema,
  reorderHighlightsSchema,
  updateHighlightSchema,
} from '../src/validators/highlight.validator';

describe('highlights contract', () => {
  it('validates creation fields and multipart values', () => {
    const result = createHighlightSchema.parse({
      placement: 'hero',
      title: 'Novo catálogo',
      isActive: 'false',
      displayOrder: '2',
      startsAt: '2026-01-01T00:00:00.000Z',
      endsAt: '2026-12-31T00:00:00.000Z',
      ctaUrl: '/products',
    });
    expect(result.isActive).toBe(false);
    expect(result.displayOrder).toBe(2);
    expect(result.ctaUrl).toBe('/products');
  });

  it('rejects unsafe URLs and invalid date windows', () => {
    expect(createHighlightSchema.safeParse({ placement: 'hero', title: 'X', ctaUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(
      createHighlightSchema.safeParse({
        placement: 'hero',
        title: 'X',
        startsAt: '2026-12-31',
        endsAt: '2026-01-01',
      }).success
    ).toBe(false);
  });

  it('requires non-empty reorder items and supports partial updates', () => {
    expect(updateHighlightSchema.safeParse({ title: 'Actualizado' }).success).toBe(true);
    expect(reorderHighlightsSchema.safeParse({ items: [] }).success).toBe(false);
    expect(
      reorderHighlightsSchema.safeParse({
        items: [{ id: '00000000-0000-4000-8000-000000000001', displayOrder: 0 }],
      }).success
    ).toBe(true);
  });
});

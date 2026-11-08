import { describe, expect, it } from 'vitest';
import { iconCatalog, isCatalogIcon } from '../src/data/icon-catalog';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../src/validators/category.validator';

describe('Font Awesome icon catalog', () => {
  it('contains stable names and validates catalog membership', () => {
    expect(isCatalogIcon('laptop')).toBe(true);
    expect(isCatalogIcon('brands/whatsapp')).toBe(true);
    expect(isCatalogIcon('not-in-catalog')).toBe(false);
    expect(iconCatalog.length).toBeGreaterThan(0);
  });

  it('accepts catalog icons and rejects legacy emoji or unknown names', () => {
    expect(createCategorySchema.safeParse({ label: 'Portáteis', icon: 'laptop' }).success).toBe(
      true
    );
    expect(createCategorySchema.safeParse({ label: 'Portáteis', icon: '💻' }).success).toBe(false);
    expect(
      createCategorySchema.safeParse({ label: 'Portáteis', icon: 'something-new' }).success
    ).toBe(false);
  });

  it('allows null only for clearing an icon in PATCH', () => {
    expect(updateCategorySchema.safeParse({ icon: null }).success).toBe(true);
    expect(updateCategorySchema.safeParse({ icon: 'mobile-screen' }).success).toBe(true);
    expect(updateCategorySchema.safeParse({ icon: '🖥️' }).success).toBe(false);
  });
});

import { categoryRepository } from '../../repositories/category.repository';
import { productRepository } from '../../repositories/product.repository';
import { productImageRepository } from '../../repositories/productImage.repository';
import { productSpecificationRepository } from '../../repositories/productSpecification.repository';
import { generateSlug } from '../../utils/slug.util';
import { query } from '../../database/pool';
import { SEED_CATEGORIES, SEED_PRODUCTS } from './data';

/**
 * Seed do CATÁLOGO: categorias, produtos, imagens e especificações.
 *
 * Responsabilidade única: garantir que o catálogo de teste existe.
 * Devolve um Map<label, id> das categorias para referência noutros
 * módulos.
 */
export async function seedCategories(): Promise<Map<string, string>> {
  const labelToId = new Map<string, string>();

  for (const category of SEED_CATEGORIES) {
    const slug = generateSlug(category.label);
    const existing = await query<{ id: string }>('SELECT id FROM category WHERE slug = $1', [slug]);

    if (existing.rows[0]) {
      console.warn(`Categoria "${category.label}" já existe (id: ${existing.rows[0].id}). Nada a fazer.`);
      labelToId.set(category.label, existing.rows[0].id);
      continue;
    }

    const created = await categoryRepository.create({
      slug,
      label: category.label,
      icon: category.icon,
    });

    console.warn(`Categoria criada: ${created.label} (id: ${created.id})`);
    labelToId.set(category.label, created.id);
  }

  return labelToId;
}

export async function seedProducts(categoryIds: Map<string, string>): Promise<void> {
  for (const product of SEED_PRODUCTS) {
    const categoryId = categoryIds.get(product.categoryLabel);

    if (!categoryId) {
      console.error(`Categoria "${product.categoryLabel}" não encontrada para o produto "${product.name}".`);
      continue;
    }

    const existing = await query<{ id: string }>('SELECT id FROM product WHERE name = $1', [
      product.name,
    ]);

    if (existing.rows[0]) {
      console.warn(`Produto "${product.name}" já existe (id: ${existing.rows[0].id}). Nada a fazer.`);
      continue;
    }

    const created = await productRepository.create({
      categoryId,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice ?? null,
      badge: product.badge ?? null,
    });

    console.warn(`Produto criado: ${created.name} (id: ${created.id})`);

    for (const image of product.images) {
      await productImageRepository.create({
        productId: created.id,
        url: image.url,
        displayOrder: image.displayOrder,
        width: image.width,
        height: image.height,
        format: image.format,
        sizeBytes: image.sizeBytes,
      });
    }

    for (const spec of product.specifications) {
      await productSpecificationRepository.create({
        productId: created.id,
        specKey: spec.specKey,
        specValue: spec.specValue,
        displayOrder: spec.displayOrder,
      });
    }

    console.warn(
      `  -> ${product.images.length} imagem(ns) e ${product.specifications.length} especificação(ões) criadas para "${created.name}".`
    );
  }
}
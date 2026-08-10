/**
 * Tipos da entidade PRODUCT_SPECIFICATION.
 *
 * A FK aqui chama-se `product_id` (não `id_product`, como em
 * product_image) — ver nota sobre a inconsistência no início desta
 * etapa. Também sem created_at/updated_at, mesmo motivo de
 * product_image.
 */

export interface ProductSpecificationRow {
  id: string;
  product_id: string;
  spec_key: string;
  spec_value: string;
  display_order: number;
}

export interface ProductSpecification {
  id: string;
  productId: string;
  specKey: string;
  specValue: string;
  displayOrder: number;
}

export interface CreateProductSpecificationData {
  productId: string;
  specKey: string;
  specValue: string;
  displayOrder: number;
}

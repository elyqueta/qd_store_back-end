/**
 * Tipos da entidade PRODUCT_IMAGE.
 *
 * Atenção: a coluna de chave estrangeira aqui é `id_product`
 * (diferente de product_specification, que usa `product_id`) — uma
 * inconsistência já existente no modelo aprovado. Isolamos isso
 * neste ficheiro: fora daqui, todo o resto da aplicação só vê
 * `productId`, nunca precisa saber qual é o nome exato da coluna.
 *
 * Sem created_at/updated_at: esta tabela não tem essas colunas no
 * schema (ver migration) — imagens não têm histórico de edição
 * próprio, só existem/não existem.
 */

export interface ProductImageRow {
  id: string;
  id_product: string;
  url: string;
  display_order: number;
  width: number | null;
  height: number | null;
  format: string | null;
  size_bytes: number | null;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  displayOrder: number;
  width: number | null;
  height: number | null;
  format: string | null;
  sizeBytes: number | null;
}

export interface CreateProductImageData {
  productId: string;
  url: string;
  displayOrder?: number;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  sizeBytes?: number | null;
}

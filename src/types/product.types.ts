/**
 * Tipos relacionados à entidade PRODUCT.
 *
 * Mesmo padrão Row/domínio já usado em category.types.ts e
 * address.types.ts: ProductRow é o formato EXATO devolvido pelo
 * Postgres (snake_case); Product é o formato de domínio (camelCase)
 * que o resto da aplicação enxerga.
 */

/** Valores possíveis de product.status (enum product_status no Postgres). */
export type ProductStatus = 'active' | 'inactive' | 'out_of_stock';

/**
 * Formato exato devolvido pelo Postgres. Só o repository deve
 * conhecer este tipo.
 *
 * `price` e `original_price` vêm como STRING, não number — mesmo
 * motivo já documentado em AddressRow para latitude/longitude: o
 * driver `pg` devolve colunas DECIMAL como string por padrão, para
 * não arriscar perda de precisão em conversão automática para
 * float64. É o repository quem faz a conversão explícita.
 */
export interface ProductRow {
  id: string;
  id_category: string;
  category_name?: string;
  name: string;
  description: string | null;
  price: string;
  original_price: string | null;
  badge: string | null;
  status: ProductStatus;
  created_at: Date;
  updated_at: Date;
}

/** Formato de domínio, usado por service, controller e resposta HTTP. */
export interface Product {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dados que o REPOSITORY precisa para inserir um produto.
 *
 * `status` é omitido de propósito: nasce sempre 'active' por DEFAULT
 * na tabela (mesmo raciocínio já aplicado em CreateCompanyData) — o
 * cliente da API nunca deve poder criar um produto já 'inactive' ou
 * 'out_of_stock' através de um descuido no validator.
 */
export interface CreateProductData {
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  badge?: string | null;
}

/**
 * Filtros aceites por GET /api/products, além da paginação.
 * Começamos com o mínimo que já sabemos ser necessário (filtrar por
 * categoria é um caso de uso óbvio de e-commerce); mais filtros
 * (ex: faixa de preço, busca textual) podem ser adicionados aqui
 * sem quebrar nada, já que é um objeto, não parâmetros posicionais.
 */
export interface ProductFilters {
  categoryId?: string;
  status?: ProductStatus;
}

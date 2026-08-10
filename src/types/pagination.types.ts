/**
 * Tipos de paginação reutilizáveis por QUALQUER domínio da API que
 * precise listar muitos registos (PRODUCT é o primeiro, mas ORDER,
 * WISHLIST, etc. vão reaproveitar exatamente isto).
 *
 * Por que um ficheiro próprio, e não dentro de product.types.ts?
 *
 * Porque paginação não é uma regra do domínio PRODUCT — é uma
 * preocupação transversal (cross-cutting concern), como validate.ts
 * já é para validação. Definir aqui evita que cada domínio futuro
 * reimplemente a mesma forma com nomes ligeiramente diferentes.
 */

export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Formato padronizado de resposta paginada. `total` é o número TOTAL
 * de registos que existem no banco (ignorando a página atual) — é
 * isso que permite ao cliente calcular quantas páginas existem e
 * desenhar um componente de paginação.
 */
export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

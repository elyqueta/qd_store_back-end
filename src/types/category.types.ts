/**
 * Tipos relacionados à entidade CATEGORY.
 *
 * Este ficheiro define os formatos INTERNOS da categoria — aqueles
 * que a própria aplicação controla, sem input externo:
 *
 *   CategoryRow        -> formato exato devolvido pelo Postgres
 *                          (snake_case, tal como as colunas da
 *                          tabela `category`). Só o repository deve
 *                          conhecer este tipo.
 *
 *   Category            -> formato de domínio (camelCase), usado por
 *                          service, controller e na resposta HTTP
 *                          final.
 *
 *   CreateCategoryData  -> dados completos que o REPOSITORY precisa
 *                          para inserir uma categoria — inclui
 *                          `slug`, já gerado pelo service a partir do
 *                          label. Diferente de CreateCategoryInput
 *                          (validators/), que é o que o CLIENTE envia
 *                          via HTTP e nunca contém slug.
 *
 * Os tipos de ENTRADA vindos do cliente (CreateCategoryInput,
 * UpdateCategoryInput) NÃO vivem aqui — são derivados diretamente dos
 * schemas Zod em `validators/category.validator.ts`, evitando
 * duplicar a mesma forma em dois lugares que poderiam divergir com o
 * tempo.
 */

export interface CategoryRow {
  id: string;
  slug: string;
  label: string;
  icon: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  slug: string;
  label: string;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryData {
  slug: string;
  label: string;
  icon?: string | null;
}
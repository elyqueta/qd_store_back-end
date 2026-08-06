import { categoryRepository } from '../repositories/category.repository';
import { Category } from '../types/category.types';
import { CreateCategoryInput, UpdateCategoryInput } from '../validators/category.validator';
import { generateSlug } from '../utils/slug.util';
import { NotFoundError } from '../errors';

/**
 * Cria uma nova categoria.
 *
 * Esta função é o único lugar da aplicação que decide COMO o slug é
 * gerado — reforça a decisão já tomada: o cliente nunca envia slug,
 * só label. Se amanhã mudarmos a estratégia de geração de slug (ex:
 * incluir um hash curto para evitar colisões), a mudança fica
 * isolada aqui, sem tocar no repository nem no controller.
 */
async function create(input: CreateCategoryInput): Promise<Category> {
  const slug = generateSlug(input.label);

  return categoryRepository.create({
    slug,
    label: input.label,
    icon: input.icon ?? null,
  });
}

async function findAll(): Promise<Category[]> {
  return categoryRepository.findAll();
}

/**
 * Busca uma categoria por id, garantindo que ela existe.
 *
 * Esta é a fronteira exata onde "não encontrado" deixa de ser um
 * detalhe de acesso a dados (Category | null, no repository) e passa
 * a ser um erro de domínio (NotFoundError, que o errorHandler global
 * transforma em HTTP 404). O controller nunca precisa de checar
 * `if (!category)` — se chegou aqui sem lançar, a categoria existe.
 */
async function findById(id: string): Promise<Category> {
  const category = await categoryRepository.findById(id);

  if (!category) {
    throw new NotFoundError(`Categoria com id "${id}" não encontrada.`);
  }

  return category;
}

/**
 * Atualiza uma categoria parcialmente.
 *
 * Repare que NÃO chamamos findById antes de update — seria uma
 * query extra e desnecessária. O repository.update já devolve `null`
 * quando o WHERE id = $1 não encontra nenhuma linha, e é isso que
 * usamos aqui para decidir entre sucesso e NotFoundError.
 */
async function update(id: string, input: UpdateCategoryInput): Promise<Category> {
  const updated = await categoryRepository.update(id, input);

  if (!updated) {
    throw new NotFoundError(`Categoria com id "${id}" não encontrada.`);
  }

  return updated;
}

/**
 * Remove uma categoria.
 *
 * Devolve `void`: quem chama (controller) só precisa de saber que,
 * se esta função não lançou, a remoção foi bem-sucedida — não há
 * nenhum dado útil para devolver depois de apagar algo.
 */
async function remove(id: string): Promise<void> {
  const deleted = await categoryRepository.remove(id);

  if (!deleted) {
    throw new NotFoundError(`Categoria com id "${id}" não encontrada.`);
  }
}

export const categoryService = {
  create,
  findAll,
  findById,
  update,
  remove,
};

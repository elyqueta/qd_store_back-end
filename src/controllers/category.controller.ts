import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { categoryService } from '../services/category.service';
import {
  CategoryIdParam,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../validators/category.validator';

/**
 * POST /api/categories
 *
 * `req.body` já chega tipado como CreateCategoryInput. Isso não
 * acontece "magicamente" — é uma promessa que o middleware de
 * validação (adicionado nas routes, próximo passo) precisa cumprir
 * ANTES desta função ser chamada. O controller confia nesse
 * contrato e não revalida nada — validar duas vezes a mesma coisa
 * seria trabalho redundante e uma responsabilidade fora do lugar.
 */
const create = asyncHandler(
  async (req: Request<Record<string, string>, unknown, CreateCategoryInput>, res: Response) => {
    const category = await categoryService.create(req.body);

    res.status(201).json({
      status: 'success',
      data: category,
    });
  }
);

/**
 * GET /api/categories
 *
 * Não precisa de params nem body — apenas devolve a lista completa.
 * Paginação fica fora do escopo por agora (categorias tendem a ser
 * uma lista pequena e finita, ao contrário de PRODUCT, que
 * certamente vai precisar de paginação quando chegarmos lá).
 */
const findAll = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryService.findAll();

  res.status(200).json({
    status: 'success',
    data: categories,
    count: categories.length,
  });
});

/**
 * GET /api/categories/:id
 *
 * Se o id não existir, categoryService.findById lança NotFoundError
 * — o controller nunca escreve um `if (!category) res.status(404)`.
 * O erro sobe pelo `await`, o asyncHandler encaminha para
 * `next(error)`, e o errorHandler global converte isso em 404 de
 * forma padronizada. Esta função só existe para o caminho feliz.
 */
const findById = asyncHandler(
  async (req: Request<CategoryIdParam>, res: Response) => {
    const category = await categoryService.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: category,
    });
  }
);

/**
 * PATCH /api/categories/:id
 *
 * Combina dois tipos genéricos: CategoryIdParam (vem da URL) e
 * UpdateCategoryInput (vem do corpo da requisição). Ambos assumidos
 * já validados pelo middleware, pelo mesmo motivo explicado em
 * `create`.
 */
const update = asyncHandler(
  async (req: Request<CategoryIdParam, unknown, UpdateCategoryInput>, res: Response) => {
    const category = await categoryService.update(req.params.id, req.body);

    res.status(200).json({
      status: 'success',
      data: category,
    });
  }
);

/**
 * DELETE /api/categories/:id
 *
 * `res.status(204).send()` — sem `.json(...)`. Um corpo de resposta
 * em 204 violaria a própria semântica do status "No Content"; alguns
 * clientes HTTP até rejeitam ou ignoram corpo nesse caso.
 */
const remove = asyncHandler(async (req: Request<CategoryIdParam>, res: Response) => {
  await categoryService.remove(req.params.id);

  res.status(204).send();
});

export const categoryController = {
  create,
  findAll,
  findById,
  update,
  remove,
};
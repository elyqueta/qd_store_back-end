import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { productService } from '../services/product.service';
import {
  CreateProductInput,
  ListProductsQuery,
  ProductIdParam,
  UpdateProductInput,
} from '../validators/product.validator';

const create = asyncHandler(
  async (req: Request<Record<string, string>, unknown, CreateProductInput>, res: Response) => {
    const product = await productService.create(req.body);

    res.status(201).json({
      status: 'success',
      data: product,
    });
  }
);

/**
 * GET /api/products
 *
 * req.query já chega tipado e transformado (page/limit como number,
 * não string) graças ao middleware `validate` — o controller só
 * separa o que é filtro do que é paginação e delega ao service.
 *
 * O envelope de resposta inclui `pagination` como objeto próprio,
 * separado de `data` — assim o front-end nunca confunde "quantos
 * itens vieram nesta página" (data.length) com "quantos existem no
 * total" (pagination.total).
 */
const findAll = asyncHandler(async (req: Request, res: Response) => {
  /**
   * asyncHandler tipa req.query como ParsedQs (padrão genérico do
   * Express), porque só `P` é parametrizável nele. Alterar
   * asyncHandler.ts afetaria todos os outros controllers — em vez
   * disso, fazemos aqui um cast local e documentado: o middleware
   * validate({ query: listProductsQuerySchema }) já GARANTIU, em
   * runtime, que req.query tem este formato exato (page/limit já
   * convertidos para number via z.coerce) antes desta função rodar.
   */
  const { page, limit, categoryId, status } = req.query as unknown as ListProductsQuery;

  const result = await productService.findAll({ categoryId, status }, { page, limit });

  res.status(200).json({
    status: 'success',
    data: result.data,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

const findById = asyncHandler(async (req: Request<ProductIdParam>, res: Response) => {
  const product = await productService.findById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: product,
  });
});

const update = asyncHandler(
  async (req: Request<ProductIdParam, unknown, UpdateProductInput>, res: Response) => {
    const product = await productService.update(req.params.id, req.body);

    res.status(200).json({
      status: 'success',
      data: product,
    });
  }
);

const remove = asyncHandler(async (req: Request<ProductIdParam>, res: Response) => {
  await productService.remove(req.params.id);

  res.status(204).send();
});

export const productController = {
  create,
  findAll,
  findById,
  update,
  remove,
};

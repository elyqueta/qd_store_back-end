import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { productSpecificationService } from '../services/productSpecification.service';
import {
  CreateProductSpecificationInput,
  ProductIdOnlyParam,
  ProductSpecificationParam,
  UpdateProductSpecificationInput,
} from '../validators/productSpecification.validator';

const create = asyncHandler(
  async (
    req: Request<ProductIdOnlyParam, unknown, CreateProductSpecificationInput>,
    res: Response
  ) => {
    const spec = await productSpecificationService.create(req.params.productId, req.body);

    res.status(201).json({ status: 'success', data: spec });
  }
);

const findAll = asyncHandler(async (req: Request<ProductIdOnlyParam>, res: Response) => {
  const specs = await productSpecificationService.findAllByProduct(req.params.productId);

  res.status(200).json({ status: 'success', data: specs, count: specs.length });
});

const update = asyncHandler(
  async (
    req: Request<ProductSpecificationParam, unknown, UpdateProductSpecificationInput>,
    res: Response
  ) => {
    const spec = await productSpecificationService.update(
      req.params.productId,
      req.params.id,
      req.body
    );

    res.status(200).json({ status: 'success', data: spec });
  }
);

const remove = asyncHandler(async (req: Request<ProductSpecificationParam>, res: Response) => {
  await productSpecificationService.remove(req.params.productId, req.params.id);

  res.status(204).send();
});

export const productSpecificationController = {
  create,
  findAll,
  update,
  remove,
};

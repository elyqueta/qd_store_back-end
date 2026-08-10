import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { productImageService } from '../services/productImage.service';
import {
  CreateProductImageInput,
  ProductIdOnlyParam,
  ProductImageParam,
  UpdateProductImageInput,
} from '../validators/productImage.validator';

const create = asyncHandler(
  async (req: Request<ProductIdOnlyParam, unknown, CreateProductImageInput>, res: Response) => {
    const image = await productImageService.create(req.params.productId, req.body);

    res.status(201).json({ status: 'success', data: image });
  }
);

const findAll = asyncHandler(async (req: Request<ProductIdOnlyParam>, res: Response) => {
  const images = await productImageService.findAllByProduct(req.params.productId);

  res.status(200).json({ status: 'success', data: images, count: images.length });
});

const update = asyncHandler(
  async (req: Request<ProductImageParam, unknown, UpdateProductImageInput>, res: Response) => {
    const image = await productImageService.update(req.params.productId, req.params.id, req.body);

    res.status(200).json({ status: 'success', data: image });
  }
);

const remove = asyncHandler(async (req: Request<ProductImageParam>, res: Response) => {
  await productImageService.remove(req.params.productId, req.params.id);

  res.status(204).send();
});

export const productImageController = {
  create,
  findAll,
  update,
  remove,
};

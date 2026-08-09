import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { addressService } from '../services/address.service';
import {
  AddressIdParam,
  CreateAddressInput,
  UpdateAddressInput,
} from '../validators/address.validator';

/**
 * Extrai o id do utilizador SEMPRE do token (req.user.sub), NUNCA de
 * req.params ou req.body — esta é a materialização concreta da
 * decisão "Opção B: dono implícito via token" tomada na Etapa 1.
 *
 * O `!` é seguro aqui pelo mesmo motivo já documentado no service:
 * o middleware `authenticate` (montado em address.routes.ts, ver
 * Passo 9) sempre roda antes de qualquer handler deste controller.
 * Se req.user estivesse ausente, a requisição já teria sido barrada
 * com 401 muito antes de chegar aqui.
 */
function getUserId(req: Request): string {
  return req.user!.sub;
}

const create = asyncHandler(
  async (req: Request<Record<string, string>, unknown, CreateAddressInput>, res: Response) => {
    const address = await addressService.create(getUserId(req), req.body);

    res.status(201).json({ status: 'success', data: address });
  }
);

const findAll = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await addressService.findAllByUser(getUserId(req));

  res.status(200).json({ status: 'success', data: addresses, count: addresses.length });
});

const findById = asyncHandler(async (req: Request<AddressIdParam>, res: Response) => {
  const address = await addressService.findOwnedById(getUserId(req), req.params.id);

  res.status(200).json({ status: 'success', data: address });
});

const update = asyncHandler(
  async (req: Request<AddressIdParam, unknown, UpdateAddressInput>, res: Response) => {
    const address = await addressService.update(getUserId(req), req.params.id, req.body);

    res.status(200).json({ status: 'success', data: address });
  }
);

const remove = asyncHandler(async (req: Request<AddressIdParam>, res: Response) => {
  await addressService.remove(getUserId(req), req.params.id);

  res.status(204).send();
});

/**
 * PATCH /api/addresses/:id/default — sem corpo de requisição
 * (conforme decidido). O `:id` na URL já contém toda a informação
 * necessária; o `userId` do token garante que só o dono pode
 * executar esta ação sobre os próprios endereços.
 */
const setAsDefault = asyncHandler(async (req: Request<AddressIdParam>, res: Response) => {
  const address = await addressService.setAsDefault(getUserId(req), req.params.id);

  res.status(200).json({ status: 'success', data: address });
});

export const addressController = {
  create,
  findAll,
  findById,
  update,
  remove,
  setAsDefault,
};

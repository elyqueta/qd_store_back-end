import { Request, Response } from 'express';
import { ANGOLA_PROVINCES, findProvinceBySlug } from '../data/angola-locations';
import { ProvinceSlugParam } from '../validators/location.validator';
import { NotFoundError } from '../errors';

/**
 * Nenhuma função deste controller usa `asyncHandler` nem `async`.
 * Diferente de todos os outros controllers do projeto, LOCATION não
 * faz nenhuma operação assíncrona (sem query ao banco, sem chamada
 * de rede) — os dados vêm inteiramente de `ANGOLA_PROVINCES`, um
 * array carregado em memória. `asyncHandler` existe especificamente
 * para capturar REJEIÇÕES DE PROMISE que o Express não trata
 * nativamente; como não há Promise nenhuma aqui, envolvê-las nele
 * seria aplicar uma solução a um problema que não existe.
 *
 * Um `throw` SÍNCRONO (como o de `listMunicipalities` abaixo) já é
 * capturado nativamente pelo Express e encaminhado ao errorHandler
 * global — isso funciona sem qualquer wrapper adicional, desde a
 * primeira versão do Express.
 */

const listAll = (_req: Request, res: Response): void => {
  const provinces = ANGOLA_PROVINCES.map((province) => ({
    slug: province.slug,
    name: province.name,
    municipalities: [...province.municipalities].sort((a, b) => a.localeCompare(b, 'pt')),
  })).sort((a, b) => a.name.localeCompare(b.name, 'pt'));

  res.status(200).json({
    status: 'success',
    data: provinces,
    count: provinces.length,
  });
};

const listProvinces = (_req: Request, res: Response): void => {
  const provinces = ANGOLA_PROVINCES.map((province) => ({
    slug: province.slug,
    name: province.name,
  })).sort((a, b) => a.name.localeCompare(b.name, 'pt'));

  res.status(200).json({
    status: 'success',
    data: provinces,
    count: provinces.length,
  });
};

const listMunicipalities = (req: Request<ProvinceSlugParam>, res: Response): void => {
  const province = findProvinceBySlug(req.params.province);

  if (!province) {
    throw new NotFoundError(`Província com slug "${req.params.province}" não encontrada.`);
  }

  const municipalities = [...province.municipalities].sort((a, b) => a.localeCompare(b, 'pt'));

  res.status(200).json({
    status: 'success',
    data: municipalities,
    count: municipalities.length,
  });
};

export const locationController = {
  listAll,
  listProvinces,
  listMunicipalities,
};

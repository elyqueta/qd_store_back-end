import { addressRepository } from '../repositories/address.repository';
import { Address } from '../types/address.types';
import { CreateAddressInput, UpdateAddressInput } from '../validators/address.validator';
import { findMunicipalityInProvince, findProvinceByName } from '../data/angola-locations';
import { NotFoundError } from '../errors';

/**
 * O validator Zod já GARANTIU que esta combinação existe entre as
 * 21 províncias — aqui não estamos validando de novo, estamos só
 * resolvendo a GRAFIA CANÔNICA (ex: "luanda" digitado pelo cliente
 * -> "Luanda" como está no dataset) para persistir no banco sempre
 * de forma consistente, conforme decidido.
 *
 * O `!` depois de `findProvinceByName(...)` e `findMunicipalityIn...`
 * é seguro aqui — não seria em geral, mas é seguro NESTE ponto
 * específico porque o Zod já rodou antes (na camada de middleware
 * `validate`) e teria rejeitado a requisição com 422 se a combinação
 * não existisse. Se chegamos até aqui, a existência já está provada.
 */
function resolveCanonicalLocation(
  province: string,
  municipality: string
): { province: string; municipality: string } {
  const provinceMatch = findProvinceByName(province)!;
  const municipalityMatch = findMunicipalityInProvince(provinceMatch, municipality)!;

  return { province: provinceMatch.name, municipality: municipalityMatch };
}

/**
 * Regra de negócio "primeiro endereço vira padrão automaticamente":
 * perguntamos ao repository quantos endereços este utilizador já
 * tem ANTES de decidir o valor de isDefault a enviar para o INSERT.
 * Esta é uma das poucas queries de LEITURA que fazemos só para
 * alimentar uma decisão — não para devolver dado ao cliente.
 */
async function create(userId: string, input: CreateAddressInput): Promise<Address> {
  const { province, municipality } = resolveCanonicalLocation(input.province, input.municipality);
  const existingCount = await addressRepository.countByUser(userId);

  return addressRepository.create({
    userId,
    label: input.label ?? null,
    province,
    municipality,
    neighborhood: input.neighborhood,
    address: input.address,
    reference: input.reference ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    isDefault: existingCount === 0,
  });
}

async function findAllByUser(userId: string): Promise<Address[]> {
  return addressRepository.findAllByUser(userId);
}

/**
 * Busca um endereço garantindo POSSE — usada tanto pelo controller
 * (GET /:id) quanto internamente por `update` e `remove` abaixo,
 * antes de qualquer mutação.
 *
 * Por que NotFoundError (404) e não ForbiddenError (403) quando o
 * endereço existe mas é de OUTRO utilizador?
 *
 * Decisão de segurança deliberada: 403 revelaria "este id existe, só
 * que não é seu" — uma fuga de informação (o atacante aprenderia que
 * aquele UUID é válido, e poderia tentar enumerar outros). 404 trata
 * "não existe" e "existe mas não é seu" exatamente da mesma forma do
 * ponto de vista do cliente da API, sem vazar qual dos dois casos
 * realmente aconteceu.
 */
async function findOwnedById(userId: string, id: string): Promise<Address> {
  const address = await addressRepository.findById(id);

  if (!address || address.userId !== userId) {
    throw new NotFoundError('Endereço não encontrado.');
  }

  return address;
}

async function update(userId: string, id: string, input: UpdateAddressInput): Promise<Address> {
  // Confirma posse ANTES de qualquer tentativa de update — evita
  // que um utilizador descubra, pela mensagem de erro, se um id de
  // outra pessoa existe ou não (mesmo raciocínio de findOwnedById).
  await findOwnedById(userId, id);

  const resolvedInput: UpdateAddressInput = { ...input };

  if (input.province !== undefined && input.municipality !== undefined) {
    const { province, municipality } = resolveCanonicalLocation(input.province, input.municipality);
    resolvedInput.province = province;
    resolvedInput.municipality = municipality;
  }

  const updated = await addressRepository.update(id, resolvedInput);

  if (!updated) {
    throw new NotFoundError('Endereço não encontrado.');
  }

  return updated;
}

async function remove(userId: string, id: string): Promise<void> {
  await findOwnedById(userId, id);
  await addressRepository.remove(id);
}

/**
 * Note que este service NÃO chama `findOwnedById` antes de delegar
 * ao repository — de propósito. A checagem de posse já acontece
 * DENTRO da transação de `addressRepository.setAsDefault` (ver
 * comentário detalhado lá sobre a condição de corrida TOCTOU que
 * isso evita). Duplicar a checagem aqui seria uma query extra
 * desnecessária, e pior: uma checagem "fora de sincronia" com a que
 * realmente importa (a de dentro da transação).
 */
async function setAsDefault(userId: string, id: string): Promise<Address> {
  const updated = await addressRepository.setAsDefault(id, userId);

  if (!updated) {
    throw new NotFoundError('Endereço não encontrado.');
  }

  return updated;
}

export const addressService = {
  create,
  findAllByUser,
  findOwnedById,
  update,
  remove,
  setAsDefault,
};

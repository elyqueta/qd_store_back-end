import { getClient, query } from '../database/pool';
import { Address, AddressRow, CreateAddressData } from '../types/address.types';
import { UpdateAddressInput } from '../validators/address.validator';

function toAddress(row: AddressRow): Address {
  return {
    id: row.id,
    userId: row.id_user,
    label: row.label,
    province: row.province,
    municipality: row.municipality,
    neighborhood: row.neighborhood,
    address: row.address,
    reference: row.reference,
    // Conversão explícita DECIMAL (string) -> number, explicada em
    // address.types.ts. `Number(null)` daria 0, o que estaria
    // ERRADO aqui (0 é uma coordenada válida, perto do Equador/
    // Meridiano de Greenwich) — por isso o check condicional.
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const RETURNING_COLUMNS = `id, id_user, label, province, municipality, neighborhood, address,
  reference, latitude, longitude, is_default, created_at, updated_at`;

async function create(data: CreateAddressData): Promise<Address> {
  const result = await query<AddressRow>(
    `INSERT INTO address
       (id_user, label, province, municipality, neighborhood, address, reference, latitude, longitude, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${RETURNING_COLUMNS}`,
    [
      data.userId,
      data.label ?? null,
      data.province,
      data.municipality,
      data.neighborhood,
      data.address,
      data.reference ?? null,
      data.latitude ?? null,
      data.longitude ?? null,
      data.isDefault,
    ]
  );

  return toAddress(result.rows[0] as AddressRow);
}

/**
 * Usada pelo SERVICE para decidir se este é o primeiro endereço do
 * utilizador (regra "primeiro endereço vira padrão automaticamente").
 * `::int` converte o resultado de COUNT (que o Postgres devolve como
 * bigint) para um inteiro comum — seguro aqui porque nenhum
 * utilizador real vai ter mais endereços do que cabe num INT.
 */
async function countByUser(userId: string): Promise<number> {
  const result = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM address WHERE id_user = $1`,
    [userId]
  );

  return result.rows[0]?.count ?? 0;
}

/**
 * Lista os endereços de um utilizador. `ORDER BY is_default DESC`
 * garante que o endereço padrão sempre aparece PRIMEIRO na lista —
 * conveniente para o front-end pré-selecionar automaticamente a
 * primeira opção num checkout, sem precisar procurar qual é o
 * padrão dentro do array.
 */
async function findAllByUser(userId: string): Promise<Address[]> {
  const result = await query<AddressRow>(
    `SELECT ${RETURNING_COLUMNS}
     FROM address
     WHERE id_user = $1
     ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );

  return result.rows.map(toAddress);
}

/**
 * Busca por id, SEM filtrar por id_user. A checagem "este endereço
 * pertence a este utilizador?" é responsabilidade do SERVICE (ver
 * address.service.ts), não do repository — mesma separação já usada
 * no restante do projeto entre "buscar dado" e "decidir HTTP 404 vs
 * 403 com base em posse".
 */
async function findById(id: string): Promise<Address | null> {
  const result = await query<AddressRow>(`SELECT ${RETURNING_COLUMNS} FROM address WHERE id = $1`, [
    id,
  ]);

  const row = result.rows[0];
  return row ? toAddress(row) : null;
}

async function update(id: string, data: UpdateAddressInput): Promise<Address | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if ('label' in data) {
    fields.push(`label = $${paramIndex}`);
    values.push(data.label);
    paramIndex += 1;
  }
  if (data.province !== undefined) {
    fields.push(`province = $${paramIndex}`);
    values.push(data.province);
    paramIndex += 1;
  }
  if (data.municipality !== undefined) {
    fields.push(`municipality = $${paramIndex}`);
    values.push(data.municipality);
    paramIndex += 1;
  }
  if (data.neighborhood !== undefined) {
    fields.push(`neighborhood = $${paramIndex}`);
    values.push(data.neighborhood);
    paramIndex += 1;
  }
  if (data.address !== undefined) {
    fields.push(`address = $${paramIndex}`);
    values.push(data.address);
    paramIndex += 1;
  }
  if ('reference' in data) {
    fields.push(`reference = $${paramIndex}`);
    values.push(data.reference);
    paramIndex += 1;
  }
  if ('latitude' in data) {
    fields.push(`latitude = $${paramIndex}`);
    values.push(data.latitude);
    paramIndex += 1;
  }
  if ('longitude' in data) {
    fields.push(`longitude = $${paramIndex}`);
    values.push(data.longitude);
    paramIndex += 1;
  }

  if (fields.length === 0) {
    return findById(id);
  }

  values.push(id);

  const result = await query<AddressRow>(
    `UPDATE address
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING ${RETURNING_COLUMNS}`,
    values
  );

  const row = result.rows[0];
  return row ? toAddress(row) : null;
}

/**
 * DELETE físico — decisão já justificada na Etapa 1: `order_address`
 * usa snapshot pattern (`ON DELETE SET NULL`), então apagar um
 * endereço nunca corrompe o histórico de pedidos já feitos.
 */
async function remove(id: string): Promise<boolean> {
  const result = await query('DELETE FROM address WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Troca o endereço padrão de um utilizador — a ÚNICA função deste
 * domínio que usa uma transação explícita via `getClient()`.
 *
 * Por que precisa de transação, em detalhe:
 *
 * O índice único parcial `ux_address_one_default_per_user` (ver
 * migration) garante que, em qualquer INSTANTE, existe no máximo UM
 * endereço com `is_default = true` por utilizador. Trocar o padrão
 * exige DUAS operações: desmarcar o antigo, marcar o novo. Se essas
 * duas operações rodassem como queries soltas (fora de uma
 * transação) e o processo falhasse entre uma e outra (crash, timeout,
 * erro de rede), o utilizador ficaria sem NENHUM endereço padrão —
 * um estado que a aplicação nunca deveria permitir, nem por um
 * instante visível a outra requisição concorrente.
 *
 * Por que desmarcar o antigo ANTES de marcar o novo (nesta ordem, e
 * não a inversa)?
 *
 * Se tentássemos marcar o novo como padrão ANTES de desmarcar o
 * antigo, teríamos DOIS endereços com is_default = true ao mesmo
 * tempo, mesmo que só por uma fração de segundo dentro da transação
 * — e o índice único parcial REJEITARIA essa segunda UPDATE
 * imediatamente com um erro de violação de unicidade. Desmarcar
 * primeiro garante que nunca existe mais de um `true` simultaneamente.
 *
 * Por que a checagem de posse (o endereço pertence a este userId?)
 * acontece DENTRO da transação, via SELECT, em vez de o SERVICE
 * checar antes de chamar esta função?
 *
 * Para evitar uma condição de corrida (race condition) clássica
 * chamada TOCTOU ("time-of-check to time-of-use"): se o service
 * checasse a posse numa query separada, e só DEPOIS chamasse esta
 * função, existiria uma janela de tempo entre as duas chamadas em
 * que o estado poderia mudar (ex: o endereço ser apagado por outra
 * requisição concorrente). Fazer a checagem dentro da MESMA
 * transação que faz a mutação garante que a decisão é tomada com
 * dados que não podem mais mudar por baixo dos nossos pés.
 */
async function setAsDefault(id: string, userId: string): Promise<Address | null> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const ownershipCheck = await client.query(
      `SELECT id FROM address WHERE id = $1 AND id_user = $2`,
      [id, userId]
    );

    if (ownershipCheck.rowCount === 0) {
      // Endereço não existe, ou existe mas é de outro utilizador —
      // tratamos os dois casos da mesma forma (404), pelo mesmo
      // motivo de segurança já explicado no service (nunca revelar
      // que um id pertence a outra pessoa).
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `UPDATE address SET is_default = false WHERE id_user = $1 AND is_default = true`,
      [userId]
    );

    const updated = await client.query<AddressRow>(
      `UPDATE address SET is_default = true
       WHERE id = $1
       RETURNING ${RETURNING_COLUMNS}`,
      [id]
    );

    await client.query('COMMIT');

    return toAddress(updated.rows[0] as AddressRow);
  } catch (err) {
    // Qualquer erro em QUALQUER passo acima (incluindo o improvável
    // caso do índice único ainda assim disparar) desfaz TODAS as
    // mudanças desta transação — o banco volta exatamente ao estado
    // de antes do BEGIN, como se nada tivesse acontecido.
    await client.query('ROLLBACK');
    throw err;
  } finally {
    // SEMPRE devolve a conexão ao pool, em QUALQUER caminho de saída
    // (sucesso, erro, ou o retorno antecipado no ROLLBACK do "não
    // encontrado"). Esquecer isto é a causa nº1 de esgotamento do
    // pool de conexões, como já avisa o comentário original de
    // database/pool.ts — por isso `finally`, não um `release()`
    // solto ao final da função, que nunca rodaria se algo lançasse
    // exceção antes de chegar lá.
    client.release();
  }
}

export const addressRepository = {
  create,
  countByUser,
  findAllByUser,
  findById,
  update,
  remove,
  setAsDefault,
};

/**
 * Tipos da entidade ADDRESS. Mesmo padrão Row/domínio já usado em
 * category.types.ts e user.types.ts.
 *
 * Ponto de atenção específico deste domínio: as colunas `latitude` e
 * `longitude` são DECIMAL no Postgres, e o driver `pg` devolve
 * DECIMAL como STRING por padrão — não como number. Isso é
 * intencional do lado do driver: converter automaticamente para
 * float64 arriscaria perder precisão em valores muito grandes ou com
 * muitas casas decimais. Por isso `AddressRow` tipa os dois campos
 * como `string | null`, e é o repository (a única camada que
 * conhece os dois formatos) quem faz a conversão explícita para
 * `number | null` no tipo de domínio `Address`.
 *
 * Outro ponto: a coluna `address` (linha/endereço em texto livre) e
 * a TABELA `address` têm o mesmo nome — coincidência do modelo já
 * aprovado, não nossa escolha. Isso significa que o tipo `Address`
 * (a entidade) tem um campo chamado `address` (a rua/número em
 * texto). Um pouco estranho de ler à primeira vista, mas é fiel ao
 * modelo de dados original.
 */

export interface AddressRow {
  id: string;
  id_user: string;
  label: string | null;
  province: string;
  municipality: string;
  neighborhood: string;
  address: string;
  reference: string | null;
  latitude: string | null;
  longitude: string | null;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Address {
  id: string;
  userId: string;
  label: string | null;
  province: string;
  municipality: string;
  neighborhood: string;
  address: string;
  reference: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dados que o REPOSITORY precisa para inserir um endereço.
 *
 * `isDefault` é OBRIGATÓRIO aqui (não opcional) de propósito: essa é
 * a regra de negócio "primeiro endereço vira padrão automaticamente"
 * que o SERVICE decide (contando quantos endereços o utilizador já
 * tem) antes de chamar o repository — o repository nunca decide
 * sozinho, só executa o que o service já resolveu.
 */
export interface CreateAddressData {
  userId: string;
  label?: string | null;
  province: string;
  municipality: string;
  neighborhood: string;
  address: string;
  reference?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

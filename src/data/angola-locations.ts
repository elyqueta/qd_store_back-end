/**
 * Dataset estático da divisão político-administrativa de Angola,
 * segundo a Lei n.º 14/24, de 5 de Setembro (Lei da Divisão
 * Político-Administrativa), em vigor desde 1 de Janeiro de 2025:
 * 21 províncias e os respectivos municípios.
 *
 * Por que um dataset estático em código, e não tabelas PROVINCE/
 * MUNICIPALITY no banco de dados?
 *
 * O modelo relacional já aprovado define `address.province` e
 * `address.municipality` como VARCHAR(100) livres, de propósito —
 * criar tabelas novas para isto seria remodelar um esquema já
 * fechado sem necessidade real. Uma lista de 21 províncias,
 * praticamente imutável no dia a dia (só muda por reforma
 * administrativa nacional, um evento raro), é um caso de uso
 * legítimo para dado estático em código: não muda a cada deploy,
 * não precisa de uma tela de admin para editar, e o cliente só faz
 * LEITURA — nunca escrita.
 *
 * Este arquivo alimenta duas frentes da aplicação:
 *   1. O endpoint público GET /api/locations/... (o front-end usa
 *      para montar dropdowns em cascata província -> município).
 *   2. O validator de ADDRESS (Zod), que usa as funções abaixo para
 *      rejeitar combinações inválidas antes de qualquer dado chegar
 *      ao banco.
 *
 * As duas pontas (validação no back-end, opções mostradas no
 * front-end) nunca ficam dessincronizadas: é a MESMA fonte de
 * verdade para as duas.
 *
 * Fonte dos dados: Lei n.º 14/24, de 5 de Setembro de 2024 (Diário
 * da República, I Série, n.º 171), em vigor desde 01/01/2025.
 *
 * Nota de manutenção: se a divisão administrativa mudar de novo no
 * futuro (já aconteceu mais de uma vez na história do país), a
 * correção fica isolada a este único arquivo — nenhuma outra parte
 * do sistema precisa ser tocada, porque tudo consome estes dados
 * através de `findProvinceByName` / `findMunicipalityInProvince`,
 * nunca acessando `ANGOLA_PROVINCES` diretamente.
 */

export interface ProvinceLocation {
  readonly slug: string;
  readonly name: string;
  readonly municipalities: readonly string[];
}

export const ANGOLA_PROVINCES: readonly ProvinceLocation[] = [
  {
    slug: 'bengo',
    name: 'Bengo',
    municipalities: [
      'Ambriz',
      'Nambuangongo',
      'Muxaluando',
      'Dande',
      'Quicunzo',
      'Bula Atumba',
      'Piri',
      'Quibaxe',
      'Pango Aluquém',
      'Úcua',
      'Panguila',
      'Barra do Dande',
    ],
  },
  {
    slug: 'benguela',
    name: 'Benguela',
    municipalities: [
      'Baía Farta',
      'Balombo',
      'Benguela',
      'Biópio',
      'Bocoio',
      'Babaera',
      'Capupa',
      'Catengue',
      'Catumbela',
      'Canhamela',
      'Caímbambo',
      'Chila',
      'Chindumbo',
      'Chicuma',
      'Chongorói',
      'Cubal',
      'Dombe Grande',
      'Egito Praia',
      'Ganda',
      'Iambala',
      'Lobito',
      'Navegantes',
      'Bolonguera',
    ],
  },
  {
    slug: 'bie',
    name: 'Bié',
    municipalities: [
      'Andulo',
      'Belo Horizonte',
      'Calucinga',
      'Camacupa',
      'Cambândua',
      'Catabola',
      'Chicala',
      'Chinguar',
      'Chipeta',
      'Chitembo',
      'Cuemba',
      'Cuíto',
      'Cunhinga',
      'Luando',
      'Lúbia',
      'Mumbué',
      'Nharêa',
      'Ringoma',
      'Umpulo',
    ],
  },
  {
    slug: 'cabinda',
    name: 'Cabinda',
    municipalities: [
      'Massabi',
      'Cacongo',
      'Buco Zau',
      'Necuto',
      'Tando Zinze',
      'Liambo',
      'Cabinda',
      'Ngoio',
      'Belize',
      'Miconje',
    ],
  },
  {
    slug: 'cuando',
    name: 'Cuando',
    municipalities: [
      'Cuito Cuanavale',
      'Dima',
      'Mavinga',
      'Rivungo',
      'Xipundo',
      'Luengue',
      'Dirico',
      'Mucusso',
      'Luiana',
    ],
  },
  {
    slug: 'cubango',
    name: 'Cubango',
    municipalities: [
      'Menongue',
      'Cutato',
      'Cuchi',
      'Chinguanja',
      'Caiundo',
      'Savate',
      'Longa',
      'Nancova',
      'Cuangar',
      'Mavingue',
      'Calai',
    ],
  },
  {
    slug: 'cunene',
    name: 'Cunene',
    municipalities: [
      'Cafima',
      'Cahama',
      'Chiedi',
      'Chissuata',
      'Chitado',
      'Cuvelai',
      'Cuanhama',
      'Curoca',
      'Humbe',
      'Mupa',
      'Naulila',
      'Nehone',
      'Namacunde',
      'Ombada',
    ],
  },
  {
    slug: 'cuanza-norte',
    name: 'Cuanza Norte',
    municipalities: [
      'Bolongongo',
      'Tango',
      'Ambaca',
      'Luinga',
      'Terreiro',
      'Quiculungo',
      'Aldeia Nova',
      'Banga',
      'Samba Cajú',
      'Caculo Cabaça',
      'Lucala',
      'Ngonguemo',
      'Golungo Alto',
      'Cazengo',
      'Cambambe',
      'Cerca',
      'Massangano',
    ],
  },
  {
    slug: 'cuanza-sul',
    name: 'Cuanza Sul',
    municipalities: [
      'Quirimbo',
      'Munenga',
      'Cassongue',
      'Calulo',
      'Quilenda',
      'Mussende',
      'Porto Amboim',
      'Boa Entrada',
      'Quibala',
      'Lonhe',
      'Gabela',
      'Condé',
      'Ebo',
      'Sanga',
      'Waku Kungo',
      'Sumbe',
      'Gangula',
      'Conda',
      'Seles',
      'Amboiva',
      'Gungo',
      'Pambangala',
    ],
  },
  {
    slug: 'huambo',
    name: 'Huambo',
    municipalities: [
      'Bailundo',
      'Cachiungo',
      'Caála',
      'Ecunha',
      'Huambo',
      'Londuimbali',
      'Longonjo',
      'Mungo',
      'Tchicala Tcholohanga',
      'Tchindjenje',
    ],
  },
  {
    slug: 'huila',
    name: 'Huíla',
    municipalities: [
      'Cacula',
      'Caconda',
      'Caluquembe',
      'Capelongo',
      'Capunda Cavilongo',
      'Chicomba',
      'Chicungo',
      'Chibia',
      'Chipindo',
      'Chituto',
      'Cuvango',
      'Dongo',
      'Galangue',
      'Gambos',
      'Hoque',
      'Humpata',
      'Jamba Mineira',
      'Lubango',
      'Matala',
      'Palanca',
      'Quilengues',
      'Quipungo',
      'Viti Vivali',
    ],
  },
  {
    slug: 'icolo-e-bengo',
    name: 'Ícolo e Bengo',
    municipalities: ['Bom Jesus', 'Cabiri', 'Cabo Ledo', 'Calumbo', 'Catete', 'Quiçama', 'Sequele'],
  },
  {
    slug: 'luanda',
    name: 'Luanda',
    municipalities: [
      'Ingombota',
      'Sambizanga',
      'Rangel',
      'Maianga',
      'Samba',
      'Talatona',
      'Mussulo',
      'Hoji ya Henda',
      'Cazenga',
      'Cacuaco',
      'Kilamba Kiaxi',
      'Mulenvos',
      'Viana',
      'Camama',
      'Belas',
      'Kilamba',
    ],
  },
  {
    slug: 'lunda-norte',
    name: 'Lunda Norte',
    municipalities: [
      'Chitato',
      'Dundo',
      'Lóvua',
      'Mussungue',
      'Lucapa',
      'Canzar',
      'Cambulo',
      'Xá Cassau',
      'Lubalo',
      'Capenda Camulemba',
      'Luangue',
      'Camaxilo',
      'Caungula',
      'Luremo',
      'Cafunfo',
      'Cassanje Calucala',
      'Cuango',
      'Xá Muteba',
    ],
  },
  {
    slug: 'lunda-sul',
    name: 'Lunda Sul',
    municipalities: [
      'Saurimo',
      'Muangueji',
      'Sombo',
      'Chiluage',
      'Muriege',
      'Cassai-Sul',
      'Muconda',
      'Cazage',
      'Dala',
      'Luma Cassai',
      'Cassengo',
      'Cacolo',
      'Xassengue',
      'Alto Chicapa',
    ],
  },
  {
    slug: 'malanje',
    name: 'Malanje',
    municipalities: [
      'Quiluhuo',
      'Massango',
      'Marimba',
      'Cuale',
      'Mbango Ngolome',
      'Cahombo',
      'Kunda dya Baze',
      'Milando',
      'Cambo Suinginge',
      'Quela',
      'Kiwaça Nzoji',
      'Calandula',
      'Caculama',
      'Xandel',
      'Cacuso',
      'Malanje',
      'Pungo a Ndongo',
      'Quessua',
      'Cangandala',
      'Cambundi Catembo',
      'Capunda',
      'Luquembo',
      'Quitapa',
      'Quirima',
      'Cateco Cangola',
      'Ngola Luiji',
    ],
  },
  {
    slug: 'moxico',
    name: 'Moxico',
    municipalities: [
      'Camanongue',
      'Luena',
      'Léua',
      'Lucusse',
      'Cangumbe',
      'Lutai',
      'Alto Cuito',
      'Cangamba',
      'Lutembo',
      'Lumbala Nguimbo',
      'Ninda',
      'Chiúme',
    ],
  },
  {
    slug: 'moxico-leste',
    name: 'Moxico Leste',
    municipalities: [
      'Luau',
      'Luacano',
      'Nana Candundo',
      'Caianda',
      'Lóvua do Zambeze',
      'Macondo',
      'Lago Dilolo',
      'Cameia',
      'Cazombo',
    ],
  },
  {
    slug: 'namibe',
    name: 'Namibe',
    municipalities: [
      'Bibala',
      'Cacimbas',
      'Camucuio',
      'Iona',
      'Lucira',
      'Moçâmedes',
      'Sacomar',
      'Tômbwa',
      'Virei',
    ],
  },
  {
    slug: 'uige',
    name: 'Uíge',
    municipalities: [
      'Maquela do Zombo',
      'Sacandica',
      'Nova Esperança',
      'Quimbele',
      'Alto Zaza',
      'Milunga',
      'Massau',
      'Sanza Pombo',
      'Puri',
      'Cangola',
      'Negage',
      'Dange Quitexe',
      'Vista Alegre',
      'Uíge',
      'Mucaba',
      'Nsosso',
      'Damba',
      'Songo',
      'Lucunga',
      'Bembe',
      'Ambuila',
      'Quipedro',
    ],
  },
  {
    slug: 'zaire',
    name: 'Zaire',
    municipalities: [
      'Soyo',
      'Nóqui',
      'Quêlo',
      'Nzeto',
      'Tomboco',
      'Quindeje',
      'Lufico',
      'Luvo',
      'Mbanza Kongo',
      'Cuimba',
      'Serra de Canda',
    ],
  },
] as const;

/**
 * Remove acentuação e normaliza caixa/espaços em branco para permitir
 * comparação tolerante a variações de digitação (ex: "huila" ==
 * "Huíla"). Mesma técnica de decomposição Unicode (NFD) já usada em
 * `utils/slug.util.ts`, mas SEM a conversão de espaços em hífens —
 * aqui o objetivo é comparar textos, não gerar uma URL.
 */
function normalizeLocationText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Índices de busca (Map) montados UMA ÚNICA VEZ, no momento em que
 * este módulo é importado pela primeira vez — não a cada chamada das
 * funções abaixo. Isso evita refazer a normalização e a montagem da
 * estrutura de busca repetidamente em cada requisição HTTP.
 */
const provinceByNormalizedName = new Map<string, ProvinceLocation>(
  ANGOLA_PROVINCES.map((province) => [normalizeLocationText(province.name), province])
);

/**
 * Busca uma província pelo nome, tolerando variações de acentuação,
 * caixa e espaços nas pontas. Devolve o objeto completo (incluindo a
 * grafia CANÔNICA em `.name`) ou `null` se não houver correspondência
 * com nenhuma das 21 províncias.
 *
 * É esta função (não o array `ANGOLA_PROVINCES` diretamente) que o
 * validator de ADDRESS deve chamar — nunca reimplementar esta lógica
 * de comparação em outro lugar do código.
 */
export function findProvinceByName(input: string): ProvinceLocation | null {
  return provinceByNormalizedName.get(normalizeLocationText(input)) ?? null;
}

/**
 * Busca um município DENTRO de uma província já identificada (ver
 * `findProvinceByName`), tolerando as mesmas variações de digitação.
 * Devolve a grafia canônica do município, ou `null` se aquele
 * município não pertencer a esta província especificamente — mesmo
 * que exista com esse nome em outra província do país.
 *
 * Por que recebe um `ProvinceLocation` já resolvido, em vez de um
 * nome de província solto (string)?
 *
 * Porque a validação real do domínio ADDRESS é sempre sequencial: só
 * faz sentido perguntar "este município existe?" depois de já saber
 * "esta província existe?". Forçar quem chama a resolver a província
 * primeiro (via `findProvinceByName`) torna essa ordem explícita no
 * próprio tipo da função, em vez de uma convenção que só existe na
 * documentação.
 */
export function findMunicipalityInProvince(
  province: ProvinceLocation,
  input: string
): string | null {
  const normalizedInput = normalizeLocationText(input);
  const match = province.municipalities.find(
    (municipality) => normalizeLocationText(municipality) === normalizedInput
  );

  return match ?? null;
}

/**
 * Índice de busca por slug — separado de `provinceByNormalizedName`
 * porque atende a um caso de uso diferente: aqui o valor de entrada
 * já vem no formato canônico de URL (ex: "cuanza-norte", vindo do
 * parâmetro de rota), não texto livre digitado por um utilizador
 * num formulário. Por isso a normalização é mais simples — só
 * lowercase, sem remoção de acentos (slugs nunca têm acentos).
 */
const provinceBySlug = new Map<string, ProvinceLocation>(
  ANGOLA_PROVINCES.map((province) => [province.slug, province])
);

/**
 * Busca uma província pelo slug (ex: "icolo-e-bengo"). Usada pela
 * rota GET /api/locations/provinces/:province/municipalities, onde
 * o cliente identifica a província pelo mesmo slug devolvido em
 * GET /api/locations/provinces.
 */
export function findProvinceBySlug(input: string): ProvinceLocation | null {
  return provinceBySlug.get(input.trim().toLowerCase()) ?? null;
}

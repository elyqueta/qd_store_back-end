/**
 * Migration: adiciona a coluna `role` à tabela `users`.
 *
 * Por que um ENUM (`user_role`) em vez de um simples VARCHAR?
 *
 * O Postgres valida ENUMs a nível de banco — é impossível inserir um
 * valor fora de ('customer', 'admin'), mesmo que alguém escreva uma
 * query manual direta no banco, ignorando toda a validação Zod da
 * aplicação. Isto é "defesa em profundidade" a nível de dados: a
 * regra de negócio "role só pode ser customer ou admin" fica
 * garantida no lugar mais baixo possível da stack, não só na
 * aplicação.
 *
 * Por que role separado de account_type, em vez de reaproveitar o
 * mesmo enum?
 *
 * account_type responde "que tipo de cliente é este" (pessoa física
 * ou empresa) — é uma classificação comercial. role responde "que
 * nível de acesso este utilizador tem no sistema" — é uma
 * classificação de permissão. São perguntas diferentes: um admin
 * ainda pode, tecnicamente, ter account_type = 'personal'. Misturar
 * os dois no mesmo campo obrigaria a codificar todas as combinações
 * possíveis (personal+customer, personal+admin, business+customer,
 * business+admin...) dentro de um único enum, o que rapidamente fica
 * confuso.
 *
 * Por que DEFAULT 'customer'?
 *
 * Toda linha já existente na tabela `users` (e todo novo registo via
 * POST /api/auth/register) precisa de continuar válida sem
 * intervenção manual. Sem o DEFAULT, o ADD COLUMN falharia em
 * qualquer tabela com linhas existentes (Postgres não sabe que
 * valor colocar nas linhas antigas). Com o DEFAULT, a migration é
 * segura mesmo em produção, com dados reais já na tabela.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createType('user_role', ['customer', 'admin']);

  pgm.addColumn('users', {
    role: {
      type: 'user_role',
      notNull: true,
      default: 'customer',
    },
  });
};

/**
 * `down` desfaz exatamente o que `up` fez, na ordem inversa: primeiro
 * remove a coluna que depende do tipo, só depois remove o tipo em si
 * (o Postgres não deixa apagar um ENUM ainda em uso por uma coluna).
 */
exports.down = (pgm) => {
  pgm.dropColumn('users', 'role');
  pgm.dropType('user_role');
};
/**
 * Persiste os dados empresariais fornecidos apenas para uma encomenda.
 * O JSONB é um snapshot do contexto usado no checkout e não cria uma
 * empresa nem uma associação permanente.
 */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('orders', {
    company_snapshot: { type: 'jsonb' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('orders', 'company_snapshot');
};

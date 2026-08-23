/**
 * Migration: regista o utilizador proprietário de cada empresa.
 *
 * `user_company.role` é texto livre e descreve o cargo de qualquer
 * associado, por isso não pode ser usado como fonte de autorização.
 * O backfill é necessário porque empresas antigas não têm como
 * informar quem as criou. Atribuímos o primeiro administrador para
 * que todas as linhas recebam um dono antes de activar NOT NULL.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('company', {
    id_owner: {
      type: 'uuid',
      references: 'users',
      onDelete: 'RESTRICT',
    },
  });

  pgm.sql(`
    UPDATE company
    SET id_owner = (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1)
    WHERE id_owner IS NULL;
  `);

  pgm.alterColumn('company', 'id_owner', { notNull: true });
};

exports.down = (pgm) => {
  pgm.dropColumn('company', 'id_owner');
};

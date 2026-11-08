exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TYPE quote_request_status AS ENUM ('new', 'contacted', 'closed');

    CREATE TABLE quote_request (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_name VARCHAR(200) NOT NULL,
      nif VARCHAR(9) NOT NULL,
      contact_name VARCHAR(150) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      province VARCHAR(100) NOT NULL,
      municipality VARCHAR(100) NOT NULL,
      sector VARCHAR(100) NOT NULL,
      volume VARCHAR(100) NOT NULL,
      categories TEXT[] NOT NULL,
      message TEXT,
      status quote_request_status NOT NULL DEFAULT 'new',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT quote_request_nif_check CHECK (nif ~ '^[0-9]{9}$'),
      CONSTRAINT quote_request_categories_check CHECK (cardinality(categories) > 0)
    );

    CREATE INDEX idx_quote_request_status_created
      ON quote_request (status, created_at DESC);
    CREATE INDEX idx_quote_request_created
      ON quote_request (created_at DESC);

    CREATE TRIGGER trg_quote_request_set_updated_at
      BEFORE UPDATE ON quote_request
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS quote_request;
    DROP TYPE IF EXISTS quote_request_status;
  `);
};

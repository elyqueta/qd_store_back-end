/**
 * Migration: schema base completo da QD · ItSOLUTIONS.
 *
 * Esta migration não introduz NENHUMA mudança de modelo — é uma
 * transcrição direta dos ficheiros já aprovados em database/
 * (000_extensions.sql até 080_indexes.sql), agora dentro do sistema
 * de migrations formal. A partir de agora, `npm run migrate:up`
 * sozinho recria este schema em qualquer máquina, sem depender de
 * ninguém lembrar de rodar os .sql manualmente na ordem certa.
 *
 * A pasta database/ continua a existir, como referência/documentação
 * — mas a partir de agora, a fonte executável da verdade é este
 * ficheiro.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    -- 000_extensions.sql
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- 001_enums.sql
    CREATE TYPE account_type AS ENUM ('personal', 'business');
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'banned');
    CREATE TYPE company_status AS ENUM ('active', 'inactive', 'banned');
    CREATE TYPE product_status AS ENUM ('active', 'inactive', 'out_of_stock');
    CREATE TYPE delivery_mode AS ENUM ('standard', 'express', 'corporate', 'pickup');
    CREATE TYPE payment_method_type AS ENUM ('multicaixa_express', 'multicaixa_reference', 'bank_transfer');
    CREATE TYPE order_type AS ENUM ('personal', 'business');
    CREATE TYPE order_status AS ENUM ('processing', 'in_transit', 'delivered', 'cancelled');
    CREATE TYPE multicaixa_reference_status AS ENUM ('pending', 'paid', 'expired', 'cancelled');
    CREATE TYPE order_payment_status AS ENUM ('pending', 'confirmed', 'failed', 'refunded');
    CREATE TYPE discount_type AS ENUM ('volume', 'coupon', 'promotional', 'manual');
    CREATE TYPE notification_type AS ENUM ('order', 'promotion', 'newsletter', 'system');

    -- 002_functions.sql
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- 010_user_auth.sql
    CREATE TABLE users (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name       VARCHAR(150) NOT NULL,
        email           VARCHAR(255) NOT NULL UNIQUE,
        password_hash   VARCHAR(255) NOT NULL,
        phone           VARCHAR(20) NOT NULL,
        nif             VARCHAR(20),
        account_type    account_type NOT NULL,
        status          user_status NOT NULL DEFAULT 'active',
        deactivated_at  TIMESTAMP,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TRIGGER trg_users_set_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    CREATE TABLE company (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(200) NOT NULL,
        nif         VARCHAR(20) NOT NULL UNIQUE,
        sector      VARCHAR(100),
        status      company_status NOT NULL DEFAULT 'active',
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TRIGGER trg_company_set_updated_at
        BEFORE UPDATE ON company
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    CREATE TABLE user_company (
        id_user     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        id_company  UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
        role        VARCHAR(100),
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (id_user, id_company)
    );

    CREATE TABLE session (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_user     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash  VARCHAR(255) NOT NULL UNIQUE,
        device      VARCHAR(200),
        ip          VARCHAR(45),
        expires_at  TIMESTAMP NOT NULL,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE address (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_user       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        label         VARCHAR(100),
        province      VARCHAR(100) NOT NULL,
        municipality  VARCHAR(100) NOT NULL,
        neighborhood  VARCHAR(100) NOT NULL,
        address       TEXT NOT NULL,
        reference     TEXT,
        latitude      DECIMAL(10,8),
        longitude     DECIMAL(11,8),
        is_default    BOOLEAN NOT NULL DEFAULT false,
        created_at    TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- 020_catalog.sql
    CREATE TABLE category (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug        VARCHAR(100) NOT NULL UNIQUE,
        label       VARCHAR(100) NOT NULL,
        icon        VARCHAR(10),
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TRIGGER trg_category_set_updated_at
        BEFORE UPDATE ON category
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    CREATE TABLE product (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_category     UUID NOT NULL REFERENCES category(id),
        name            VARCHAR(200) NOT NULL,
        description     TEXT,
        price           DECIMAL(15,2) NOT NULL,
        original_price  DECIMAL(15,2),
        badge           VARCHAR(50),
        status          product_status NOT NULL DEFAULT 'active',
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TRIGGER trg_product_set_updated_at
        BEFORE UPDATE ON product
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    CREATE TABLE product_image (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_product      UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
        url             TEXT NOT NULL,
        display_order   INTEGER NOT NULL DEFAULT 0,
        width           INTEGER,
        height          INTEGER,
        format          VARCHAR(10),
        size_bytes      INTEGER
    );

    CREATE TABLE product_specification (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id      UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
        spec_key        VARCHAR(255) NOT NULL,
        spec_value      VARCHAR(255) NOT NULL,
        display_order   INTEGER NOT NULL
    );

    -- 030_delivery_payment_config.sql
    CREATE TABLE delivery_type (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name         VARCHAR(100) NOT NULL,
        description  VARCHAR(200),
        price        DECIMAL(15,2) NOT NULL,
        type         delivery_mode NOT NULL,
        is_active    BOOLEAN NOT NULL DEFAULT true,
        created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TRIGGER trg_delivery_type_set_updated_at
        BEFORE UPDATE ON delivery_type
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    CREATE TABLE payment_method (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(100) NOT NULL,
        type        payment_method_type NOT NULL,
        is_active   BOOLEAN NOT NULL DEFAULT true,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TRIGGER trg_payment_method_set_updated_at
        BEFORE UPDATE ON payment_method
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    CREATE TABLE company_payment_config (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_payment_method   UUID NOT NULL REFERENCES payment_method(id) ON DELETE CASCADE,
        key                 VARCHAR(100) NOT NULL,
        value               TEXT NOT NULL,
        description         VARCHAR(200),
        is_active           BOOLEAN NOT NULL DEFAULT true,
        updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (id_payment_method, key)
    );

    CREATE TRIGGER trg_company_payment_config_set_updated_at
        BEFORE UPDATE ON company_payment_config
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    -- 040_cart.sql
    CREATE TABLE cart (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_user     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TRIGGER trg_cart_set_updated_at
        BEFORE UPDATE ON cart
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    CREATE TABLE cart_item (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_cart     UUID NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
        id_product  UUID NOT NULL REFERENCES product(id),
        quantity    INTEGER NOT NULL DEFAULT 1,
        unit_price  DECIMAL(15,2) NOT NULL
    );

    -- 050_order.sql
    CREATE TABLE orders (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reference           VARCHAR(30) NOT NULL UNIQUE,
        id_user             UUID NOT NULL REFERENCES users(id),
        id_company          UUID REFERENCES company(id),
        type                order_type NOT NULL,
        status              order_status NOT NULL,
        id_payment_method   UUID NOT NULL REFERENCES payment_method(id),
        id_delivery_type    UUID NOT NULL REFERENCES delivery_type(id),
        notes               TEXT,
        total               DECIMAL(15,2) NOT NULL,
        created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TRIGGER trg_orders_set_updated_at
        BEFORE UPDATE ON orders
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    CREATE TABLE order_address (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_order            UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
        id_address_origin   UUID REFERENCES address(id) ON DELETE SET NULL,
        province            VARCHAR(100) NOT NULL,
        municipality        VARCHAR(100) NOT NULL,
        neighborhood        VARCHAR(100) NOT NULL,
        address             TEXT NOT NULL,
        reference           TEXT,
        latitude            DECIMAL(10,8),
        longitude           DECIMAL(11,8),
        snapshot_at         TIMESTAMP NOT NULL
    );

    CREATE TABLE order_item (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_order    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        id_product  UUID NOT NULL REFERENCES product(id),
        quantity    INTEGER NOT NULL,
        unit_price  DECIMAL(15,2) NOT NULL,
        subtotal    DECIMAL(15,2) NOT NULL
    );

    CREATE TABLE discount (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_order        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        type            discount_type NOT NULL,
        percentage      DECIMAL(5,2),
        absolute_value  DECIMAL(15,2) NOT NULL,
        reason          VARCHAR(200),
        created_at      TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE order_history (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_order          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        previous_status   order_status,
        new_status        order_status NOT NULL,
        changed_by        UUID REFERENCES users(id) ON DELETE SET NULL,
        note              TEXT,
        created_at        TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- 060_payment.sql
    CREATE TABLE order_payment (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_order                UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        id_payment_method       UUID NOT NULL REFERENCES payment_method(id),
        status                  order_payment_status NOT NULL DEFAULT 'pending',
        transaction_reference   VARCHAR(100),
        amount                  DECIMAL(15,2) NOT NULL,
        amount_paid             DECIMAL(15,2),
        paid_at                 TIMESTAMP,
        notes                   TEXT,
        created_at              TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE multicaixa_reference (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_order    UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
        entity      VARCHAR(10) NOT NULL,
        reference   VARCHAR(20) NOT NULL UNIQUE,
        amount      DECIMAL(15,2) NOT NULL,
        status      multicaixa_reference_status NOT NULL DEFAULT 'pending',
        expires_at  TIMESTAMP NOT NULL,
        paid_at     TIMESTAMP,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE payment_detail (
        id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_order_payment          UUID NOT NULL UNIQUE REFERENCES order_payment(id) ON DELETE CASCADE,
        method_type               payment_method_type NOT NULL,
        customer_phone            VARCHAR(20),
        api_transaction_id        VARCHAR(100),
        id_multicaixa_reference   UUID REFERENCES multicaixa_reference(id) ON DELETE SET NULL,
        destination_iban          VARCHAR(34),
        destination_bank          VARCHAR(100),
        destination_holder        VARCHAR(150),
        confirmed_by              UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at                TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- 070_engagement.sql
    CREATE TABLE wishlist (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_user     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        id_product  UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (id_user, id_product)
    );

    CREATE TABLE notification (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_user     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type        notification_type NOT NULL,
        message     TEXT NOT NULL,
        is_read     BOOLEAN NOT NULL DEFAULT false,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- 080_indexes.sql
    CREATE INDEX idx_product_category ON product(id_category);
    CREATE INDEX idx_product_status ON product(status);
    CREATE INDEX idx_product_image_product ON product_image(id_product);
    CREATE INDEX idx_product_specification_product ON product_specification(product_id);
    CREATE INDEX idx_cart_item_cart ON cart_item(id_cart);
    CREATE INDEX idx_cart_item_product ON cart_item(id_product);
    CREATE INDEX idx_orders_user_created ON orders(id_user, created_at DESC);
    CREATE INDEX idx_orders_company ON orders(id_company) WHERE id_company IS NOT NULL;
    CREATE INDEX idx_orders_status ON orders(status);
    CREATE INDEX idx_order_item_order ON order_item(id_order);
    CREATE INDEX idx_order_item_product ON order_item(id_product);
    CREATE INDEX idx_discount_order ON discount(id_order);
    CREATE INDEX idx_order_history_order ON order_history(id_order);
    CREATE INDEX idx_order_payment_order ON order_payment(id_order);
    CREATE INDEX idx_multicaixa_reference_pending_expiry
        ON multicaixa_reference(expires_at)
        WHERE status = 'pending';
    CREATE INDEX idx_address_user ON address(id_user);
    CREATE UNIQUE INDEX ux_address_one_default_per_user
        ON address(id_user)
        WHERE is_default;
    CREATE INDEX idx_session_user ON session(id_user);
    CREATE INDEX idx_session_expires ON session(expires_at);
    CREATE INDEX idx_user_company_company ON user_company(id_company);
    CREATE INDEX idx_notification_user_created ON notification(id_user, created_at DESC);
    CREATE INDEX idx_notification_user_unread
        ON notification(id_user)
        WHERE is_read = false;
  `);
};

/**
 * down: remove tudo na ordem inversa. CASCADE em cada DROP TABLE
 * garante que triggers e índices dependentes saem junto, sem
 * precisar listá-los um a um.
 *
 * Decisão: NÃO fazemos DROP EXTENSION "pgcrypto" aqui. Extensões
 * são recursos ao nível do banco de dados inteiro, não do schema da
 * aplicação — desativá-la poderia afetar outras ferramentas que
 * partilhem a mesma instância Postgres (raro em dev local, mas mau
 * hábito replicar em produção/Supabase).
 */
exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS notification CASCADE;
    DROP TABLE IF EXISTS wishlist CASCADE;
    DROP TABLE IF EXISTS payment_detail CASCADE;
    DROP TABLE IF EXISTS multicaixa_reference CASCADE;
    DROP TABLE IF EXISTS order_payment CASCADE;
    DROP TABLE IF EXISTS order_history CASCADE;
    DROP TABLE IF EXISTS discount CASCADE;
    DROP TABLE IF EXISTS order_item CASCADE;
    DROP TABLE IF EXISTS order_address CASCADE;
    DROP TABLE IF EXISTS orders CASCADE;
    DROP TABLE IF EXISTS cart_item CASCADE;
    DROP TABLE IF EXISTS cart CASCADE;
    DROP TABLE IF EXISTS company_payment_config CASCADE;
    DROP TABLE IF EXISTS payment_method CASCADE;
    DROP TABLE IF EXISTS delivery_type CASCADE;
    DROP TABLE IF EXISTS product_specification CASCADE;
    DROP TABLE IF EXISTS product_image CASCADE;
    DROP TABLE IF EXISTS product CASCADE;
    DROP TABLE IF EXISTS category CASCADE;
    DROP TABLE IF EXISTS address CASCADE;
    DROP TABLE IF EXISTS session CASCADE;
    DROP TABLE IF EXISTS user_company CASCADE;
    DROP TABLE IF EXISTS company CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

    DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

    DROP TYPE IF EXISTS notification_type;
    DROP TYPE IF EXISTS discount_type;
    DROP TYPE IF EXISTS order_payment_status;
    DROP TYPE IF EXISTS multicaixa_reference_status;
    DROP TYPE IF EXISTS order_status;
    DROP TYPE IF EXISTS order_type;
    DROP TYPE IF EXISTS payment_method_type;
    DROP TYPE IF EXISTS delivery_mode;
    DROP TYPE IF EXISTS product_status;
    DROP TYPE IF EXISTS company_status;
    DROP TYPE IF EXISTS user_status;
    DROP TYPE IF EXISTS account_type;
  `);
};
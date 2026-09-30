'use strict';

/**
 * Migration manuelle (sans Sequelize CLI).
 * Lance : node src/config/migrate.js
 * Annule : node src/config/migrate.js undo
 */

require('dotenv').config();
const { sequelize } = require('./database');
const logger = require('../utils/logger');

const UP_SQL = `
-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ─── ENUM TYPES ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('Vente', 'Location');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE property_type AS ENUM (
    'Appartement', 'Villa', 'Maison', 'Bureau',
    'Terrain', 'Garage', 'Local commercial', 'Ferme'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('active', 'pending', 'sold', 'rented', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'agent', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'rescheduled', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  phone         VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'user',
  avatar_url    TEXT,
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─── LISTINGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            VARCHAR(255) NOT NULL,
  slug             VARCHAR(300) NOT NULL UNIQUE,
  description      TEXT,
  transaction      transaction_type NOT NULL,
  property_type    property_type NOT NULL,

  -- Localisation
  city             VARCHAR(100) NOT NULL,
  governorate      VARCHAR(100) NOT NULL,
  address          VARCHAR(255),
  zip_code         VARCHAR(10),
  latitude         DECIMAL(10, 8),
  longitude        DECIMAL(11, 8),

  -- Financier
  price            DECIMAL(14, 2) NOT NULL,
  price_negotiable BOOLEAN DEFAULT FALSE,

  -- Caractéristiques
  surface          DECIMAL(10, 2),
  rooms            SMALLINT,
  bedrooms         SMALLINT,
  bathrooms        SMALLINT,
  floor            SMALLINT,
  total_floors     SMALLINT,
  construction_year SMALLINT,

  -- Équipements (flags)
  is_new           BOOLEAN DEFAULT FALSE,
  is_furnished     BOOLEAN DEFAULT FALSE,
  has_parking      BOOLEAN DEFAULT FALSE,
  has_elevator     BOOLEAN DEFAULT FALSE,
  has_pool         BOOLEAN DEFAULT FALSE,
  has_garden       BOOLEAN DEFAULT FALSE,
  has_terrace      BOOLEAN DEFAULT FALSE,
  has_ac           BOOLEAN DEFAULT FALSE,
  has_heating      BOOLEAN DEFAULT FALSE,

  -- Statut
  status           listing_status NOT NULL DEFAULT 'active',
  views_count      INTEGER NOT NULL DEFAULT 0,
  featured         BOOLEAN DEFAULT FALSE,

  -- Recherche full-text
  search_vector    TSVECTOR,

  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_user        ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_city        ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_governorate ON listings(governorate);
CREATE INDEX IF NOT EXISTS idx_listings_transaction ON listings(transaction);
CREATE INDEX IF NOT EXISTS idx_listings_type        ON listings(property_type);
CREATE INDEX IF NOT EXISTS idx_listings_price       ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_status      ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_geo         ON listings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_listings_search      ON listings USING GIN(search_vector);

-- Trigger de mise à jour du vecteur de recherche full-text
CREATE OR REPLACE FUNCTION update_listing_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('french',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.city, '') || ' ' ||
    COALESCE(NEW.governorate, '') || ' ' ||
    COALESCE(NEW.address, '') || ' ' ||
    COALESCE(NEW.property_type::text, '') || ' ' ||
    COALESCE(NEW.transaction::text, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_listing_search ON listings;
CREATE TRIGGER trig_listing_search
  BEFORE INSERT OR UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_listing_search_vector();

-- Trigger updated_at automatique
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_users_updated ON users;
CREATE TRIGGER trig_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trig_listings_updated ON listings;
CREATE TRIGGER trig_listings_updated
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── IMAGES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listing_images (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id   UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  public_id    VARCHAR(255),
  is_cover     BOOLEAN DEFAULT FALSE,
  position     SMALLINT DEFAULT 0,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_listing ON listing_images(listing_id);

-- ─── FAVORIS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

-- ─── MESSAGES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id   UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sender_name  VARCHAR(200) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  sender_phone VARCHAR(30),
  body         TEXT NOT NULL,
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_listing ON messages(listing_id);

-- ─── APPOINTMENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  requester_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at    TIMESTAMP WITH TIME ZONE NOT NULL,
  status          appointment_status NOT NULL DEFAULT 'pending',
  contact_phone   VARCHAR(30),
  note            TEXT,
  agent_note      TEXT,
  payment_status  VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_provider VARCHAR(30),
  payment_provider_id VARCHAR(120),
  visit_fee_amount NUMERIC(10, 3) NOT NULL DEFAULT 20,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'pending';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(30);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_provider_id VARCHAR(120);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS visit_fee_amount NUMERIC(10, 3) NOT NULL DEFAULT 20;

CREATE INDEX IF NOT EXISTS idx_appointments_listing   ON appointments(listing_id);
CREATE INDEX IF NOT EXISTS idx_appointments_requester ON appointments(requester_id);
CREATE INDEX IF NOT EXISTS idx_appointments_agent     ON appointments(agent_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status    ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_schedule  ON appointments(scheduled_at);

-- ─── REFRESH TOKENS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON refresh_tokens(token);
`;

const DOWN_SQL = `
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS listing_images CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS appointment_status;
DROP TYPE IF EXISTS listing_status;
DROP TYPE IF EXISTS property_type;
DROP TYPE IF EXISTS transaction_type;
DROP TYPE IF EXISTS user_role;
`;

async function migrate(direction = 'up') {
  try {
    await sequelize.authenticate();
    logger.info(`⚙️  Migration ${direction.toUpperCase()} en cours...`);
    await sequelize.query(direction === 'up' ? UP_SQL : DOWN_SQL);
    logger.info(`✅ Migration ${direction.toUpperCase()} terminée.`);
  } catch (err) {
    logger.error('❌ Erreur migration :', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

const direction = process.argv[2] === 'undo' ? 'down' : 'up';
migrate(direction);

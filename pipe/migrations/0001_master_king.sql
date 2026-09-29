-- Master King System: customers, payments, leads. Source of truth for portal access.

CREATE TABLE IF NOT EXISTS customers (
  email TEXT PRIMARY KEY,
  prenom TEXT NOT NULL DEFAULT '',
  nom TEXT NOT NULL DEFAULT '',
  entreprise TEXT NOT NULL DEFAULT '',
  forfait TEXT,
  forfait_cellulaire TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  processor TEXT,
  last_payment_id TEXT,
  source TEXT NOT NULL DEFAULT 'paiement',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  forfait TEXT NOT NULL,
  amount_cad REAL,
  processor TEXT,
  renewal INTEGER NOT NULL DEFAULT 0,
  segment TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS payments_email ON payments(email);
CREATE INDEX IF NOT EXISTS payments_created ON payments(created_at);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  entreprise TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL,
  grade TEXT,
  market TEXT,
  score INTEGER,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (email, entreprise)
);
CREATE INDEX IF NOT EXISTS leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS leads_updated ON leads(updated_at);

CREATE TABLE IF NOT EXISTS meta (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);

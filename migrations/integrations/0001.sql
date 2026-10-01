-- Dedicated D1 binding BW_INTEGRATIONS_DB. Never use the production CRM tables.
CREATE TABLE IF NOT EXISTS integration_sessions (
  id TEXT PRIMARY KEY, owner TEXT NOT NULL, label TEXT NOT NULL, expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS integration_sessions_expiry ON integration_sessions(expires);
CREATE TABLE IF NOT EXISTS integration_states (
  id TEXT PRIMARY KEY, provider TEXT NOT NULL, browser TEXT NOT NULL,
  owner TEXT, session_id TEXT, verifier TEXT NOT NULL, lang TEXT NOT NULL,
  expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS integration_connections (
  owner TEXT NOT NULL, provider TEXT NOT NULL, encrypted TEXT NOT NULL,
  updated INTEGER NOT NULL, version TEXT NOT NULL, lock_until INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(owner, provider)
);

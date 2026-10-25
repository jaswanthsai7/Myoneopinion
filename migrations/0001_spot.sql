-- MyOneOpinion spot schema. Applied automatically on first request (see src/server/spot-store.ts);
-- kept here so it can also be applied with `wrangler d1 migrations apply myoneopinion`.

CREATE TABLE IF NOT EXISTS spot_opinions (
  id TEXT PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  text TEXT NOT NULL,
  link_url TEXT,
  hype_points INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0,
  order_id TEXT UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_spot_opinions_rank ON spot_opinions (hidden, hype_points DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_spot_opinions_new ON spot_opinions (hidden, created_at DESC);

CREATE TABLE IF NOT EXISTS spot_hypes (
  id TEXT PRIMARY KEY,
  opinion_id TEXT NOT NULL,
  supporter_key TEXT NOT NULL,
  supporter_name TEXT NOT NULL,
  supporter_avatar TEXT,
  points INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  order_id TEXT UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_spot_hypes_opinion ON spot_hypes (opinion_id, supporter_key);

CREATE TABLE IF NOT EXISTS spot_orders (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  payload TEXT NOT NULL,
  opinion_id TEXT,
  provider_ref TEXT,
  created_at TEXT NOT NULL,
  paid_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_spot_orders_provider_ref ON spot_orders (provider_ref);

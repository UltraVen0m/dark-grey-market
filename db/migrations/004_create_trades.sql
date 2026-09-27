CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY,
  offerer_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'offered' CHECK (status IN ('offered', 'negotiating', 'accepted', 'declined', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (offerer_id <> recipient_id)
);
CREATE TABLE IF NOT EXISTS trade_items (
  trade_id UUID NOT NULL REFERENCES trades(id),
  stock_id UUID NOT NULL REFERENCES stock(id) ON DELETE RESTRICT,
  side TEXT NOT NULL CHECK (side IN ('offered', 'requested')),
  PRIMARY KEY (trade_id, stock_id)
);
-- Released on decline/cancellation/completion; history stays in trade_items.
CREATE TABLE IF NOT EXISTS stock_commitments (
  stock_id UUID PRIMARY KEY REFERENCES stock(id) ON DELETE RESTRICT,
  trade_id UUID NOT NULL,
  FOREIGN KEY (trade_id, stock_id) REFERENCES trade_items(trade_id, stock_id)
);
CREATE TABLE IF NOT EXISTS trade_emails (
  id UUID PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES trades(id),
  recipient TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

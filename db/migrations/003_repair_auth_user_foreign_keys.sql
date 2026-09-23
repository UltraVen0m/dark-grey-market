-- The first production deployment created Better Auth's original singular
-- "user" table. Migration 002 now maps Better Auth to the stock-owning
-- users table, but CREATE TABLE IF NOT EXISTS does not replace existing
-- foreign keys. Repair deployments that already have the old constraints.
ALTER TABLE session
  DROP CONSTRAINT IF EXISTS "session_userId_fkey";

ALTER TABLE account
  DROP CONSTRAINT IF EXISTS "account_userId_fkey";

ALTER TABLE session
  ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;

ALTER TABLE account
  ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;

ALTER TABLE session
  ADD CONSTRAINT "session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE account
  ADD CONSTRAINT "account_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

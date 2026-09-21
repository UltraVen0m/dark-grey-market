import pg from "pg";

const { Pool } = pg;

export function databaseUrl() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL must be set.");
  }

  return url;
}

export function createPool() {
  return new Pool({ connectionString: databaseUrl() });
}

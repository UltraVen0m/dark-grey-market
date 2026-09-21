import { databaseUrl, createPool } from "./database.mjs";

const url = new URL(databaseUrl());

if (!url.pathname.endsWith("_test")) {
  throw new Error("Refusing to reset a database whose name does not end in _test.");
}

const pool = createPool();
try {
  await pool.query("DROP TABLE IF EXISTS stock, users CASCADE");
  console.log("Reset isolated test database.");
} finally {
  await pool.end();
}

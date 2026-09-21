import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createPool } from "./database.mjs";

const migrationUrl = new URL("../db/migrations/001_create_public_stock.sql", import.meta.url);
const sql = await readFile(fileURLToPath(migrationUrl), "utf8");
const pool = createPool();

try {
  await pool.query(sql);
  console.log("Applied public-stock schema.");
} finally {
  await pool.end();
}

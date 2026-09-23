import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createPool } from "./database.mjs";

const migrationsDirectory = fileURLToPath(new URL("../db/migrations/", import.meta.url));
const migrations = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();
const pool = createPool();

try {
  for (const migration of migrations) {
    const sql = await readFile(`${migrationsDirectory}${migration}`, "utf8");
    await pool.query(sql);
    console.log(`Applied ${migration}.`);
  }
} finally {
  await pool.end();
}

import pg from "pg";

const { Pool } = pg;
let pool;

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set to manage stock.");
  }

  pool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export async function getOwnedStock(ownerId) {
  const result = await getPool().query(
    `SELECT id, name, description, image_url AS "imageUrl", is_listed AS "isListed"
     FROM stock
     WHERE owner_id = $1
     ORDER BY created_at DESC, id ASC`,
    [ownerId]
  );

  return result.rows;
}

export async function createStock({ ownerId, name, description, imageUrl, isListed }) {
  const result = await getPool().query(
    `INSERT INTO stock (id, owner_id, name, description, image_url, is_listed)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [crypto.randomUUID(), ownerId, name, description, imageUrl, isListed]
  );

  return result.rows[0];
}

export async function listStock({ stockId, ownerId }) {
  const result = await getPool().query(
    `UPDATE stock
     SET is_listed = true
     WHERE id = $1 AND owner_id = $2
     RETURNING id`,
    [stockId, ownerId]
  );

  return result.rows[0];
}

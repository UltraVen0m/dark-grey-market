import pg from "pg";

const { Pool } = pg;
let pool;

function imageSource({ id, imageUrl }) {
  return imageUrl.includes(".private.blob.vercel-storage.com/")
    ? `/api/stock/${id}/image`
    : imageUrl;
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set to render public stock.");
  }

  pool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export async function getListedStock() {
  const result = await getPool().query(`
    SELECT stock.id, stock.name, stock.description, stock.image_url AS "imageUrl",
           users.username, users.profile_image_url AS "profileImageUrl"
    FROM stock
    JOIN users ON users.id = stock.owner_id
    WHERE stock.is_listed = true
    ORDER BY stock.created_at DESC, stock.id ASC
  `);

  return result.rows.map((stock) => ({ ...stock, imageUrl: imageSource(stock) }));
}

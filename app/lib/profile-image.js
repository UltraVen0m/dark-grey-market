import pg from "pg";

const { Pool } = pg;
let pool;

export function profileImageSource({ userId, imageUrl }) {
  return imageUrl.includes(".private.blob.vercel-storage.com/")
    ? `/api/profile/${userId}/image`
    : imageUrl;
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set to serve profile images.");
  }

  pool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export async function getProfileImage(userId) {
  const result = await getPool().query(
    `SELECT profile_image_url AS "imageUrl",
            EXISTS (SELECT 1 FROM stock WHERE stock.owner_id = users.id AND stock.is_listed = true) AS "hasListedStock"
     FROM users
     WHERE id = $1`,
    [userId]
  );

  return result.rows[0];
}

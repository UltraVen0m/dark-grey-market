import { put } from "@vercel/blob";
import { createPool } from "./database.mjs";

const imageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

const pool = createPool();

try {
  const result = await pool.query(
    `SELECT id, owner_id, image_url
     FROM stock
     WHERE image_url LIKE 'data:image/%'`
  );

  for (const stock of result.rows) {
    const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(stock.image_url);
    if (!match) throw new Error(`Stock ${stock.id} has an unsupported embedded image.`);

    const [, contentType, encodedImage] = match;
    const blob = await put(`stock/${stock.owner_id}/${stock.id}.${imageTypes[contentType]}`, Buffer.from(encodedImage, "base64"), {
      access: "private",
      contentType
    });
    await pool.query("UPDATE stock SET image_url = $1 WHERE id = $2", [blob.url, stock.id]);
    console.log(`Migrated image for stock ${stock.id}.`);
  }
} finally {
  await pool.end();
}

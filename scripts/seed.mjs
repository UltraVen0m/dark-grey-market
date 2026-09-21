import { createPool } from "./database.mjs";

const pool = createPool();

const users = [
  ["8c5b138c-ea22-4c5d-98e6-6e7d0186a6f1", "patchwork", "patchwork@example.test", "/avatars/patchwork.svg"],
  ["e5ec9f1f-4c8f-420d-939b-613d021951ee", "mossy", "mossy@example.test", "/avatars/mossy.svg"],
  ["f9899a9d-4e8d-4cf3-a165-108796242eaa", "orbit", "orbit@example.test", "/avatars/orbit.svg"]
];

const stock = [
  ["c1635642-bd53-4b7b-b8aa-3d2e46aa5382", users[0][0], "Cloudy yo-yo", "A scuffed, reliable yo-yo with a string that still has plenty of tricks left.", "/stock/cloudy-yoyo.svg", true],
  ["e98a748e-dcf8-4f65-8fc3-81cdbf6b4c7b", users[1][0], "Glow-in-the-dark stickers", "A small sheet of stars, planets, and one extremely serious frog.", "/stock/glow-stickers.svg", true],
  ["bbfb79bd-a7dd-47d3-b282-4d4b45ff567a", users[2][0], "Pocket sketchbook", "Half used, mostly excellent. The blank pages are waiting for your weirdest drawings.", "/stock/pocket-sketchbook.svg", true],
  ["d9a4751a-8cd4-4148-bf0d-899040f0cf1c", users[0][0], "Private lucky pebble", "Not for swapping. This confirms unlisted stock stays out of the public browse page.", "/stock/private-pebble.svg", false]
];

try {
  for (const [id, username, email, profileImageUrl] of users) {
    await pool.query(
      `INSERT INTO users (id, username, email, profile_image_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, email = EXCLUDED.email, profile_image_url = EXCLUDED.profile_image_url`,
      [id, username, email, profileImageUrl]
    );
  }

  for (const [id, ownerId, name, description, imageUrl, isListed] of stock) {
    await pool.query(
      `INSERT INTO stock (id, owner_id, name, description, image_url, is_listed)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image_url = EXCLUDED.image_url, is_listed = EXCLUDED.is_listed`,
      [id, ownerId, name, description, imageUrl, isListed]
    );
  }

  console.log("Seeded public stock.");
} finally {
  await pool.end();
}

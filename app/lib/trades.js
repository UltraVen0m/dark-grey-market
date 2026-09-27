import pg from "pg";

let pool;
export function tradePool() {
  pool ??= new pg.Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export class OfferError extends Error {}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createOffer({ offererId, targetId, offeredIds }) {
  const ids = [targetId, ...offeredIds];
  if (!offeredIds.length || ids.some((id) => typeof id !== "string" || !uuid.test(id)) || new Set(ids).size !== ids.length) {
    throw new OfferError("Choose one or more different items from your stash.");
  }
  const client = await tradePool().connect();
  try {
    await client.query("BEGIN");
    // A stable lock order prevents deadlocks across overlapping offers.
    const { rows } = await client.query(
      `SELECT id, owner_id, is_listed, name FROM stock WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE`, [ids]
    );
    const target = rows.find((item) => item.id === targetId);
    if (rows.length !== ids.length || !target?.is_listed || target.owner_id === offererId ||
        rows.some((item) => item.id !== targetId && item.owner_id !== offererId)) {
      throw new OfferError("Choose available listed stock from someone else and items you own.");
    }
    const committed = await client.query("SELECT stock_id FROM stock_commitments WHERE stock_id = ANY($1::uuid[])", [ids]);
    if (committed.rowCount) throw new OfferError("Some of that stock is already in an active trade. Choose again.");
    const id = crypto.randomUUID();
    await client.query("INSERT INTO trades (id, offerer_id, recipient_id) VALUES ($1, $2, $3)", [id, offererId, target.owner_id]);
    for (const stockId of ids) {
      await client.query("INSERT INTO trade_items (trade_id, stock_id, side) VALUES ($1, $2, $3)", [id, stockId, stockId === targetId ? "requested" : "offered"]);
      await client.query("INSERT INTO stock_commitments (stock_id, trade_id) VALUES ($1, $2)", [stockId, id]);
    }
    const participants = await client.query("SELECT id, username, email FROM users WHERE id = ANY($1::uuid[])", [[offererId, target.owner_id]]);
    const offerer = participants.rows.find((user) => user.id === offererId);
    const recipient = participants.rows.find((user) => user.id === target.owner_id);
    const body = `${offerer.username} offered ${rows.filter((item) => item.id !== targetId).map((item) => item.name).join(", ")} for ${recipient.username}'s ${target.name}.\n\nStatus: offered. Ownership has not changed. Sign in to Dark Grey Market and open Your trades to see the full terms.`;
    for (const user of participants.rows) {
      await client.query("INSERT INTO trade_emails (id, trade_id, recipient, body) VALUES ($1, $2, $3, $4)", [crypto.randomUUID(), id, user.email, body]);
    }
    await client.query("COMMIT");
    return id;
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") throw new OfferError("Some of that stock is already in an active trade. Choose again.");
    throw error;
  } finally {
    client.release();
  }
}

export async function getTrades(userId) {
  const { rows } = await tradePool().query(`
    SELECT t.id, t.status, a.username AS offerer, b.username AS recipient,
      json_agg(json_build_object('id', s.id, 'name', s.name, 'description', s.description,
        'imageUrl', s.image_url, 'side', ti.side) ORDER BY ti.side, s.id) AS items
    FROM trades t JOIN users a ON a.id = t.offerer_id JOIN users b ON b.id = t.recipient_id
    JOIN trade_items ti ON ti.trade_id = t.id JOIN stock s ON s.id = ti.stock_id
    WHERE t.offerer_id = $1 OR t.recipient_id = $1
    GROUP BY t.id, a.username, b.username ORDER BY t.created_at DESC`, [userId]);
  return rows.map((trade) => ({ ...trade, items: trade.items.map((item) => ({ ...item,
    imageUrl: item.imageUrl.includes(".private.blob.vercel-storage.com/") ? `/api/stock/${item.id}/image` : item.imageUrl
  })) }));
}

export async function canViewTradeStock(stockId, userId) {
  const result = await tradePool().query(`SELECT 1 FROM trade_items i JOIN trades t ON t.id = i.trade_id
    WHERE i.stock_id = $1 AND (t.offerer_id = $2 OR t.recipient_id = $2) LIMIT 1`, [stockId, userId]);
  return result.rowCount > 0;
}

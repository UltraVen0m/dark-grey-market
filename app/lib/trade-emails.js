import { tradePool } from "./trades";

// Delivery has its own transaction: a failure cannot roll back an offer.
export async function deliverTradeEmails() {
  if (!process.env.RESEND_API_KEY || !process.env.TRADE_EMAIL_FROM) return;
  const client = await tradePool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT * FROM trade_emails WHERE sent_at IS NULL ORDER BY created_at LIMIT 10 FOR UPDATE SKIP LOCKED");
    for (const email of rows) {
      try {
        const response = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": email.id },
          body: JSON.stringify({ from: process.env.TRADE_EMAIL_FROM, to: [email.recipient], subject: "A new Dark Grey Market offer", text: email.body }),
          signal: AbortSignal.timeout(5000)
        });
        if (response.ok) await client.query("UPDATE trade_emails SET sent_at = now() WHERE id = $1", [email.id]);
      } catch {
        // Leave pending for the scheduled retry.
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

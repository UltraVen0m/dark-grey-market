import { deliverTradeEmails } from "../../lib/trade-emails";
export async function GET(request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  await deliverTradeEmails();
  return Response.json({ ok: true });
}

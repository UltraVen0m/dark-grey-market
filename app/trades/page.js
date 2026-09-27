import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../lib/auth";
import { getTrades } from "../lib/trades";
import { getOwnedStock } from "../lib/stock";
import { getListedStock } from "../lib/public-stock";
import { OfferForm } from "../components/offer-form";

export const dynamic = "force-dynamic";
export default async function TradesPage({ searchParams }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  const [trades, stock, listed, params] = await Promise.all([getTrades(session.user.id), getOwnedStock(session.user.id), getListedStock(), searchParams]);
  return <main>
    <p className="eyebrow">Dark Grey Market</p><h1>Your trades</h1>
    <Link className="auth-link" href="/">Browse stock</Link>{" "}<Link className="auth-link" href="/account">Manage stock</Link>
    <h2>Put something on the table</h2>
    <OfferForm targetId={params.target || ""} targets={listed.filter((item) => item.ownerId !== session.user.id && !item.isCommitted)} stock={stock.filter((item) => !item.isCommitted)} />
    <h2>Offers</h2>
    {trades.length ? trades.map((trade) => <article className="trade-card" key={trade.id}>
      <h3>{trade.offerer} → {trade.recipient}</h3><p>Status: {trade.status}. Ownership has not changed.</p>
      {['offered', 'requested'].map((side) => <section key={side}><h4>{side === 'offered' ? `${trade.offerer} offers` : `${trade.recipient} gives`}</h4><div className="owned-stock-grid">
        {trade.items.filter((item) => item.side === side).map((item) => <div className="owned-stock" key={item.id}><img src={item.imageUrl} alt="" /><div><h5>{item.name}</h5><p>{item.description}</p></div></div>)}
      </div></section>)}
    </article>) : <p>No offers yet.</p>}
  </main>;
}

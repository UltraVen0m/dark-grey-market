import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../lib/auth";
import { SignOutButton } from "../components/sign-out-button";
import { StockForm } from "../components/stock-form";
import { getOwnedStock } from "../lib/stock";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  const stock = await getOwnedStock(session.user.id);

  return (
    <main className="auth-page">
      <p className="eyebrow">Your account</p>
      <h1>Hello, {session.user.name}.</h1>
      <p className="intro">This space is just for you. Add things you own, then choose which ones people can browse for a swap.</p>
      <dl className="account-details"><dt>Username</dt><dd>{session.user.name}</dd><dt>Email</dt><dd>{session.user.email}</dd></dl>
      <section className="account-stock" aria-labelledby="add-stock-heading">
        <p className="eyebrow">Your stash</p>
        <h2 id="add-stock-heading">Add some stock</h2>
        <StockForm />
      </section>
      <section className="account-stock" aria-labelledby="your-stock-heading">
        <p className="eyebrow">Only you can see this list</p>
        <h2 id="your-stock-heading">Your stock</h2>
        {stock.length ? <div className="owned-stock-grid">{stock.map((item) => <article className="owned-stock" key={item.id}>
          <img src={item.imageUrl} alt="" />
          <div><h3>{item.name}</h3><p>{item.description}</p><p className={item.isListed ? "listed-status" : "private-status"}>{item.isListed ? "Listed publicly" : "Private"}</p></div>
        </article>)}</div> : <p className="empty">Your stash is empty. Put your first thing on the table.</p>}
      </section>
      <SignOutButton />
    </main>
  );
}

import { getListedStock } from "./lib/public-stock";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const stock = await getListedStock();

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">Dark Grey Market</p>
        <h1>Good stuff. Strange stuff. Your next swap.</h1>
        <p className="intro">Have a look around. Sign in when you are ready to put something on the table.</p>
        <div className="hero-actions">
          <Link className="auth-link" href="/sign-up">Sign up</Link>
          <Link className="auth-link" href="/sign-in">Sign in</Link>
          <a className="join-link" href="#stock">Browse the stock <span aria-hidden="true">↓</span></a>
        </div>
      </header>

      <section id="stock" aria-labelledby="stock-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Freshly listed</p>
            <h2 id="stock-heading">Things people are up for swapping</h2>
          </div>
          <p className="stock-count">{stock.length} items</p>
        </div>

        {stock.length ? (
          <div className="stock-grid">
            {stock.map((item) => (
              <article className="stock-card" key={item.id}>
                <img className="stock-image" src={item.imageUrl} alt="" />
                <div className="card-content">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="owner">
                    <img src={item.profileImageUrl} alt="" />
                    <span>Listed by <strong>{item.username}</strong></span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">Nothing is listed yet. Check back soon.</p>
        )}
      </section>
    </main>
  );
}

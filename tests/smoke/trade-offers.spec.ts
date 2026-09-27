import { expect, test } from "@playwright/test";
import pg from "pg";

test("multi-item offers reserve stock atomically, share terms privately, and retry both emails", async ({ browser, request }) => {
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const alice = await browser.newPage();
  const bob = await browser.newPage();
  const visitor = await browser.newPage();
  try {
    for (const [page, name] of [[alice, "trade-alice"], [bob, "trade-bob"]] as const) {
      await page.goto("/sign-up");
      await page.getByLabel("Username").fill(name);
      await page.getByLabel("Email").fill(`${name}@example.test`);
      await page.getByLabel("Password").fill("a-long-enough-password");
      await page.getByRole("button", { name: "Make my account" }).click();
      await expect(page).toHaveURL("/account");
    }
    const { rows: users } = await pool.query("SELECT id, username FROM users WHERE username IN ('trade-alice', 'trade-bob')");
    const owner = (name) => users.find((u) => u.username === name).id;
    const ids = [1, 2, 3, 4].map((n) => `a0000000-0000-4000-8000-00000000000${n}`);
    for (const [index, name] of ["Secret badge", "Secret marble", "Trade yo-yo", "Trade book"].entries()) {
      await pool.query("INSERT INTO stock (id, owner_id, name, description, image_url, is_listed) VALUES ($1,$2,$3,$4,$5,$6)",
        [ids[index], owner(index < 2 ? "trade-alice" : "trade-bob"), name, `Terms for ${name}`, "/stock/glow-stickers.svg", index >= 2]);
    }
    await alice.goto(`/trades?target=${ids[2]}`);
    await alice.getByLabel("Secret badge", { exact: true }).check();
    await alice.getByLabel("Secret marble", { exact: true }).check();
    // A separate browser session for the same account races an overlapping selection.
    const competingContext = await browser.newContext({ storageState: await alice.context().storageState() });
    const competing = await competingContext.newPage();
    await competing.goto(`/trades?target=${ids[3]}`);
    await competing.getByLabel("Secret badge", { exact: true }).check();
    await competing.getByLabel("Secret marble", { exact: true }).check();
    await request.post("http://127.0.0.1:3101/fail");
    await Promise.all([alice.getByRole("button", { name: "Make offer", exact: true }).click(), competing.getByRole("button", { name: "Make offer", exact: true }).click()]);
    await expect.poll(async () => (await pool.query("SELECT count(*)::int AS n FROM trades WHERE offerer_id = $1", [owner("trade-alice")])).rows[0].n).toBe(1);
    const { rows: requested } = await pool.query("SELECT stock_id FROM trade_items WHERE side = 'requested'");
    expect(requested).toHaveLength(1);
    const loser = requested[0].stock_id === ids[2] ? competing : alice;
    await expect(loser.getByText("Some of that stock is already in an active trade. Choose again.")).toBeVisible();
    expect((await pool.query("SELECT count(*)::int AS n FROM stock_commitments WHERE stock_id = ANY($1::uuid[])", [ids])).rows[0].n).toBe(3);
    const { rows: owned } = await pool.query("SELECT owner_id FROM stock WHERE id = ANY($1::uuid[]) ORDER BY id", [ids]);
    expect(owned.map((item) => item.owner_id)).toEqual([owner("trade-alice"), owner("trade-alice"), owner("trade-bob"), owner("trade-bob")]);
    for (const page of [alice, bob]) {
      await page.goto("/trades");
      const terms = page.getByRole("article");
      await expect(terms.getByText("Secret badge", { exact: true })).toBeVisible();
      await expect(terms.getByText("Secret marble", { exact: true })).toBeVisible();
      await expect(terms).toContainText("Terms for Secret badge");
      await expect(terms).toContainText("Status: offered. Ownership has not changed.");
    }
    await visitor.goto("/");
    await expect(visitor.getByText("Secret badge", { exact: true })).toHaveCount(0);
    await expect(visitor.getByText("In an active trade", { exact: true })).toHaveCount(1);
    await visitor.goto("/trades");
    await expect(visitor).toHaveURL("/sign-in");
    expect((await request.get("/api/trade-emails")).status()).toBe(401);
    const pending = await pool.query("SELECT recipient, sent_at FROM trade_emails");
    expect(pending.rows).toHaveLength(2);
    expect(pending.rows.every((mail) => mail.sent_at === null)).toBe(true);
    await request.post("http://127.0.0.1:3101/recover");
    await expect.poll(async () => {
      await request.get("/api/trade-emails", { headers: { Authorization: "Bearer test-only-cron-secret" } });
      return (await pool.query("SELECT count(*)::int AS n FROM trade_emails WHERE sent_at IS NOT NULL")).rows[0].n;
    }).toBe(2);
    const messages = await (await request.get("http://127.0.0.1:3101")).json();
    expect(messages.map((mail) => mail.to[0]).sort()).toEqual(["trade-alice@example.test", "trade-bob@example.test"]);
    for (const mail of messages) {
      expect(mail.text).toContain("Secret badge"); expect(mail.text).toContain("Secret marble");
      expect(mail.text).toContain("Ownership has not changed");
    }
    await alice.goto("/account");
    const badge = alice.getByRole("article").filter({ hasText: "Secret badge" });
    await expect(badge.getByRole("button", { name: "Delete stock" })).toHaveCount(0);
    await badge.getByRole("button", { name: "List publicly" }).click();
    await expect(badge.getByRole("button", { name: "Unlist", exact: true })).toBeVisible();
    await badge.getByRole("button", { name: "Unlist", exact: true }).click();
    await expect(badge.getByText("Private", { exact: true })).toBeVisible();
    expect((await pool.query("SELECT count(*)::int AS n FROM stock_commitments")).rows[0].n).toBe(3);
    await bob.goto("/trades");
    await bob.screenshot({ path: "test-results/trade-offer.png", fullPage: true });
    await competingContext.close();
  } finally {
    await request.post("http://127.0.0.1:3101/recover");
    await alice.close(); await bob.close(); await visitor.close(); await pool.end();
  }
});

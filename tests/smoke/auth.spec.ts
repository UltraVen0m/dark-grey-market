import { expect, test } from "@playwright/test";
import pg from "pg";

const { Pool } = pg;

async function addListedStockFor(email) {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    let user;
    for (let attempt = 0; attempt < 20 && !user; attempt += 1) {
      const { rows } = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
      user = rows[0];
      if (!user) await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!user) throw new Error("The newly created profile was not persisted to the test database.");
    await pool.query(
      `INSERT INTO stock (id, owner_id, name, description, image_url, is_listed)
       VALUES ($1, $2, $3, $4, $5, true)`,
      ["bd402555-ef50-4f4c-9c71-3a568e86c2f6", user.id, "Alice's test badge", "A listed item used to verify public profile updates.", "/stock/glow-stickers.svg"]
    );
  } finally {
    await pool.end();
  }
}

test("any visitor can create an account, sign out, and return through sign in", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Username").fill("alice");
  await page.getByLabel("Email").fill("alice@example.test");
  await page.getByLabel("Password").fill("a-long-enough-password");
  await page.getByRole("button", { name: "Make my account" }).click();
  await expect(page).toHaveURL("/account");
  await expect(page.getByRole("heading", { name: "Hello, alice." })).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue("alice@example.test");

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/account");
  await expect(page).toHaveURL("/sign-in");

  await page.getByLabel("Email").fill("alice@example.test");
  await page.getByLabel("Password").fill("a-long-enough-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/account");
  await expect(page.getByLabel("Email")).toHaveValue("alice@example.test");
});

test("a separate account cannot see another account's details and public browsing stays open", async ({ browser }) => {
  const first = await browser.newPage();
  await first.goto("/sign-up");
  await first.getByLabel("Username").fill("bob");
  await first.getByLabel("Email").fill("bob@example.test");
  await first.getByLabel("Password").fill("another-long-password");
  await first.getByRole("button", { name: "Make my account" }).click();
  await expect(first.getByLabel("Email")).toHaveValue("bob@example.test");
  await expect(first.getByText("alice@example.test", { exact: true })).not.toBeVisible();

  const visitor = await browser.newPage();
  await visitor.goto("/");
  await expect(visitor.getByRole("heading", { name: "Cloudy yo-yo" })).toBeVisible();
  await expect(visitor.getByText("alice@example.test", { exact: true })).not.toBeVisible();
  await visitor.goto("/account");
  await expect(visitor).toHaveURL("/sign-in");
  await first.close();
  await visitor.close();
});

test("an owner can add private and listed stock without exposing private stock to another account", async ({ browser }) => {
  const picture = {
    name: "tiny.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL9iAAAAABJRU5ErkJggg==", "base64")
  };
  const owner = await browser.newPage();
  await owner.goto("/sign-up");
  await owner.getByLabel("Username").fill("stock-owner");
  await owner.getByLabel("Email").fill("stock-owner@example.test");
  await owner.getByLabel("Password").fill("a-long-enough-password");
  await owner.getByRole("button", { name: "Make my account" }).click();

  await owner.getByLabel("Picture").setInputFiles(picture);
  await owner.getByLabel("Name").fill("Private test treasure");
  await owner.getByLabel("Description").fill("Only its owner should find this in their stash.");
  await owner.getByRole("button", { name: "Add stock" }).click();
  await expect(owner.getByRole("status")).toHaveText("Stock added to your stash.");
  await expect(owner.getByText("Private test treasure", { exact: true })).toBeVisible();
  await expect(owner.getByText("Private", { exact: true })).toBeVisible();
  await owner.getByRole("button", { name: "List publicly" }).click();
  await expect(owner.getByRole("status")).toHaveText("Stock listed publicly.");
  await expect(owner.getByText("Listed publicly", { exact: true })).toBeVisible();

  await owner.getByLabel("Picture").setInputFiles(picture);
  await owner.getByLabel("Name").fill("Still private test treasure");
  await owner.getByLabel("Description").fill("This stays hidden from everyone else.");
  await owner.getByRole("button", { name: "Add stock" }).click();
  await expect(owner.getByText("Still private test treasure", { exact: true })).toBeVisible();

  await owner.getByLabel("Picture").setInputFiles(picture);
  await owner.getByLabel("Name").fill("Listed test treasure");
  await owner.getByLabel("Description").fill("A real listing that other people can browse.");
  await owner.getByLabel("List it publicly so other people can browse it").check();
  await owner.getByRole("button", { name: "Add stock" }).click();
  await expect(owner.getByText("Listed test treasure", { exact: true })).toBeVisible();
  await expect(owner.getByText("Listed publicly", { exact: true })).toBeVisible();

  const otherUser = await browser.newPage();
  await otherUser.goto("/sign-up");
  await otherUser.getByLabel("Username").fill("other-stock-user");
  await otherUser.getByLabel("Email").fill("other-stock-user@example.test");
  await otherUser.getByLabel("Password").fill("a-different-long-password");
  await otherUser.getByRole("button", { name: "Make my account" }).click();
  await expect(otherUser.getByText("Private test treasure", { exact: true })).not.toBeVisible();
  await expect(otherUser.getByText("Still private test treasure", { exact: true })).not.toBeVisible();
  await expect(otherUser.getByText("Listed test treasure", { exact: true })).not.toBeVisible();

  const visitor = await browser.newPage();
  await visitor.goto("/");
  await expect(visitor.getByRole("heading", { name: "Listed test treasure" })).toBeVisible();
  await expect(visitor.getByText("A real listing that other people can browse.")).toBeVisible();
  await expect(visitor.getByText("stock-owner", { exact: true })).toBeVisible();
  await expect(visitor.getByRole("heading", { name: "Private test treasure" })).toBeVisible();
  await expect(visitor.getByText("Still private test treasure", { exact: true })).not.toBeVisible();
  await expect(visitor.locator("body")).not.toContainText("stock-owner@example.test");

  await owner.close();
  await otherUser.close();
  await visitor.close();
});

test("a user updates their profile, email, and password while their listing shows only the new public profile", async ({ browser }) => {
  const aliceContext = await browser.newContext();
  const alice = await aliceContext.newPage();
  await alice.goto("/sign-up");
  await alice.getByLabel("Username").fill("profile-alice");
  await alice.getByLabel("Email").fill("profile-alice@example.test");
  await alice.getByLabel("Password").fill("a-long-enough-password");
  await alice.getByRole("button", { name: "Make my account" }).click();
  await addListedStockFor("profile-alice@example.test");

  await alice.getByLabel("Username").fill("profile-alice-new");
  await alice.getByLabel("Profile picture URL").fill("/avatars/orbit.svg");
  await alice.getByRole("button", { name: "Save public profile" }).click();
  await expect(alice.getByRole("status")).toHaveText("Your public profile is saved.");
  await alice.reload();
  await expect(alice.getByRole("heading", { name: "Hello, profile-alice-new." })).toBeVisible();

  await alice.getByLabel("Email").fill("profile-alice-new@example.test");
  await alice.getByRole("button", { name: "Save email" }).click();
  await expect(alice.getByRole("status")).toHaveText("Your email request was processed. Your account now shows your current address.");
  await alice.reload();
  await expect(alice.getByLabel("Email")).toHaveValue("profile-alice-new@example.test");

  await alice.getByLabel("Current password").fill("a-long-enough-password");
  await alice.getByLabel("New password", { exact: true }).fill("an-even-longer-password");
  await alice.getByLabel("Confirm new password").fill("an-even-longer-password");
  await alice.getByRole("button", { name: "Save password" }).click();
  await expect(alice.getByRole("status")).toHaveText("Your password is saved.");

  const bobContext = await browser.newContext();
  const bob = await bobContext.newPage();
  await bob.goto("/sign-up");
  await bob.getByLabel("Username").fill("profile-bob");
  await bob.getByLabel("Email").fill("profile-bob@example.test");
  await bob.getByLabel("Password").fill("another-long-password");
  await bob.getByRole("button", { name: "Make my account" }).click();
  await expect(bob.getByText("profile-alice-new@example.test", { exact: true })).not.toBeVisible();
  await expect(bob.getByLabel("Username")).toHaveValue("profile-bob");
  await expect(bob.getByLabel("Email")).toHaveValue("profile-bob@example.test");
  await bob.evaluate(async () => {
    await fetch("/api/auth/update-user", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "not-alice", image: "/avatars/mossy.svg" })
    });
  });
  await alice.reload();
  await expect(alice.getByRole("heading", { name: "Hello, profile-alice-new." })).toBeVisible();

  const visitorContext = await browser.newContext();
  const visitor = await visitorContext.newPage();
  await visitor.goto("/");
  const listing = visitor.getByRole("article").filter({ hasText: "Alice's test badge" });
  await expect(listing.getByText("Listed by profile-alice-new")).toBeVisible();
  await expect(listing.locator(".owner img")).toHaveAttribute("src", "/avatars/orbit.svg");
  await expect(visitor.getByText("profile-alice-new@example.test", { exact: true })).not.toBeVisible();

  await alice.getByRole("button", { name: "Sign out" }).click();
  await alice.goto("/sign-in");
  await alice.getByLabel("Email").fill("profile-alice-new@example.test");
  await alice.getByLabel("Password").fill("an-even-longer-password");
  await alice.getByRole("button", { name: "Sign in" }).click();
  await expect(alice.getByRole("heading", { name: "Hello, profile-alice-new." })).toBeVisible();

  await aliceContext.close();
  await bobContext.close();
  await visitorContext.close();
});

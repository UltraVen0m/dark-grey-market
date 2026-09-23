import { expect, test } from "@playwright/test";

test("any visitor can create an account, sign out, and return through sign in", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Username").fill("alice");
  await page.getByLabel("Email").fill("alice@example.test");
  await page.getByLabel("Password").fill("a-long-enough-password");
  await page.getByRole("button", { name: "Make my account" }).click();
  await expect(page).toHaveURL("/account");
  await expect(page.getByRole("heading", { name: "Hello, alice." })).toBeVisible();
  await expect(page.getByText("alice@example.test", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/account");
  await expect(page).toHaveURL("/sign-in");

  await page.getByLabel("Email").fill("alice@example.test");
  await page.getByLabel("Password").fill("a-long-enough-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/account");
  await expect(page.getByText("alice@example.test", { exact: true })).toBeVisible();
});

test("a separate account cannot see another account's details and public browsing stays open", async ({ browser }) => {
  const first = await browser.newPage();
  await first.goto("/sign-up");
  await first.getByLabel("Username").fill("bob");
  await first.getByLabel("Email").fill("bob@example.test");
  await first.getByLabel("Password").fill("another-long-password");
  await first.getByRole("button", { name: "Make my account" }).click();
  await expect(first.getByText("bob@example.test", { exact: true })).toBeVisible();
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
  await expect(otherUser.getByText("Listed test treasure", { exact: true })).not.toBeVisible();

  const visitor = await browser.newPage();
  await visitor.goto("/");
  await expect(visitor.getByRole("heading", { name: "Listed test treasure" })).toBeVisible();
  await expect(visitor.getByText("A real listing that other people can browse.")).toBeVisible();
  await expect(visitor.getByText("stock-owner", { exact: true })).toBeVisible();
  await expect(visitor.getByText("Private test treasure", { exact: true })).not.toBeVisible();
  await expect(visitor.locator("body")).not.toContainText("stock-owner@example.test");

  await owner.close();
  await otherUser.close();
  await visitor.close();
});

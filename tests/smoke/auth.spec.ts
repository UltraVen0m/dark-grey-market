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

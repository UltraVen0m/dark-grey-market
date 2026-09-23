import { expect, test } from "@playwright/test";

test("a visitor can browse persisted listed stock without private data", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Good stuff. Strange stuff. Your next swap." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cloudy yo-yo" })).toBeVisible();
  await expect(page.getByText("A scuffed, reliable yo-yo with a string that still has plenty of tricks left.")).toBeVisible();
  await expect(page.getByText("patchwork", { exact: true })).toBeVisible();
  await expect(page.locator(".stock-image")).toHaveCount(3);
  await expect(page.locator(".owner img")).toHaveCount(3);
  await expect(page.getByText("Private lucky pebble")).not.toBeVisible();
  await expect(page.locator("body")).not.toContainText("@example.test");
});

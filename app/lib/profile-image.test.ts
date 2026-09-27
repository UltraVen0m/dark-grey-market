import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { query, Pool } = vi.hoisted(() => ({ query: vi.fn(), Pool: vi.fn() }));

vi.mock("pg", () => ({ default: { Pool } }));

import { getProfileImage, profileImageSource } from "./profile-image";

describe("profile images", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://test";
    Pool.mockImplementation(function PoolConnection() { return { query }; });
    query.mockReset();
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
    vi.restoreAllMocks();
  });

  test("serves private profile images through the profile route", () => {
    expect(profileImageSource({ userId: "owner-id", imageUrl: "https://store.private.blob.vercel-storage.com/profiles/owner-id/avatar.png" }))
      .toBe("/api/profile/owner-id/image");
  });

  test("returns a profile image with whether its owner has public stock", async () => {
    query.mockResolvedValue({ rows: [{ imageUrl: "https://store.private.blob.vercel-storage.com/profiles/owner-id/avatar.png", hasListedStock: true }] });

    await expect(getProfileImage("owner-id")).resolves.toEqual({ imageUrl: "https://store.private.blob.vercel-storage.com/profiles/owner-id/avatar.png", hasListedStock: true });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("stock.is_listed = true"), ["owner-id"]);
  });
});

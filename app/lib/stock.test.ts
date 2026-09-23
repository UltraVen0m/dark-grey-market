import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { query, Pool } = vi.hoisted(() => ({ query: vi.fn(), Pool: vi.fn() }));

vi.mock("pg", () => ({ default: { Pool } }));

import { createStock, getOwnedStock, getStockImage, listStock } from "./stock";

describe("stock repository", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://test";
    Pool.mockImplementation(function PoolConnection() { return { query }; });
    query.mockReset();
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
    vi.restoreAllMocks();
  });

  test("returns only stock belonging to the requested owner", async () => {
    query.mockResolvedValue({ rows: [{ id: "owned-item", imageUrl: "https://store.private.blob.vercel-storage.com/stock/owned-item.png" }] });

    await expect(getOwnedStock("owner-id")).resolves.toEqual([{ id: "owned-item", imageUrl: "/api/stock/owned-item/image" }]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("WHERE owner_id = $1"), ["owner-id"]);
  });

  test("returns private image metadata only for the image delivery route", async () => {
    query.mockResolvedValue({ rows: [{ ownerId: "owner-id", isListed: false, imageUrl: "https://store.private.blob.vercel-storage.com/stock/owned-item.png" }] });

    await expect(getStockImage("owned-item")).resolves.toEqual({ ownerId: "owner-id", isListed: false, imageUrl: "https://store.private.blob.vercel-storage.com/stock/owned-item.png" });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("WHERE id = $1"), ["owned-item"]);
  });

  test("lists stock only when both stock and owner identifiers match", async () => {
    query.mockResolvedValue({ rows: [{ id: "owned-item" }] });

    await expect(listStock({ stockId: "owned-item", ownerId: "owner-id" })).resolves.toEqual({ id: "owned-item" });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("WHERE id = $1 AND owner_id = $2"), ["owned-item", "owner-id"]);
  });

  test("creates stock with its owner and requested listing state", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "new-item" });
    query.mockResolvedValue({ rows: [{ id: "new-item" }] });

    await expect(createStock({ ownerId: "owner-id", name: "Pebble", description: "Lucky", imageUrl: "data:image/png;base64,AQID", isListed: false })).resolves.toEqual({ id: "new-item" });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO stock"), ["new-item", "owner-id", "Pebble", "Lucky", "data:image/png;base64,AQID", false]);
  });
});

import { beforeEach, describe, expect, test, vi } from "vitest";

const { getSession, headers, revalidatePath, createStock, persistListedStock, persistUnlistedStock, persistDeletedStock, put } = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(),
  revalidatePath: vi.fn(),
  createStock: vi.fn(),
  persistListedStock: vi.fn(),
  persistUnlistedStock: vi.fn(),
  persistDeletedStock: vi.fn(),
  put: vi.fn()
}));

vi.mock("next/headers", () => ({ headers }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@vercel/blob", () => ({ put }));
vi.mock("../lib/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("../lib/stock", () => ({ createStock, listStock: persistListedStock, unlistStock: persistUnlistedStock, deleteStock: persistDeletedStock }));

import { addStock, listStock, unlistStock, deleteStock, uploadProfileImage } from "./actions";

const session = { user: { id: "owner-id" } };

function uploadFormData(values: Record<string, unknown>) {
  return { get: vi.fn((name) => values[name]) } as never;
}

describe("stock actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headers.mockResolvedValue(new Headers());
    getSession.mockResolvedValue(session);
    put.mockResolvedValue({ url: "https://store.private.blob.vercel-storage.com/stock/owner-id/image.png" });
  });

  test("rejects an upload without a supported picture before persisting it", async () => {
    const result = await addStock({}, uploadFormData({ name: "Pebble", description: "Lucky", image: { type: "image/svg+xml", size: 2 } }));

    expect(result).toEqual({ error: "Choose a PNG, JPEG, WebP, or GIF picture." });
    expect(createStock).not.toHaveBeenCalled();
  });

  test("persists a listed upload against the authenticated owner", async () => {
    const image = { type: "image/png", size: 3, arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer) };
    const result = await addStock({}, uploadFormData({ name: "Pebble", description: "Lucky", image, isListed: "on" }));

    expect(put).toHaveBeenCalledWith(expect.stringMatching(/^stock\/owner-id\/.+\.png$/), image, { access: "private", contentType: "image/png" });
    expect(createStock).toHaveBeenCalledWith(expect.objectContaining({ ownerId: "owner-id", name: "Pebble", description: "Lucky", isListed: true, imageUrl: "https://store.private.blob.vercel-storage.com/stock/owner-id/image.png" }));
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(result).toEqual({ success: "Stock added to your stash." });
  });

  test("uploads a valid profile picture for the authenticated user", async () => {
    const image = { type: "image/webp", size: 3, arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer) };
    put.mockResolvedValueOnce({ url: "https://store.private.blob.vercel-storage.com/profiles/owner-id/image.webp" });

    const result = await uploadProfileImage(uploadFormData({ image }));

    expect(put).toHaveBeenCalledWith(expect.stringMatching(/^profiles\/owner-id\/.+\.webp$/), image, { access: "private", contentType: "image/webp" });
    expect(result).toEqual({ imageUrl: "https://store.private.blob.vercel-storage.com/profiles/owner-id/image.webp" });
  });

  test("does not upload an invalid profile picture", async () => {
    const result = await uploadProfileImage(uploadFormData({ image: { type: "image/svg+xml", size: 2 } }));

    expect(result).toEqual({ error: "Choose a PNG, JPEG, WebP, or GIF picture." });
    expect(put).not.toHaveBeenCalled();
  });

  test("refuses to list stock that is not owned by the current user", async () => {
    persistListedStock.mockResolvedValue(undefined);
    const result = await listStock({}, uploadFormData({ stockId: "someone-elses-stock" }));

    expect(persistListedStock).toHaveBeenCalledWith({ stockId: "someone-elses-stock", ownerId: "owner-id" });
    expect(result).toEqual({ error: "That stock is not in your stash." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

const stockId = "bd402555-ef50-4f4c-9c71-3a568e86c2f6";

describe.each([
  ["unlist", unlistStock, persistUnlistedStock, "Stock is now private."],
  ["delete", deleteStock, persistDeletedStock, "Stock deleted from your stash."]
] as const)("%s stock", (_name, action, persist, success) => {
  beforeEach(() => {
    vi.resetAllMocks();
    headers.mockResolvedValue(new Headers());
    getSession.mockResolvedValue(session);
  });

  test("requires authentication before changing stock", async () => {
    getSession.mockResolvedValue(null);
    expect(await action({}, uploadFormData({ stockId }))).toHaveProperty("error");
    expect(persist).not.toHaveBeenCalled();
  });

  test("uses the session owner and refreshes public and account views", async () => {
    persist.mockResolvedValue({ id: stockId });
    expect(await action({}, uploadFormData({ stockId, ownerId: "forged-owner" }))).toEqual({ success });
    expect(persist).toHaveBeenCalledWith({ stockId, ownerId: "owner-id" });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/account");
  });

  test("rejects missing or foreign stock without claiming success", async () => {
    persist.mockResolvedValue(undefined);
    expect(await action({}, uploadFormData({ stockId }))).toEqual({ error: action === deleteStock ? "That stock is unavailable. Items in a trade cannot be deleted." : "That stock is not in your stash." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test.each(["", "invalid", "' OR true --"])("rejects malformed identifier %s", async (stockId) => {
    expect(await action({}, uploadFormData({ stockId }))).toHaveProperty("error");
    expect(persist).not.toHaveBeenCalled();
  });
});

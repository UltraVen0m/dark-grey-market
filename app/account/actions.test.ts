import { beforeEach, describe, expect, test, vi } from "vitest";

const { getSession, headers, revalidatePath, createStock, persistListedStock } = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(),
  revalidatePath: vi.fn(),
  createStock: vi.fn(),
  persistListedStock: vi.fn()
}));

vi.mock("next/headers", () => ({ headers }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("../lib/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("../lib/stock", () => ({ createStock, listStock: persistListedStock }));

import { addStock, listStock } from "./actions";

const session = { user: { id: "owner-id" } };

function uploadFormData(values: Record<string, unknown>) {
  return { get: vi.fn((name) => values[name]) } as never;
}

describe("stock actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headers.mockResolvedValue(new Headers());
    getSession.mockResolvedValue(session);
  });

  test("rejects an upload without a supported picture before persisting it", async () => {
    const result = await addStock({}, uploadFormData({ name: "Pebble", description: "Lucky", image: { type: "image/svg+xml", size: 2 } }));

    expect(result).toEqual({ error: "Choose a PNG, JPEG, WebP, or GIF picture." });
    expect(createStock).not.toHaveBeenCalled();
  });

  test("persists a listed upload against the authenticated owner", async () => {
    const image = { type: "image/png", size: 3, arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer) };
    const result = await addStock({}, uploadFormData({ name: "Pebble", description: "Lucky", image, isListed: "on" }));

    expect(createStock).toHaveBeenCalledWith(expect.objectContaining({ ownerId: "owner-id", name: "Pebble", description: "Lucky", isListed: true, imageUrl: "data:image/png;base64,AQID" }));
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(result).toEqual({ success: "Stock added to your stash." });
  });

  test("refuses to list stock that is not owned by the current user", async () => {
    persistListedStock.mockResolvedValue(undefined);
    const result = await listStock({}, uploadFormData({ stockId: "someone-elses-stock" }));

    expect(persistListedStock).toHaveBeenCalledWith({ stockId: "someone-elses-stock", ownerId: "owner-id" });
    expect(result).toEqual({ error: "That stock is not in your stash." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

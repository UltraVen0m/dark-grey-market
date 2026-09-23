import { beforeEach, describe, expect, test, vi } from "vitest";

const { get, headers, getSession, getStockImage } = vi.hoisted(() => ({
  get: vi.fn(),
  headers: vi.fn(),
  getSession: vi.fn(),
  getStockImage: vi.fn()
}));

vi.mock("@vercel/blob", () => ({ get }));
vi.mock("next/headers", () => ({ headers }));
vi.mock("../../../../lib/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("../../../../lib/stock", () => ({ getStockImage }));

import { GET } from "./route";

describe("private stock image route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headers.mockResolvedValue(new Headers());
  });

  test("does not reveal an unlisted image to another user", async () => {
    getStockImage.mockResolvedValue({ ownerId: "owner-id", isListed: false, imageUrl: "https://store.private.blob.vercel-storage.com/stock/secret.png" });
    getSession.mockResolvedValue({ user: { id: "other-user" } });

    const response = await GET(new Request("http://test/api/stock/secret/image"), { params: Promise.resolve({ stockId: "secret" }) });

    expect(response.status).toBe(404);
    expect(get).not.toHaveBeenCalled();
  });

  test("streams a listed image without exposing the Blob URL", async () => {
    getStockImage.mockResolvedValue({ ownerId: "owner-id", isListed: true, imageUrl: "https://store.private.blob.vercel-storage.com/stock/listed.png" });
    getSession.mockResolvedValue(null);
    get.mockResolvedValue({
      statusCode: 200,
      stream: new ReadableStream(),
      blob: { contentType: "image/png", etag: "etag-value" }
    });

    const response = await GET(new Request("http://test/api/stock/listed/image"), { params: Promise.resolve({ stockId: "listed" }) });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(get).toHaveBeenCalledWith("stock/listed.png", { access: "private", ifNoneMatch: undefined });
  });
});

import { beforeEach, expect, test, vi } from "vitest";
const { getSession, createOffer, query } = vi.hoisted(() => ({ getSession: vi.fn(), createOffer: vi.fn(), query: vi.fn() }));
vi.mock("../lib/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("../lib/trades", () => ({ createOffer, OfferError: class extends Error {}, tradePool: () => ({ query }) }));
import { makeOffer } from "./actions";
import { OfferError } from "../lib/trades";
beforeEach(() => vi.resetAllMocks());
test("requires authentication before saving an offer", async () => {
  getSession.mockResolvedValue(null);
  expect(await makeOffer({}, new FormData())).toEqual({ error: "Please sign in before making an offer." });
  expect(createOffer).not.toHaveBeenCalled();
});
test("uses the signed-in identity and saves every selected item", async () => {
  getSession.mockResolvedValue({ user: { id: "alice" } });
  const data = new FormData();
  data.set("offererId", "bob"); data.set("targetId", "target"); data.append("offeredIds", "one"); data.append("offeredIds", "two");
  expect(await makeOffer({}, data)).toHaveProperty("success");
  expect(createOffer).toHaveBeenCalledWith({ offererId: "alice", targetId: "target", offeredIds: ["one", "two"] });
});
test("shows a recoverable conflict without reporting success", async () => {
  getSession.mockResolvedValue({ user: { id: "alice" } });
  createOffer.mockRejectedValue(new OfferError("Stock already committed"));
  expect(await makeOffer({}, new FormData())).toEqual({ error: "Stock already committed" });
});

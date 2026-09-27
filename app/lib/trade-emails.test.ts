import { afterEach, beforeEach, expect, test, vi } from "vitest";
const { query, release, fetchEmail } = vi.hoisted(() => ({ query: vi.fn(), release: vi.fn(), fetchEmail: vi.fn() }));
vi.mock("pg", () => ({ default: { Pool: class { async connect() { return { query, release }; } } } }));
import { deliverTradeEmails } from "./trade-emails";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("RESEND_API_KEY", "test-key"); vi.stubEnv("TRADE_EMAIL_FROM", "trades@example.test");
  vi.stubGlobal("fetch", fetchEmail);
  query.mockImplementation(async (sql) => ({ rows: sql.startsWith("SELECT") ? [{ id: "mail-one", recipient: "alice@example.test", body: "Offer terms" }, { id: "mail-two", recipient: "bob@example.test", body: "Offer terms" }] : [] }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
test("sends separately to both participants with stable retry keys", async () => {
  fetchEmail.mockResolvedValue({ ok: true });
  await deliverTradeEmails();
  expect(fetchEmail).toHaveBeenCalledTimes(2);
  expect(JSON.parse(fetchEmail.mock.calls[0][1].body).to).toEqual(["alice@example.test"]);
  expect(JSON.parse(fetchEmail.mock.calls[1][1].body).to).toEqual(["bob@example.test"]);
  expect(fetchEmail.mock.calls[0][1].headers["Idempotency-Key"]).toBe("mail-one");
  expect(query).toHaveBeenCalledWith(expect.stringContaining("SET sent_at"), ["mail-two"]);
});
test("keeps failed delivery pending and still attempts the other participant", async () => {
  fetchEmail.mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce({ ok: false });
  await expect(deliverTradeEmails()).resolves.toBeUndefined();
  expect(fetchEmail).toHaveBeenCalledTimes(2);
  expect(query.mock.calls.some(([sql]) => sql.startsWith("UPDATE"))).toBe(false);
  expect(query).toHaveBeenCalledWith("COMMIT");
});

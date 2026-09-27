import { beforeEach, afterEach, expect, test, vi } from "vitest";
const { query, release, connect } = vi.hoisted(() => ({ query: vi.fn(), release: vi.fn(), connect: vi.fn() }));
vi.mock("pg", () => ({ default: { Pool: class { connect = connect; query = query; } } }));
import { createOffer, getTrades } from "./trades";
const targetId = "10000000-0000-4000-8000-000000000001";
const ownedId = "10000000-0000-4000-8000-000000000002";
const input = { offererId: "alice", targetId, offeredIds: [ownedId] };
let stock;
beforeEach(() => {
  vi.clearAllMocks();
  stock = [{ id: targetId, owner_id: "bob", is_listed: true, name: "Yo-yo" }, { id: ownedId, owner_id: "alice", name: "Badge" }];
  connect.mockResolvedValue({ query, release });
  query.mockImplementation(async (sql) => {
    if (sql.includes("FROM stock WHERE")) return { rows: stock };
    if (sql.includes("FROM users WHERE")) return { rows: [{ id: "alice", username: "Alice", email: "alice@example.test" }, { id: "bob", username: "Bob", email: "bob@example.test" }] };
    return { rows: [], rowCount: 0 };
  });
});
afterEach(() => vi.unstubAllGlobals());
test("saves the full offer, commitments and separate notifications without transferring ownership", async () => {
  const id = await createOffer(input);
  expect(id).toEqual(expect.any(String));
  expect(query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO trades"), [id, "alice", "bob"]);
  for (const stockId of [targetId, ownedId]) expect(query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO stock_commitments"), [stockId, id]);
  for (const recipient of ["alice@example.test", "bob@example.test"]) expect(query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO trade_emails"), [expect.any(String), id, recipient, expect.stringContaining("Badge for Bob's Yo-yo")]);
  expect(query).toHaveBeenCalledWith("COMMIT");
  expect(query.mock.calls.some(([sql]) => sql.includes("UPDATE stock"))).toBe(false);
});
test.each([{offeredIds: []}, {offeredIds: [ownedId, ownedId]}, {offeredIds: [targetId]}, {offeredIds: ["invalid"]}])("rejects invalid selections %j", async ({offeredIds}) => {
  await expect(createOffer({ ...input, offeredIds })).rejects.toThrow("Choose one or more");
  expect(connect).not.toHaveBeenCalled();
});
test.each(["private", "self", "foreign", "missing"])("rejects %s stock", async (kind) => {
  if (kind === "private") stock[0].is_listed = false;
  if (kind === "self") stock[0].owner_id = "alice";
  if (kind === "foreign") stock[1].owner_id = "bob";
  if (kind === "missing") stock.pop();
  await expect(createOffer(input)).rejects.toThrow("Choose available");
  expect(query).toHaveBeenCalledWith("ROLLBACK");
  expect(release).toHaveBeenCalled();
});
test("rejects an item already reserved by a competing offer", async () => {
  const original = query.getMockImplementation();
  query.mockImplementation((sql, args) => sql.includes("FROM stock_commitments") ? { rows: [{ stock_id: ownedId }], rowCount: 1 } : original(sql, args));
  await expect(createOffer(input)).rejects.toThrow("already in an active trade");
  expect(query).not.toHaveBeenCalledWith("COMMIT");
});
test("rolls back when storing an email fails", async () => {
  const original = query.getMockImplementation();
  query.mockImplementation((sql, args) => { if (sql.includes("INSERT INTO trade_emails")) throw new Error("database unavailable"); return original(sql, args); });
  await expect(createOffer(input)).rejects.toThrow("database unavailable");
  expect(query).toHaveBeenCalledWith("ROLLBACK");
});
test("reads terms only for the requesting participant", async () => {
  expect(await getTrades("alice")).toEqual([]);
  expect(query).toHaveBeenCalledWith(expect.stringContaining("WHERE t.offerer_id = $1 OR t.recipient_id = $1"), ["alice"]);
});

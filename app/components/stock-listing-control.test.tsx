import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { StockListingControl } from "./stock-listing-control";
import { listStock, unlistStock, deleteStock } from "../account/actions";

vi.mock("../account/actions", () => ({ listStock: vi.fn(), unlistStock: vi.fn(), deleteStock: vi.fn() }));
beforeEach(() => vi.resetAllMocks());

test("unlists listed stock and displays the result", async () => {
  vi.mocked(unlistStock).mockResolvedValue({ success: "Stock is now private." });
  render(<StockListingControl stockId="stock-id" isListed stockName="Pebble" />);
  await userEvent.click(screen.getByRole("button", { name: "Unlist" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Stock is now private.");
  expect(vi.mocked(unlistStock).mock.calls[0][1].get("stockId")).toBe("stock-id");
});

test("allows private stock to be listed again", async () => {
  vi.mocked(listStock).mockResolvedValue({ success: "Stock listed publicly." });
  render(<StockListingControl stockId="stock-id" stockName="Pebble" />);
  await userEvent.click(screen.getByRole("button", { name: "List publicly" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Stock listed publicly.");
});

test.each([true, false])("requires confirmation and allows keeping stock (listed: %s)", async (isListed) => {
  const user = userEvent.setup();
  render(<StockListingControl stockId="stock-id" isListed={isListed} stockName="Pebble" />);
  await user.click(screen.getByRole("button", { name: "Delete stock" }));
  expect(screen.getByText("Delete Pebble from your stash? This cannot be undone.")).toBeVisible();
  expect(deleteStock).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Keep stock" }));
  expect(screen.queryByRole("button", { name: "Confirm delete" })).not.toBeInTheDocument();
  expect(deleteStock).not.toHaveBeenCalled();
});

test("submits a confirmed deletion and reports failure without hiding the item", async () => {
  vi.mocked(deleteStock).mockResolvedValue({ error: "That stock is not in your stash." });
  const user = userEvent.setup();
  render(<StockListingControl stockId="stock-id" stockName="Pebble" />);
  await user.click(screen.getByRole("button", { name: "Delete stock" }));
  await user.click(screen.getByRole("button", { name: "Confirm delete" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("That stock is not in your stash.");
  await waitFor(() => expect(deleteStock).toHaveBeenCalledOnce());
  expect(vi.mocked(deleteStock).mock.calls[0][1].get("stockId")).toBe("stock-id");
});

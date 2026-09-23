import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { StockForm } from "./stock-form";

vi.mock("../account/actions", () => ({ addStock: vi.fn() }));

describe("StockForm", () => {
  test("lets an owner choose the required stock details and public listing", async () => {
    const user = userEvent.setup();
    render(<StockForm />);

    expect(screen.getByLabelText("Picture")).toHaveAttribute("accept", "image/png,image/jpeg,image/webp,image/gif");
    expect(screen.getByLabelText("Name")).toBeRequired();
    expect(screen.getByLabelText("Description")).toBeRequired();
    await user.click(screen.getByLabelText("List it publicly so other people can browse it"));

    expect(screen.getByLabelText("List it publicly so other people can browse it")).toBeChecked();
    expect(screen.getByRole("button", { name: "Add stock" })).toBeEnabled();
  });
});

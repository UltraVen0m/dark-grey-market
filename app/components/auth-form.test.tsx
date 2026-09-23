import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, expect, test } from "vitest";
import { AuthForm } from "./auth-form";

const { signUpEmail, replace, refresh } = vi.hoisted(() => ({
  signUpEmail: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock("../lib/auth-client", () => ({
  authClient: { signUp: { email: signUpEmail }, signIn: { email: vi.fn() } }
}));

describe("AuthForm", () => {
  test("restores the form and shows a retry message when sign-up cannot reach the server", async () => {
    signUpEmail.mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup();
    render(<AuthForm mode="sign-up" />);

    await user.type(screen.getByLabelText("Username"), "alice");
    await user.type(screen.getByLabelText("Email"), "alice@example.test");
    await user.type(screen.getByLabelText("Password"), "a-long-enough-password");
    await user.click(screen.getByRole("button", { name: "Make my account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("We could not reach the market. Please try again.");
    expect(screen.getByRole("button", { name: "Make my account" })).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });
});

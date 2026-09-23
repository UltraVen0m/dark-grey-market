import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ProfileForm } from "./profile-form";

const { updateUser, changeEmail, changePassword, refresh } = vi.hoisted(() => ({
  updateUser: vi.fn(),
  changeEmail: vi.fn(),
  changePassword: vi.fn(),
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("../lib/auth-client", () => ({
  authClient: { updateUser, changeEmail, changePassword }
}));

describe("ProfileForm", () => {
  afterEach(() => vi.clearAllMocks());

  test("saves the public username and profile picture", async () => {
    updateUser.mockResolvedValueOnce({ data: { status: true } });
    const user = userEvent.setup();
    render(<ProfileForm email="alice@example.test" username="alice" profileImageUrl="/avatars/default.svg" />);

    await user.clear(screen.getByLabelText("Username"));
    await user.type(screen.getByLabelText("Username"), "alice-updated");
    await user.clear(screen.getByLabelText("Profile picture URL"));
    await user.type(screen.getByLabelText("Profile picture URL"), "/avatars/orbit.svg");
    await user.click(screen.getByRole("button", { name: "Save public profile" }));

    expect(updateUser).toHaveBeenCalledWith({ name: "alice-updated", image: "/avatars/orbit.svg" });
    expect(await screen.findByRole("status")).toHaveTextContent("Your public profile is saved.");
    expect(refresh).toHaveBeenCalled();
  });

  test("does not send mismatched new passwords", async () => {
    const user = userEvent.setup();
    render(<ProfileForm email="alice@example.test" username="alice" profileImageUrl="/avatars/default.svg" />);

    await user.type(screen.getByLabelText("Current password"), "a-long-enough-password");
    await user.type(screen.getByLabelText("New password", { exact: true }), "another-password");
    await user.type(screen.getByLabelText("Confirm new password"), "different-password");
    await user.click(screen.getByRole("button", { name: "Save password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Your new passwords need to match.");
    expect(changePassword).not.toHaveBeenCalled();
  });
});

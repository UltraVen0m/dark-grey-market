"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "../lib/auth-client";

function messageFor(result, fallback) {
  return result?.error?.message || fallback;
}

export function ProfileForm({ email, profileImageUrl, username }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  async function save(kind, request, successMessage) {
    setMessage("");
    setError("");
    setSaving(kind);

    try {
      const result = await request();
      if (result?.error) {
        setError(messageFor(result, "That did not save. Please try again."));
        return;
      }
      setMessage(successMessage);
      router.refresh();
    } catch {
      setError("We could not reach the market. Please try again.");
    } finally {
      setSaving("");
    }
  }

  function handlePublicProfile(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    save(
      "public-profile",
      () => authClient.updateUser({ name: form.get("username"), image: form.get("profileImageUrl") }),
      "Your public profile is saved."
    );
  }

  function handleEmail(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    save("email", () => authClient.changeEmail({ newEmail: form.get("email") }), "Your email is saved.");
  }

  function handlePassword(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = form.get("newPassword");
    const confirmation = form.get("passwordConfirmation");
    setMessage("");
    setError("");
    if (newPassword !== confirmation) {
      setError("Your new passwords need to match.");
      return;
    }
    save(
      "password",
      () => authClient.changePassword({ currentPassword: form.get("currentPassword"), newPassword }),
      "Your password is saved."
    );
  }

  return (
    <div className="profile-forms">
      <form className="account-details" onSubmit={handlePublicProfile}>
        <h2>Public profile</h2>
        <p>This appears on the stock you list.</p>
        <label>Username<input name="username" required defaultValue={username} autoComplete="username" /></label>
        <label>Profile picture URL<input name="profileImageUrl" required defaultValue={profileImageUrl} /></label>
        <button type="submit" disabled={saving === "public-profile"}>{saving === "public-profile" ? "Saving…" : "Save public profile"}</button>
      </form>

      <form className="account-details" onSubmit={handleEmail}>
        <h2>Email</h2>
        <label>Email<input name="email" type="email" required defaultValue={email} autoComplete="email" /></label>
        <button type="submit" disabled={saving === "email"}>{saving === "email" ? "Saving…" : "Save email"}</button>
      </form>

      <form className="account-details" onSubmit={handlePassword}>
        <h2>Password</h2>
        <label>Current password<input name="currentPassword" type="password" required minLength="8" autoComplete="current-password" /></label>
        <label>New password<input name="newPassword" type="password" required minLength="8" autoComplete="new-password" /></label>
        <label>Confirm new password<input name="passwordConfirmation" type="password" required minLength="8" autoComplete="new-password" /></label>
        <button type="submit" disabled={saving === "password"}>{saving === "password" ? "Saving…" : "Save password"}</button>
      </form>

      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
    </div>
  );
}

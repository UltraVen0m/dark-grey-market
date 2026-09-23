"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "../lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function signOut() {
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError(result.error.message || "We could not sign you out. Please try again.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("We could not sign you out. Please try again.");
    }
  }

  return <><button className="auth-link" type="button" onClick={signOut}>Sign out</button>{error && <p className="form-error" role="alert">{error}</p>}</>;
}

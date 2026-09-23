"use client";

import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }

  return <button className="auth-link" type="button" onClick={signOut}>Sign out</button>;
}

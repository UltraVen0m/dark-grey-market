"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "../lib/auth-client";

export function AuthForm({ mode }) {
  const isSignUp = mode === "sign-up";
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setIsSubmitting(true);

    const credentials = {
      email: form.get("email"),
      password: form.get("password"),
      callbackURL: "/account"
    };
    try {
      const result = isSignUp
        ? await authClient.signUp.email({ ...credentials, name: form.get("name") })
        : await authClient.signIn.email(credentials);

      if (result.error) {
        setError(result.error.message || "That did not work. Please try again.");
        return;
      }

      router.replace("/account");
      router.refresh();
    } catch {
      setError("We could not reach the market. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      {isSignUp && <label>Username<input name="name" required autoComplete="username" /></label>}
      <label>Email<input name="email" type="email" required autoComplete="email" /></label>
      <label>Password<input name="password" type="password" required minLength="8" autoComplete={isSignUp ? "new-password" : "current-password"} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? "One sec…" : isSignUp ? "Make my account" : "Sign in"}</button>
      <p>{isSignUp ? "Already have an account?" : "New here?"} <Link href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "Sign in" : "Sign up"}</Link></p>
    </form>
  );
}

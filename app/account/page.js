import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../lib/auth";
import { SignOutButton } from "../components/sign-out-button";
import { ProfileForm } from "../components/profile-form";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true }
  });
  if (!session) redirect("/sign-in");

  return (
    <main className="auth-page">
      <p className="eyebrow">Your account</p>
      <h1>Hello, {session.user.name}.</h1>
      <p className="intro">Make this account yours. Your username and picture are what people see next to your listed stock.</p>
      <ProfileForm
        email={session.user.email}
        profileImageUrl={session.user.image || "/avatars/default.svg"}
        username={session.user.name}
      />
      <SignOutButton />
    </main>
  );
}

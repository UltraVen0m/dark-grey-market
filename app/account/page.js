import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../lib/auth";
import { SignOutButton } from "../components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return (
    <main className="auth-page">
      <p className="eyebrow">Your account</p>
      <h1>Hello, {session.user.name}.</h1>
      <p className="intro">This space is just for you. Your listed stock and swaps will live here as those features arrive.</p>
      <dl className="account-details"><dt>Username</dt><dd>{session.user.name}</dd><dt>Email</dt><dd>{session.user.email}</dd></dl>
      <SignOutButton />
    </main>
  );
}

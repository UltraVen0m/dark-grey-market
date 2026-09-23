import { AuthForm } from "../components/auth-form";

export default function SignInPage() {
  return <main className="auth-page"><p className="eyebrow">Welcome back</p><h1>Good to see you.</h1><p className="intro">Sign in to manage your account and future swaps.</p><AuthForm mode="sign-in" /></main>;
}

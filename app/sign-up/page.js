import { AuthForm } from "../components/auth-form";

export default function SignUpPage() {
  return <main className="auth-page"><p className="eyebrow">Dark Grey Market</p><h1>Put your name on the table.</h1><p className="intro">Anyone can join. No school code, invitation, or approval needed.</p><AuthForm mode="sign-up" /></main>;
}

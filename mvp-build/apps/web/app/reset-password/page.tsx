import Link from "next/link";
import { FLOW_CSS } from "../flow-styles";

export const metadata = { title: "Set a new password — AMTECH" };

/** Reached from the reset link. Sets a new password, then back to work. */
export default function ResetPassword() {
  return (
    <main className="fl-root">
      <style>{FLOW_CSS}</style>
      <div className="fl-card" style={{ maxWidth: 480 }}>
        <header className="fl-head">
          <Link className="fl-logo" href="/">AMTECH<span aria-hidden>.</span></Link>
          <span className="fl-head-note">New password</span>
        </header>
        <div className="fl-title">
          <h1>Set a new password</h1>
          <p>Pick something you&rsquo;ll remember. You&rsquo;ll use it with the email on your account.</p>
        </div>
        <section className="fl-step">
          <span className="fl-step-tag">New password</span>
          <div className="fl-row">
            <input className="fl-input" type="password" style={{ flex: "1 1 100%" }} placeholder="New password" />
          </div>
          <div className="fl-row">
            <input className="fl-input" type="password" style={{ flex: "1 1 100%" }} placeholder="Confirm password" />
          </div>
        </section>
        <section className="fl-step">
          <div className="fl-row">
            <Link className="fl-btn red" style={{ textDecoration: "none" }} href="/login">Save and sign in</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

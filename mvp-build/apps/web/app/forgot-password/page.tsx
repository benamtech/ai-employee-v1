import Link from "next/link";
import { FLOW_CSS } from "../flow-styles";

export const metadata = { title: "Reset your password — AMTECH" };

/**
 * Password recovery. Owner-safe: state the two ways back in (email reset, or the
 * signed links the employee texts). No backend claim — this is the surface.
 */
export default function ForgotPassword() {
  return (
    <main className="fl-root">
      <style>{FLOW_CSS}</style>
      <div className="fl-card" style={{ maxWidth: 480 }}>
        <header className="fl-head">
          <Link className="fl-logo" href="/">AMTECH<span aria-hidden>.</span></Link>
          <span className="fl-head-note">Reset password</span>
        </header>
        <div className="fl-title">
          <h1>Get back in</h1>
          <p>
            Enter the email on your account and we&rsquo;ll send a reset link. Your employee keeps
            working the whole time — nothing pauses.
          </p>
        </div>
        <section className="fl-step">
          <span className="fl-step-tag">Send a reset link</span>
          <div className="fl-row">
            <input className="fl-input" placeholder="owner@example.com" />
            <button className="fl-btn">Send link</button>
          </div>
        </section>
        <section className="fl-step">
          <span className="fl-step-tag">In a hurry?</span>
          <h2>Use a text link</h2>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "rgba(10,10,10,0.62)" }}>
            The secure links your employee texts you open your work directly — no password needed
            to review, approve, or reply.
          </p>
        </section>
      </div>
    </main>
  );
}

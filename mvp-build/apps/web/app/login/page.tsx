import Link from "next/link";
import { FLOW_CSS } from "../flow-styles";

export const metadata = { title: "Sign in — AMTECH" };

/** Owner login (Supabase Auth). Phase 1 wires email/password sign-in; the session
 *  authorizes the owner web employee surface at /agent/[employeeId]. */
export default function Login() {
  return (
    <main className="fl-root">
      <style>{FLOW_CSS}</style>
      <div className="fl-card" style={{ maxWidth: 480 }}>
        <header className="fl-head">
          <Link className="fl-logo" href="/">AMTECH<span aria-hidden>.</span></Link>
          <span className="fl-head-note">Owner sign-in</span>
        </header>
        <div className="fl-title">
          <h1>Sign in</h1>
          <p>
            Email sign-in is being finished. For now, use the secure links your employee
            texts you — they open your work directly, no password needed.
          </p>
        </div>
        <section className="fl-step">
          <span className="fl-step-tag">New here?</span>
          <div className="fl-row">
            <Link className="fl-btn red" style={{ textDecoration: "none" }} href="/create-ai-employee">Create your AI employee</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

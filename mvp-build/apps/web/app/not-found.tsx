import Link from "next/link";
import { FLOW_CSS } from "./flow-styles";

export const metadata = { title: "Page not found — AMTECH" };

export default function NotFound() {
  return (
    <main className="fl-root">
      <style>{FLOW_CSS}</style>
      <div className="fl-card" style={{ maxWidth: 480 }}>
        <header className="fl-head">
          <Link className="fl-logo" href="/">AMTECH<span aria-hidden>.</span></Link>
          <span className="fl-head-note">404</span>
        </header>
        <div className="fl-title">
          <h1>That page isn&rsquo;t here</h1>
          <p>
            The link may be old, or the address was mistyped. Your employee&rsquo;s work is
            safe — nothing was lost.
          </p>
        </div>
        <section className="fl-step">
          <div className="fl-row">
            <Link className="fl-btn" style={{ textDecoration: "none" }} href="/">Go to the front door</Link>
            <Link className="fl-btn quiet" style={{ textDecoration: "none" }} href="/login">Sign in</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

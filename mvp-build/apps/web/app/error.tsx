"use client";

/**
 * Global error boundary. Owner-safe by design: no stack traces, no developer
 * vocabulary — a plain statement, a retry, and a way home. The error object is
 * intentionally not rendered.
 */
import Link from "next/link";
import { FLOW_CSS } from "./flow-styles";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="fl-root">
      <style>{FLOW_CSS}</style>
      <div className="fl-card" style={{ maxWidth: 480 }}>
        <header className="fl-head">
          <Link className="fl-logo" href="/">AMTECH<span aria-hidden>.</span></Link>
          <span className="fl-head-note">Something went wrong</span>
        </header>
        <div className="fl-title">
          <h1>This page hit a snag</h1>
          <p>
            Your employee and its work are fine — this screen just failed to load.
            Try again, and if it keeps happening, text your employee; it can send
            you a fresh link.
          </p>
        </div>
        <section className="fl-step">
          <div className="fl-row">
            <button className="fl-btn" onClick={() => reset()}>Try again</button>
            <Link className="fl-btn quiet" style={{ textDecoration: "none" }} href="/">Go to the front door</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

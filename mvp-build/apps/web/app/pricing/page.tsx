import Link from "next/link";
import { PublicFooter, PublicHeader, PUBLIC_CSS } from "../public-chrome";

export const metadata = {
  title: "Pricing — AMTECH",
  description: "Early access is free. Here's where it's headed: a live AI employee for your business, from first free work to a full office loop.",
};

/**
 * Pricing / the offer ladder. Honest early-access framing — nothing is billed
 * today. The ladder is the roadmap (free first work → tuned estimate package →
 * live employee → managed office loop), not a live checkout.
 */
export default function Pricing() {
  return (
    <main className="pub-root">
      <style>{PUBLIC_CSS}</style>
      <PublicHeader />
      <div className="pub-main">
        <section className="pub-hero">
          <p className="pub-kicker">Pricing — early access</p>
          <h1>Free while we build it with you<span className="p">.</span></h1>
          <p className="sub">
            Right now, creating your employee and putting it to work costs nothing — we&rsquo;re
            onboarding early businesses by hand. Here&rsquo;s the ladder it grows into.
          </p>
        </section>

        <section className="tiers" aria-label="The offer ladder">
          <div className="tier">
            <span className="rung">Rung 0 — Now</span>
            <h2>First work, free</h2>
            <div className="price">$0</div>
            <p>We price a real job on your own numbers so you can judge it. No card, no commitment.</p>
            <ul>
              <li>A real estimate on your job</li>
              <li>Texted, reviewed, yours to keep</li>
              <li>See the accuracy for yourself</li>
            </ul>
            <div className="foot-note"><Link className="pub-nav-cta" href="/create-ai-employee">Start free</Link></div>
          </div>

          <div className="tier">
            <span className="rung">Rung 1 — Tuned</span>
            <h2>Estimate package</h2>
            <div className="price">$300 <small>one-time</small></div>
            <p>A 20-minute interview that installs your pricing and your way of working into the employee&rsquo;s brain.</p>
            <ul>
              <li>Your line items, your margins</li>
              <li>Assumptions and low-confidence flags</li>
              <li>Estimates within ~5%</li>
            </ul>
          </div>

          <div className="tier feature">
            <span className="rung">Rung 2 — Live employee</span>
            <h2>The AI employee</h2>
            <div className="price">$1,000 <small>/mo + $750 setup</small></div>
            <p>Its own number. Writes estimates, drafts customer emails, preps invoices — and asks before anything leaves the business.</p>
            <ul>
              <li>Email + estimate, voice → draft → approve</li>
              <li>Deposit invoices and payment links</li>
              <li>Replies, reminders, receipts</li>
            </ul>
            <div className="foot-note"><Link className="pub-band-cta" style={{ height: 42, marginTop: 0 }} href="/create-ai-employee">Join early access</Link></div>
          </div>

          <div className="tier">
            <span className="rung">Rung 3 — Managed</span>
            <h2>Office loop</h2>
            <div className="price">$1,500 <small>/mo + setup</small></div>
            <p>The Pro employee plus the books: expenses, bills, invoices, and simple P&amp;L / AR / AP — behind the approval gate.</p>
            <ul>
              <li>Everything in the live employee</li>
              <li>Connected accounting (QuickBooks)</li>
              <li>Drive, invoicing, follow-up</li>
            </ul>
          </div>
        </section>

        <section className="pub-band">
          <h2>You stay the boss of what leaves the business<span aria-hidden>.</span></h2>
          <p>Every rung keeps the same rule: your employee prepares the work, you approve what goes out.</p>
          <Link className="pub-band-cta" href="/create-ai-employee">Create your AI employee</Link>
        </section>
      </div>
      <PublicFooter />
    </main>
  );
}

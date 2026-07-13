import Link from "next/link";

export const metadata = {
  title: "Meet your employee — AMTECH",
  description: "Your AI employee is ready. Here's its number and the first thing to text it.",
};

/**
 * Onboarding success — "meet your employee". Reached after provisioning
 * (replaces the raw-JSON end of the create flow). Reads employee name/number/id
 * from query params where present; falls back to sensible copy. Static server
 * component — no backend claim.
 */
export default async function Welcome({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; number?: string; employeeId?: string }>;
}) {
  const { name, number, employeeId } = await searchParams;
  const employeeName = name || "your employee";
  const phone = number || "your new number";
  const deskHref = employeeId ? `/agent/${employeeId}` : "/login";

  return (
    <main className="wl-root">
      <style>{WELCOME_CSS}</style>
      <header className="wl-bar">
        <Link className="wl-logo" href="/">AMTECH<span aria-hidden>.</span></Link>
        <span className="wl-note">Employee ready</span>
      </header>

      <section className="wl-hero">
        <p className="wl-kicker">✓ Set up complete</p>
        <h1>Meet {employeeName}<span className="p">.</span></h1>
        <p className="wl-sub">
          It has its own phone number, it knows your business, and it&rsquo;s ready to work.
          Say hello and give it the first job.
        </p>

        <div className="wl-number">
          <span className="wl-number-label">Your employee&rsquo;s number</span>
          <span className="wl-number-value">{phone}</span>
        </div>

        <div className="wl-cta-row">
          <Link className="wl-cta" href={deskHref}>Open the desk</Link>
          <span className="wl-cta-hint">or just text the number above</span>
        </div>
      </section>

      <section className="wl-steps" aria-label="First steps">
        <div className="wl-step">
          <span className="wl-step-tag">First — say hi</span>
          <h2>Text it a real job</h2>
          <p>&ldquo;Jane wants the kitchen repainted, two coats — price it.&rdquo; It&rsquo;ll come back with an estimate you can review.</p>
        </div>
        <div className="wl-step">
          <span className="wl-step-tag">Then — connect</span>
          <h2>Hook up email &amp; payments</h2>
          <p>Connect Gmail and Stripe so it can send estimates and collect deposits — always behind your approval.</p>
        </div>
        <div className="wl-step">
          <span className="wl-step-tag">Anytime — approve</span>
          <h2>You have the last word</h2>
          <p>Nothing leaves your business until you say yes. You&rsquo;ll get a text; tap, look, approve.</p>
        </div>
      </section>

      <section className="wl-band">
        <p>Your employee is working. You&rsquo;re the boss.</p>
        <Link className="wl-band-cta" href={deskHref}>Open the desk</Link>
      </section>
    </main>
  );
}

const WELCOME_CSS = `
  .wl-root { min-height: 100vh; background: #ffffff; color: #0a0a0a; font-family: var(--font-inter), Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif; }
  .wl-logo { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 15px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; text-decoration: none; color: #0a0a0a; }
  .wl-logo span { color: #e11d2a; }
  .wl-bar { display: flex; align-items: center; justify-content: space-between; height: 60px; padding: 0 24px; border-bottom: 1px solid rgba(10,10,10,0.10); }
  .wl-note { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(10,10,10,0.62); }
  .wl-hero { padding: 60px 24px 36px; max-width: 900px; margin: 0 auto; }
  .wl-kicker { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: #e11d2a; margin: 0 0 18px; }
  .wl-hero h1 { font-size: clamp(2.4rem, 6vw, 3.75rem); font-weight: 900; letter-spacing: -0.03em; line-height: 1.02; margin: 0; text-wrap: balance; }
  .wl-hero h1 .p { color: #e11d2a; }
  .wl-sub { font-size: clamp(1.05rem, 2.2vw, 1.375rem); font-weight: 600; line-height: 1.5; color: rgba(10,10,10,0.62); max-width: 600px; margin: 24px 0 0; }
  .wl-number { margin-top: 36px; border: 1px solid rgba(10,10,10,0.15); border-left: 3px solid #e11d2a; padding: 18px 24px; display: inline-block; }
  .wl-number-label { display: block; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(10,10,10,0.62); }
  .wl-number-value { display: block; font-size: 30px; font-weight: 800; letter-spacing: -0.015em; margin-top: 6px; }
  .wl-cta-row { display: flex; align-items: center; gap: 18px; margin-top: 30px; flex-wrap: wrap; }
  .wl-cta { background: #0a0a0a; color: #fff; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; text-decoration: none; padding: 0 24px; height: 48px; display: inline-flex; align-items: center; }
  .wl-cta:hover { background: #ff1a2b; }
  .wl-cta-hint { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(10,10,10,0.62); }
  .wl-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1px; background: rgba(10,10,10,0.10); border-top: 1px solid rgba(10,10,10,0.10); border-bottom: 1px solid rgba(10,10,10,0.10); }
  .wl-step { background: #fff; padding: 36px 24px; }
  .wl-step-tag { display: block; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: #e11d2a; margin-bottom: 12px; }
  .wl-step h2 { font-size: 18px; font-weight: 800; letter-spacing: -0.015em; margin: 0 0 9px; }
  .wl-step p { font-size: 15px; line-height: 1.6; color: rgba(10,10,10,0.62); margin: 0; }
  .wl-band { background: #e11d2a; color: #fff; padding: 48px 24px; text-align: center; }
  .wl-band p { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 900; letter-spacing: -0.03em; margin: 0; }
  .wl-band-cta { display: inline-flex; align-items: center; margin-top: 24px; border: 1px solid #fff; color: #fff; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; text-decoration: none; padding: 0 24px; height: 48px; }
  .wl-band-cta:hover { background: #fff; color: #e11d2a; }
  @media (max-width: 760px) { .wl-hero { padding: 36px 24px; } .wl-band { padding: 36px 24px; } }
`;

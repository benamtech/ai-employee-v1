import Link from "next/link";

export const metadata = { title: "Billing — AMTECH" };

/**
 * Owner billing. During early access there is no charge and no paywall — this
 * shows the plan, what's included, and where it's headed, honestly. Static
 * surface; the real plan/usage comes from Manager later.
 */
export default async function Billing({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;
  return (
    <main className="bl-root">
      <style>{BILLING_CSS}</style>
      <header className="bl-bar">
        <Link className="bl-logo" href={`/agent/${employeeId}`}>AMTECH<span aria-hidden>.</span></Link>
        <span className="bl-note">Billing</span>
      </header>

      <div className="bl-body">
        <div className="bl-plan">
          <div className="bl-plan-head">
            <div>
              <span className="bl-kicker">Your plan</span>
              <h1>Early access<span className="p">.</span></h1>
            </div>
            <span className="bl-badge">Free</span>
          </div>
          <p className="bl-sub">You&rsquo;re on early access — your employee works at no charge while we build it with you. We&rsquo;ll tell you before anything is ever billed.</p>
        </div>

        <section className="bl-sec">
          <h2 className="bl-sec-head">What&rsquo;s included now</h2>
          <ul className="bl-list">
            <li>Your AI employee, with its own number</li>
            <li>Estimates, drafts, invoices — behind your approval</li>
            <li>Connected email, payments, and accounting</li>
            <li>Receipts and proof for everything it does</li>
          </ul>
        </section>

        <section className="bl-sec">
          <h2 className="bl-sec-head">Where it&rsquo;s headed</h2>
          <table className="bl-table">
            <tbody>
              <tr><td>Tuned estimate package</td><td className="n">$300 <small>one-time</small></td></tr>
              <tr><td>Live employee — Starter</td><td className="n">$1,000<small>/mo</small> + $750 setup</td></tr>
              <tr><td>Live employee — Pro (with books)</td><td className="n">$1,500<small>/mo</small> + setup</td></tr>
            </tbody>
          </table>
          <p className="bl-fine">Shown for transparency. Nothing here is active — you won&rsquo;t be charged during early access. <Link className="bl-link" href="/pricing">See the full ladder →</Link></p>
        </section>

        <section className="bl-sec">
          <h2 className="bl-sec-head">Payment method</h2>
          <div className="bl-empty">No card on file. None is needed during early access.</div>
        </section>
      </div>
    </main>
  );
}

const BILLING_CSS = `
  .bl-root { min-height: 100vh; background: #f4f4f4; color: #0a0a0a; font-family: var(--font-inter), Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif; }
  .bl-logo { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; text-decoration: none; color: #0a0a0a; }
  .bl-logo span { color: #e11d2a; }
  .bl-bar { display: flex; align-items: center; justify-content: space-between; height: 48px; padding: 0 24px; background: #fff; border-bottom: 1px solid rgba(10,10,10,0.10); }
  .bl-note { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(10,10,10,0.62); }
  .bl-body { max-width: 660px; margin: 0 auto; padding: 36px 24px; display: grid; gap: 18px; }
  .bl-plan { background: #fff; border: 1px solid rgba(10,10,10,0.10); padding: 24px; }
  .bl-plan-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .bl-kicker { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: #e11d2a; }
  .bl-plan h1 { font-size: 30px; font-weight: 800; letter-spacing: -0.03em; margin: 6px 0 0; }
  .bl-plan h1 .p { color: #e11d2a; }
  .bl-badge { display: inline-flex; align-items: center; height: 24px; padding: 0 9px; border: 1px solid #0a0a0a; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; }
  .bl-sub { font-size: 15px; line-height: 1.6; color: rgba(10,10,10,0.62); margin: 12px 0 0; max-width: 62ch; }
  .bl-sec { background: #fff; border: 1px solid rgba(10,10,10,0.10); }
  .bl-sec-head { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; margin: 0; padding: 9px 15px; border-bottom: 1px solid rgba(10,10,10,0.10); }
  .bl-list { list-style: none; margin: 0; padding: 15px; display: grid; gap: 9px; }
  .bl-list li { font-size: 15px; line-height: 1.5; padding-left: 18px; position: relative; }
  .bl-list li::before { content: "✓"; position: absolute; left: 0; color: #e11d2a; font-weight: 700; }
  .bl-table { width: 100%; border-collapse: collapse; }
  .bl-table td { padding: 9px 15px; border-bottom: 1px solid rgba(10,10,10,0.05); font-size: 15px; }
  .bl-table tr:last-child td { border-bottom: 0; }
  .bl-table td.n { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; white-space: nowrap; }
  .bl-table small { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(10,10,10,0.62); }
  .bl-fine { font-size: 12px; line-height: 1.6; color: rgba(10,10,10,0.62); margin: 0; padding: 12px 15px; border-top: 1px solid rgba(10,10,10,0.05); }
  .bl-link { color: #e11d2a; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; text-decoration: underline; text-underline-offset: 3px; }
  .bl-empty { padding: 18px 15px; font-size: 12px; color: rgba(10,10,10,0.62); }
`;

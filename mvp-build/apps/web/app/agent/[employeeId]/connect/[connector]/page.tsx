import Link from "next/link";

export const metadata = { title: "Connect an account — AMTECH" };

type ConnectorMeta = {
  label: string;
  what: string[];
  wont: string[];
};

const CONNECTORS: Record<string, ConnectorMeta> = {
  gmail: {
    label: "Email",
    what: ["Read the threads about a job so it can follow up", "Draft customer emails for you to approve", "Send only what you approve, from your address"],
    wont: ["Send anything without your yes", "Read email unrelated to your work", "Store your password — it uses a scoped, revocable key"],
  },
  stripe: {
    label: "Payments",
    what: ["Prepare deposit invoices and payment links", "Show you a preview before anything is charged", "Track which invoices got paid, and leave receipts"],
    wont: ["Move money without your approval", "See or store your customers' card numbers", "Change your payout settings"],
  },
  quickbooks: {
    label: "Accounting",
    what: ["Record expenses, bills, invoices, and payments", "Read simple P&L, AR, and AP summaries", "Keep your books tidy behind the approval gate"],
    wont: ["Post a write to your books without approval", "Touch payroll or tax filings", "Store your Intuit password"],
  },
};

function meta(key: string): ConnectorMeta {
  return CONNECTORS[key] ?? {
    label: key.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    what: ["Do the connected work you ask for", "Show you a preview before anything leaves the business"],
    wont: ["Act without your approval on risky work", "Store your password in plain text"],
  };
}

/**
 * Connector consent + result. Owner-safe permission screen: what the employee
 * will and won't do, then Connect. `?state=connected|failed` renders the
 * landing an OAuth callback returns to. Static surface — no live OAuth claim.
 */
export default async function Connect({
  params,
  searchParams,
}: {
  params: Promise<{ employeeId: string; connector: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  const { employeeId, connector } = await params;
  const { state } = await searchParams;
  const m = meta(connector);
  const deskHref = `/agent/${employeeId}`;

  if (state === "connected") {
    return (
      <Shell employeeId={employeeId} note="Connected">
        <div className="cn-result">
          <p className="cn-kicker" style={{ color: "#0a0a0a" }}>✓ Connected</p>
          <h1>{m.label} is connected<span className="p">.</span></h1>
          <p className="cn-sub">Your employee can do {m.label.toLowerCase()} work now — always behind your approval. You&rsquo;ll see it light up on the desk under Connected.</p>
          <div className="cn-cta-row"><Link className="cn-cta" href={deskHref}>Back to the desk</Link></div>
        </div>
      </Shell>
    );
  }

  if (state === "failed") {
    return (
      <Shell employeeId={employeeId} note="Couldn't connect">
        <div className="cn-result">
          <p className="cn-kicker" style={{ color: "#e11d2a" }}>Couldn&rsquo;t connect</p>
          <h1>{m.label} didn&rsquo;t connect<span className="p">.</span></h1>
          <p className="cn-sub">Nothing changed and no work was affected. This usually clears up on a second try — the sign-in window may have closed or timed out.</p>
          <div className="cn-cta-row">
            <Link className="cn-cta" href={`/agent/${employeeId}/connect/${connector}`}>Try again</Link>
            <Link className="cn-cta quiet" href={deskHref}>Back to the desk</Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell employeeId={employeeId} note={`Connect ${m.label.toLowerCase()}`}>
      <div className="cn-consent">
        <p className="cn-kicker">Connect an account</p>
        <h1>Let your employee use {m.label.toLowerCase()}<span className="p">.</span></h1>
        <p className="cn-sub">Here&rsquo;s exactly what it can and can&rsquo;t do once you connect. You can disconnect any time.</p>

        <div className="cn-cols">
          <div className="cn-col">
            <span className="cn-col-tag ok">It will</span>
            <ul>{m.what.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
          <div className="cn-col">
            <span className="cn-col-tag no">It won&rsquo;t</span>
            <ul className="no">{m.wont.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
        </div>

        <div className="cn-cta-row">
          <Link className="cn-cta" href={`/agent/${employeeId}/connect/${connector}?state=connected`}>Connect {m.label.toLowerCase()}</Link>
          <Link className="cn-cta quiet" href={deskHref}>Not now</Link>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ employeeId, note, children }: { employeeId: string; note: string; children: React.ReactNode }) {
  return (
    <main className="cn-root">
      <style>{CONNECT_CSS}</style>
      <header className="cn-bar">
        <Link className="cn-logo" href={`/agent/${employeeId}`}>AMTECH<span aria-hidden>.</span></Link>
        <span className="cn-note">{note}</span>
      </header>
      <div className="cn-body">{children}</div>
    </main>
  );
}

const CONNECT_CSS = `
  .cn-root { min-height: 100vh; background: #f4f4f4; color: #0a0a0a; font-family: var(--font-inter), Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif; }
  .cn-logo { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; text-decoration: none; color: #0a0a0a; }
  .cn-logo span { color: #e11d2a; }
  .cn-bar { display: flex; align-items: center; justify-content: space-between; height: 48px; padding: 0 24px; background: #fff; border-bottom: 1px solid rgba(10,10,10,0.10); }
  .cn-note { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(10,10,10,0.62); }
  .cn-body { max-width: 660px; margin: 0 auto; padding: 48px 24px; }
  .cn-consent, .cn-result { background: #fff; border: 1px solid rgba(10,10,10,0.10); padding: 30px 24px; }
  .cn-kicker { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: #e11d2a; margin: 0 0 12px; }
  .cn-body h1 { font-size: clamp(1.5rem, 4vw, 2.25rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin: 0; text-wrap: balance; }
  .cn-body h1 .p { color: #e11d2a; }
  .cn-sub { font-size: 15px; line-height: 1.6; color: rgba(10,10,10,0.62); max-width: 62ch; margin: 12px 0 0; }
  .cn-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1px; background: rgba(10,10,10,0.10); border: 1px solid rgba(10,10,10,0.10); margin: 24px 0; }
  .cn-col { background: #fff; padding: 18px; }
  .cn-col-tag { display: inline-flex; align-items: center; height: 18px; padding: 0 6px; border: 1px solid; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px; }
  .cn-col-tag.ok { border-color: #0a0a0a; color: #0a0a0a; }
  .cn-col-tag.no { border-color: #e11d2a; color: #e11d2a; }
  .cn-col ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 9px; }
  .cn-col li { font-size: 12px; line-height: 1.5; padding-left: 18px; position: relative; }
  .cn-col li::before { content: "✓"; position: absolute; left: 0; color: #0a0a0a; font-weight: 700; }
  .cn-col ul.no li::before { content: "✕"; color: #e11d2a; }
  .cn-cta-row { display: flex; align-items: center; gap: 12px; margin-top: 24px; flex-wrap: wrap; }
  .cn-cta { background: #0a0a0a; color: #fff; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; text-decoration: none; padding: 0 24px; height: 48px; display: inline-flex; align-items: center; }
  .cn-cta:hover { background: #ff1a2b; }
  .cn-cta.quiet { background: #fff; color: #0a0a0a; border: 1px solid rgba(10,10,10,0.15); }
  .cn-cta.quiet:hover { border-color: #0a0a0a; }
`;

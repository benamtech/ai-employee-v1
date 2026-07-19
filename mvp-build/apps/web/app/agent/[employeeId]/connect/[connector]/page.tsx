import Link from "next/link";
import { resolveOwnerOAuthConnectorSetup } from "@amtech/shared";

export const metadata = { title: "Connect an account — AMTECH" };

function safeReturnPath(value: string | undefined, employeeId: string): string {
  const fallback = `/agent/${encodeURIComponent(employeeId)}`;
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value) || value.length > 500) return fallback;
  return value;
}

/** Owner-safe consent and result surface. The Connect action enters the existing
 * Manager OAuth tool; the provider callback returns to the signed initiating work
 * path rather than synthesizing a connected state in the browser. */
export default async function Connect({
  params,
  searchParams,
}: {
  params: Promise<{ employeeId: string; connector: string }>;
  searchParams: Promise<{ state?: string; returnTo?: string }>;
}) {
  const { employeeId, connector } = await params;
  const { state, returnTo: rawReturnTo } = await searchParams;
  const setup = resolveOwnerOAuthConnectorSetup(connector);
  const returnTo = safeReturnPath(rawReturnTo, employeeId);
  const deskHref = returnTo;

  if (!setup) {
    const label = connector.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
    return (
      <Shell employeeId={employeeId} note="Managed connection required">
        <div className="cn-result">
          <p className="cn-kicker">Connection not self-service</p>
          <h1>{label} needs managed setup<span className="p">.</span></h1>
          <p className="cn-sub">AMTECH does not have an approved OAuth start contract and redirect-host policy for this connector yet. Nothing was connected, and no generic redirect will be accepted.</p>
          <div className="cn-insurance"><strong>Why this is blocked</strong><span>Unknown connectors default to Manager custody. A provider must have explicit scopes, callback handling, token storage, revocation, and authorization-host allowlisting before this button becomes active.</span></div>
          <div className="cn-cta-row"><Link className="cn-cta quiet" href={deskHref}>Return to the work</Link></div>
        </div>
      </Shell>
    );
  }

  const retryHref = `/agent/${encodeURIComponent(employeeId)}/connect/${encodeURIComponent(setup.key)}?returnTo=${encodeURIComponent(returnTo)}`;
  const startHref = `/api/employee/${encodeURIComponent(employeeId)}/connect/${encodeURIComponent(setup.key)}?returnTo=${encodeURIComponent(returnTo)}`;

  if (state === "connected") {
    return (
      <Shell employeeId={employeeId} note="Connected">
        <div className="cn-result">
          <p className="cn-kicker" style={{ color: "#0a0a0a" }}>✓ Connected</p>
          <h1>{setup.label} is connected<span className="p">.</span></h1>
          <p className="cn-sub">The provider returned through a signed, employee-bound state. AMTECH now keeps the credential in Manager custody; consequential actions still use the existing approval and receipt boundaries.</p>
          <div className="cn-insurance"><strong>Credential posture</strong><span>{setup.credential_posture}</span></div>
          <div className="cn-cta-row"><Link className="cn-cta" href={deskHref}>Return to the work</Link></div>
        </div>
      </Shell>
    );
  }

  if (state === "error" || state === "failed") {
    return (
      <Shell employeeId={employeeId} note="Couldn't connect">
        <div className="cn-result">
          <p className="cn-kicker" style={{ color: "#e11d2a" }}>Couldn&rsquo;t connect</p>
          <h1>{setup.label} didn&rsquo;t connect<span className="p">.</span></h1>
          <p className="cn-sub">Nothing was sent and no business work was changed. The provider window may have been cancelled, expired, rejected, or returned without the expected signed state.</p>
          <div className="cn-cta-row">
            <Link className="cn-cta" href={retryHref}>Try again</Link>
            <Link className="cn-cta quiet" href={deskHref}>Return to the work</Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell employeeId={employeeId} note={`Connect ${setup.label.toLowerCase()}`}>
      <div className="cn-consent">
        <p className="cn-kicker">Connect an account</p>
        <h1>Let your employee use {setup.label.toLowerCase()}<span className="p">.</span></h1>
        <p className="cn-sub">This page is generated from the same connector contract used to select the Manager tool, requested scopes, and permitted provider authorization host.</p>

        <div className="cn-cols">
          <div className="cn-col">
            <span className="cn-col-tag ok">It can</span>
            <ul>{setup.can_do.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="cn-col">
            <span className="cn-col-tag no">It cannot</span>
            <ul className="no">{setup.cannot_do.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>

        <div className="cn-insurance"><strong>Credential posture</strong><span>{setup.credential_posture}</span></div>
        <div className="cn-insurance"><strong>Return guarantee</strong><span>After consent, the signed provider state returns you to this employee and the initiating work object. Arbitrary return URLs and unexpected provider hosts are rejected.</span></div>

        <div className="cn-cta-row">
          <Link className="cn-cta" href={startHref}>Connect {setup.label.toLowerCase()}</Link>
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
  .cn-body { max-width: 700px; margin: 0 auto; padding: 48px 24px; }
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
  .cn-insurance { display:grid; gap:5px; margin-top:12px; padding:13px 14px; border:1px solid rgba(10,10,10,.12); background:#f8f8f8; }
  .cn-insurance strong { font-family:var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size:9px; letter-spacing:.08em; text-transform:uppercase; }
  .cn-insurance span { font-size:12px; line-height:1.55; color:rgba(10,10,10,.68); }
  .cn-cta-row { display: flex; align-items: center; gap: 12px; margin-top: 24px; flex-wrap: wrap; }
  .cn-cta { background: #0a0a0a; color: #fff; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; text-decoration: none; padding: 0 24px; height: 48px; display: inline-flex; align-items: center; }
  .cn-cta:hover { background: #ff1a2b; }
  .cn-cta.quiet { background: #fff; color: #0a0a0a; border: 1px solid rgba(10,10,10,0.15); }
  .cn-cta.quiet:hover { border-color: #0a0a0a; }
`;

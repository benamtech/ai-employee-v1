import Link from "next/link";

export const metadata = {
  title: "AMTECH — An AI employee for your business",
  description: "Text it like a person. It writes your estimates, drafts the customer emails, preps the invoices — and asks you before anything leaves the business.",
};

/**
 * Hand-drawn pixel icons (12×12 grid → 36px SVG). "#" = ink, "*" = AMTECH red.
 * Inline SVG rects with crispEdges: no icon library, no anti-aliasing, scales
 * clean — the pixelated cousin of the sharp-corner system.
 */
const PIXEL_ICONS: Record<string, string[]> = {
  // An SMS bubble with three red dots — text it
  text: [
    "............",
    "............",
    ".#########..",
    ".#.......#..",
    ".#.*.*.*.#..",
    ".#.......#..",
    ".#########..",
    "...##.......",
    "...#........",
    "............",
    "............",
    "............",
  ],
  // A padlock with a red keyhole — work is held until the owner says yes
  gate: [
    "............",
    "....####....",
    "...#....#...",
    "...#....#...",
    "..########..",
    "..#......#..",
    "..#..**..#..",
    "..#..**..#..",
    "..#......#..",
    "..########..",
    "............",
    "............",
  ],
  // A receipt: lines, red paid stamp, zigzag tear
  proof: [
    "............",
    "..########..",
    "..#......#..",
    "..#.####.#..",
    "..#......#..",
    "..#.####.#..",
    "..#...**.#..",
    "..#...**.#..",
    "..#......#..",
    "..##.##.##..",
    "............",
    "............",
  ],
};

function PixelIcon({ name }: { name: keyof typeof PIXEL_ICONS }) {
  const map = PIXEL_ICONS[name];
  const cells: Array<{ x: number; y: number; red: boolean }> = [];
  map.forEach((row, y) => {
    row.split("").forEach((ch, x) => {
      if (ch === "#" || ch === "*") cells.push({ x, y, red: ch === "*" });
    });
  });
  return (
    <svg className="fd-ico" viewBox="0 0 12 12" width="36" height="36" aria-hidden shapeRendering="crispEdges">
      {cells.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width="1" height="1" fill={c.red ? "#e11d2a" : "#0a0a0a"} />
      ))}
    </svg>
  );
}

/**
 * Public front door. Black-on-white with AMTECH red accents; white-on-red for
 * the commitment band. Inter display, IBM Plex Mono operational labels. All
 * claims here describe shipped behavior: texting, prepared-then-held work,
 * approval gates, receipts.
 */
export default function Home() {
  return (
    <main className="fd-root">
      <style>{FRONT_DOOR_CSS}</style>

      <header className="fd-bar">
        <span className="fd-logo">AMTECH<span aria-hidden>.</span></span>
        <nav className="fd-nav">
          <Link href="/login">Sign in</Link>
          <Link className="fd-nav-cta" href="/create-ai-employee">Create your employee</Link>
        </nav>
      </header>

      <section className="fd-hero">
        <p className="fd-kicker">AMTECH AI — Early access</p>
        <h1>
          An AI employee for your business<span aria-hidden className="fd-period">.</span>
        </h1>
        <p className="fd-sub">
          Text it like a person. It writes your estimates, drafts the customer emails,
          preps the invoices — and asks you before anything leaves the business.
        </p>
        <div className="fd-cta-row">
          <Link className="fd-cta" href="/create-ai-employee">Create your AI employee</Link>
          <Link className="fd-cta-quiet" href="/login">Sign in</Link>
        </div>
      </section>

      <section className="fd-demo" aria-label="What working with it looks like">
        <p className="fd-tag" style={{ textAlign: "center" }}>What it looks like</p>
        <div className="fd-sms">
          <div className="fd-msg owner">jane wants the kitchen repainted, 2 coats — price it</div>
          <div className="fd-msg">
            Estimate ready: <strong>$4,200</strong>, line items attached. I staged the email to Jane.
            Want me to send it?
            <span className="fd-held">Held for your OK</span>
          </div>
          <div className="fd-msg owner">yes send it</div>
          <div className="fd-receipt">✓ Sent. Receipt saved — deposit invoice is ready when she says yes.</div>
        </div>
      </section>

      <section className="fd-grid" aria-label="How it works">
        <div>
          <PixelIcon name="text" />
          <span className="fd-tag">01 — Text it</span>
          <h2>Its own phone number</h2>
          <p>Send a job, a note, a customer request. Your employee turns it into real work: estimates, follow-ups, reminders.</p>
        </div>
        <div>
          <PixelIcon name="gate" />
          <span className="fd-tag">02 — It asks first</span>
          <h2>Nothing leaves without you</h2>
          <p>Emails, invoices, and payments are prepared and held. You get a preview and a yes/no. No surprises, no sends behind your back.</p>
        </div>
        <div>
          <PixelIcon name="proof" />
          <span className="fd-tag">03 — Proof after</span>
          <h2>Receipts for everything</h2>
          <p>Every sent email, every invoice, every payment leaves a receipt you can check on the web or straight from a text.</p>
        </div>
      </section>

      <section className="fd-band">
        <h2>Work handled. Never behind your back<span aria-hidden>.</span></h2>
        <p>Your employee prepares the work. You stay the boss of what leaves the business.</p>
        <Link className="fd-band-cta" href="/create-ai-employee">Create your AI employee</Link>
      </section>

      <footer className="fd-foot">
        <span className="fd-logo">AMTECH<span aria-hidden>.</span></span>
        <span>Early access — setup is guided, and your employee texts you when it is ready.</span>
      </footer>
    </main>
  );
}

const FRONT_DOOR_CSS = `
  .fd-root { min-height: 100vh; background: #ffffff; color: #0a0a0a; font-family: var(--font-inter), Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif; }
  .fd-logo { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 15px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; }
  .fd-logo span { color: #e11d2a; }
  .fd-bar { display: flex; align-items: center; justify-content: space-between; height: 60px; padding: 0 24px; border-bottom: 1px solid rgba(10,10,10,0.10); }
  .fd-nav { display: flex; align-items: center; gap: 18px; }
  .fd-nav a { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; text-decoration: none; color: #0a0a0a; }
  .fd-nav a:hover { color: #e11d2a; }
  .fd-nav-cta { border: 1px solid #e11d2a; color: #e11d2a !important; padding: 0 12px; line-height: 28px; height: 30px; display: inline-flex; align-items: center; }
  .fd-nav-cta:hover { background: #e11d2a; color: #ffffff !important; }
  .fd-hero { padding: 84px 24px; max-width: 900px; margin: 0 auto; }
  .fd-kicker { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: #e11d2a; margin: 0 0 18px; }
  .fd-hero h1 { font-size: clamp(3rem, 7vw, 4.5rem); font-weight: 900; letter-spacing: -0.03em; line-height: 1; margin: 0; }
  .fd-period { color: #e11d2a; }
  .fd-sub { font-size: clamp(1.1rem, 2.5vw, 1.5rem); font-weight: 600; line-height: 1.5; color: rgba(10,10,10,0.62); max-width: 660px; margin: 24px 0 0; }
  .fd-cta-row { display: flex; align-items: center; gap: 18px; margin-top: 36px; flex-wrap: wrap; }
  .fd-cta { background: #e11d2a; color: #ffffff; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; text-decoration: none; padding: 0 24px; height: 48px; display: inline-flex; align-items: center; }
  .fd-cta:hover { background: #ff1a2b; }
  .fd-cta-quiet { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: #0a0a0a; text-decoration: underline; text-underline-offset: 3px; }
  .fd-cta-quiet:hover { color: #e11d2a; }
  .fd-demo { border-top: 1px solid rgba(10,10,10,0.10); padding: 48px 24px; }
  .fd-demo .fd-tag { margin-bottom: 18px; }
  .fd-sms { max-width: 480px; margin: 0 auto; border: 1px solid rgba(10,10,10,0.10); padding: 18px; display: flex; flex-direction: column; gap: 9px; }
  .fd-msg { max-width: 84%; border: 1px solid rgba(10,10,10,0.10); border-left: 3px solid rgba(10,10,10,0.15); padding: 9px 12px; font-size: 15px; line-height: 1.5; }
  .fd-msg.owner { align-self: flex-end; background: #f4f4f4; border-left: 1px solid rgba(10,10,10,0.10); }
  .fd-held { display: block; width: max-content; margin-top: 6px; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: #e11d2a; border: 1px solid #e11d2a; padding: 0 6px; line-height: 16px; }
  .fd-receipt { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(10,10,10,0.62); padding-top: 6px; border-top: 1px solid rgba(10,10,10,0.05); }
  .fd-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1px; background: rgba(10,10,10,0.10); border-top: 1px solid rgba(10,10,10,0.10); border-bottom: 1px solid rgba(10,10,10,0.10); }
  .fd-grid > div { background: #ffffff; padding: 48px 24px; }
  .fd-ico { display: block; margin-bottom: 15px; }
  .fd-tag { display: block; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: #e11d2a; margin-bottom: 12px; }
  .fd-grid h2 { font-size: 18px; font-weight: 800; letter-spacing: -0.015em; margin: 0 0 9px; }
  .fd-grid p { font-size: 15px; line-height: 1.6; color: rgba(10,10,10,0.62); margin: 0; max-width: 480px; }
  .fd-band { background: #e11d2a; color: #ffffff; padding: 84px 24px; text-align: center; }
  .fd-band h2 { font-size: clamp(1.75rem, 3.5vw, 3rem); font-weight: 900; letter-spacing: -0.03em; line-height: 1.1; margin: 0; }
  .fd-band p { font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.85); margin: 12px auto 0; max-width: 480px; }
  .fd-band-cta { display: inline-flex; align-items: center; margin-top: 30px; border: 1px solid #ffffff; color: #ffffff; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; text-decoration: none; padding: 0 24px; height: 48px; }
  .fd-band-cta:hover { background: #ffffff; color: #e11d2a; }
  .fd-foot { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 18px 24px; border-top: 1px solid rgba(10,10,10,0.10); flex-wrap: wrap; }
  .fd-foot > span:last-child { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(10,10,10,0.62); }
  @media (max-width: 760px) {
    .fd-hero { padding: 48px 24px; }
    .fd-band { padding: 48px 24px; }
  }
`;

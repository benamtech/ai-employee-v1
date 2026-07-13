import Link from "next/link";

/**
 * Shared chrome for public pages (pricing, terms, privacy). AMTECH front-door
 * language: logotype bar, mono nav, hairline footer, ink-on-white with red
 * accents. Header/footer markup as components; PUBLIC_CSS carries the styles.
 */
export function PublicHeader() {
  return (
    <header className="pub-bar">
      <Link className="pub-logo" href="/">AMTECH<span aria-hidden>.</span></Link>
      <nav className="pub-nav">
        <Link href="/pricing">Pricing</Link>
        <Link href="/login">Sign in</Link>
        <Link className="pub-nav-cta" href="/create-ai-employee">Create your employee</Link>
      </nav>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="pub-foot">
      <Link className="pub-logo" href="/">AMTECH<span aria-hidden>.</span></Link>
      <nav className="pub-foot-nav">
        <Link href="/pricing">Pricing</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/login">Sign in</Link>
      </nav>
      <span className="pub-foot-note">Early access — setup is guided, and your employee texts you when it is ready.</span>
    </footer>
  );
}

export const PUBLIC_CSS = `
  .pub-root { min-height: 100vh; background: #ffffff; color: #0a0a0a; font-family: var(--font-inter), Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif; display: flex; flex-direction: column; }
  .pub-logo { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 15px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; text-decoration: none; color: #0a0a0a; }
  .pub-logo span { color: #e11d2a; }
  .pub-bar { display: flex; align-items: center; justify-content: space-between; height: 60px; padding: 0 24px; border-bottom: 1px solid rgba(10,10,10,0.10); }
  .pub-nav { display: flex; align-items: center; gap: 18px; }
  .pub-nav a { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; text-decoration: none; color: #0a0a0a; }
  .pub-nav a:hover { color: #e11d2a; }
  .pub-nav-cta { border: 1px solid #e11d2a; color: #e11d2a !important; padding: 0 12px; line-height: 28px; height: 30px; display: inline-flex; align-items: center; }
  .pub-nav-cta:hover { background: #e11d2a; color: #fff !important; }
  .pub-main { flex: 1; }

  .pub-hero { padding: 60px 24px 36px; max-width: 900px; margin: 0 auto; }
  .pub-kicker { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: #e11d2a; margin: 0 0 18px; }
  .pub-hero h1 { font-size: clamp(2.4rem, 6vw, 3.75rem); font-weight: 900; letter-spacing: -0.03em; line-height: 1.02; margin: 0; text-wrap: balance; }
  .pub-hero h1 .p { color: #e11d2a; }
  .pub-hero .sub { font-size: clamp(1.05rem, 2.2vw, 1.375rem); font-weight: 600; line-height: 1.5; color: rgba(10,10,10,0.62); max-width: 640px; margin: 24px 0 0; }

  /* pricing ladder */
  .tiers { display: grid; grid-template-columns: repeat(auto-fit, minmax(258px, 1fr)); gap: 1px; background: rgba(10,10,10,0.10); border-top: 1px solid rgba(10,10,10,0.10); border-bottom: 1px solid rgba(10,10,10,0.10); }
  .tier { background: #fff; padding: 30px 24px; display: flex; flex-direction: column; }
  .tier.feature { background: #0a0a0a; color: #fff; }
  .tier .rung { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: #e11d2a; margin-bottom: 12px; }
  .tier h2 { font-size: 18px; font-weight: 800; letter-spacing: -0.015em; margin: 0 0 6px; }
  .tier .price { font-size: 36px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin: 12px 0 3px; }
  .tier .price small { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(10,10,10,0.62); }
  .tier.feature .price small { color: rgba(255,255,255,0.62); }
  .tier p { font-size: 12px; line-height: 1.6; color: rgba(10,10,10,0.62); margin: 0 0 18px; }
  .tier.feature p { color: rgba(255,255,255,0.75); }
  .tier ul { list-style: none; margin: 0 0 18px; padding: 0; display: grid; gap: 9px; }
  .tier li { font-size: 12px; line-height: 1.5; padding-left: 18px; position: relative; }
  .tier li::before { content: "✓"; position: absolute; left: 0; color: #e11d2a; font-weight: 700; }
  .tier .foot-note { margin-top: auto; }

  /* prose (legal) */
  .prose { max-width: 720px; margin: 0 auto; padding: 48px 24px 60px; }
  .prose h1 { font-size: clamp(1.75rem, 4vw, 2.25rem); font-weight: 800; letter-spacing: -0.03em; margin: 0 0 6px; }
  .prose .updated { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(10,10,10,0.62); margin-bottom: 30px; }
  .prose h2 { font-size: 15px; font-weight: 700; letter-spacing: -0.015em; margin: 30px 0 9px; padding-top: 18px; border-top: 1px solid rgba(10,10,10,0.10); }
  .prose h2:first-of-type { border-top: 0; padding-top: 0; }
  .prose p { font-size: 15px; line-height: 1.7; color: rgba(10,10,10,0.82); margin: 0 0 12px; max-width: 62ch; }
  .prose .lede { font-size: 18px; font-weight: 500; color: #0a0a0a; }

  .pub-band { background: #e11d2a; color: #fff; padding: 60px 24px; text-align: center; }
  .pub-band h2 { font-size: clamp(1.75rem, 3.5vw, 2.75rem); font-weight: 900; letter-spacing: -0.03em; line-height: 1.1; margin: 0; }
  .pub-band p { font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.85); margin: 12px auto 0; max-width: 480px; }
  .pub-band-cta { display: inline-flex; align-items: center; margin-top: 30px; border: 1px solid #fff; color: #fff; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; text-decoration: none; padding: 0 24px; height: 48px; }
  .pub-band-cta:hover { background: #fff; color: #e11d2a; }

  .pub-foot { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding: 18px 24px; border-top: 1px solid rgba(10,10,10,0.10); }
  .pub-foot-nav { display: flex; gap: 15px; flex-wrap: wrap; }
  .pub-foot-nav a { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; text-decoration: none; color: rgba(10,10,10,0.62); }
  .pub-foot-nav a:hover { color: #e11d2a; }
  .pub-foot-note { margin-left: auto; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(10,10,10,0.62); }
  @media (max-width: 760px) {
    .pub-hero { padding: 36px 24px; }
    .pub-band { padding: 48px 24px; }
    .pub-foot-note { margin-left: 0; flex-basis: 100%; }
  }
`;

/**
 * Shared styles for the front-door flows (create, claim, login).
 * AMTECH language: ink on white, red accents, hairline-separated step sections,
 * mono operational labels, sharp corners, 3px spacing grid.
 */
export const FLOW_CSS = `
  .fl-root { min-height: 100vh; background: #f4f4f4; color: #0a0a0a; font-family: var(--font-inter), Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif; display: flex; flex-direction: column; align-items: center; }
  .fl-card { width: 100%; max-width: 720px; background: #ffffff; border: 1px solid rgba(10,10,10,0.10); margin: 48px 24px; }
  .fl-head { display: flex; align-items: center; justify-content: space-between; padding: 15px 24px; border-bottom: 1px solid rgba(10,10,10,0.10); }
  .fl-logo { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; text-decoration: none; color: #0a0a0a; }
  .fl-logo span { color: #e11d2a; }
  .fl-head-note { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(10,10,10,0.62); }
  .fl-title { padding: 24px 24px 18px; border-bottom: 1px solid rgba(10,10,10,0.10); }
  .fl-title h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15; margin: 0; }
  .fl-title p { font-size: 15px; line-height: 1.6; color: rgba(10,10,10,0.62); margin: 6px 0 0; max-width: 480px; }
  .fl-step { padding: 18px 24px; border-bottom: 1px solid rgba(10,10,10,0.10); }
  .fl-step:last-of-type { border-bottom: 0; }
  .fl-step-tag { display: block; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: #e11d2a; margin-bottom: 9px; }
  .fl-step h2 { font-size: 15px; font-weight: 700; letter-spacing: -0.015em; margin: 0 0 9px; }
  .fl-row { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 9px; }
  .fl-input { flex: 1 1 180px; min-width: 0; border: 1px solid rgba(10,10,10,0.15); background: #ffffff; padding: 0 12px; height: 42px; font-size: 15px; font-family: inherit; outline: none; }
  .fl-input:focus { border-color: #0a0a0a; }
  .fl-btn { border: 1px solid #0a0a0a; background: #0a0a0a; color: #ffffff; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; padding: 0 18px; height: 42px; display: inline-flex; align-items: center; cursor: pointer; }
  .fl-btn:hover { background: #ff1a2b; border-color: #ff1a2b; }
  .fl-btn.red { background: #e11d2a; border-color: #e11d2a; }
  .fl-btn.red:hover { background: #ff1a2b; border-color: #ff1a2b; }
  .fl-btn:disabled, .fl-btn.red:disabled { background: #ffffff; color: rgba(10,10,10,0.35); border-color: rgba(10,10,10,0.15); cursor: default; }
  .fl-btn.quiet { background: #ffffff; color: #0a0a0a; border-color: rgba(10,10,10,0.15); }
  .fl-btn.quiet:hover { border-color: #0a0a0a; background: #ffffff; }
  .fl-thread { border: 1px solid rgba(10,10,10,0.10); min-height: 180px; max-height: 300px; overflow: auto; padding: 12px; display: flex; flex-direction: column; gap: 9px; }
  .fl-msg { max-width: 84%; border: 1px solid rgba(10,10,10,0.10); padding: 9px 12px; font-size: 15px; line-height: 1.5; }
  .fl-msg.owner { align-self: flex-end; background: #f4f4f4; }
  .fl-msg .who { display: block; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(10,10,10,0.62); margin-bottom: 3px; }
  .fl-empty { color: rgba(10,10,10,0.62); font-size: 12px; align-self: center; margin: auto; }
  .fl-status { margin: 0; padding: 12px 24px 18px; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; line-height: 1.6; color: rgba(10,10,10,0.62); white-space: pre-wrap; word-break: break-word; border-top: 1px solid rgba(10,10,10,0.10); background: #f4f4f4; }
  .fl-status .lbl { display: block; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; margin: 6px 0; color: #0a0a0a; }
  .fl-kv { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; color: rgba(10,10,10,0.62); }
  .fl-kv strong { color: #0a0a0a; font-weight: 600; }
  @media (max-width: 760px) { .fl-card { margin: 0; border-left: 0; border-right: 0; } }
`;

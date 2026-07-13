"use client";

/**
 * Customer estimate portal (client). Mobile-first, trustworthy, one job: let the
 * homeowner read the estimate and put down a deposit. Rendered in the business's
 * voice with a quiet AMTECH footer. Interaction is local (fixture) — accept →
 * deposit → confirmation. The business, not AMTECH, is the brand here.
 */
import { useState } from "react";

const LINES = [
  { label: "Prep and protect — mask cabinets, floors, fixtures", amount: "$650" },
  { label: "Walls and trim, two coats — premium interior", amount: "$2,950" },
  { label: "Materials and cleanup", amount: "$600" },
];

export function EstimatePortalClient({ token }: { token: string }) {
  const [state, setState] = useState<"view" | "paid">(token.includes("paid") ? "paid" : "view");

  return (
    <main className="ep-root">
      <style>{CSS}</style>
      <div className="ep-sheet">
        <header className="ep-head">
          <div>
            <div className="ep-biz">Brightside Painting Co<span aria-hidden>.</span></div>
            <div className="ep-biz-sub">Residential painting · Scranton, PA</div>
          </div>
          <div className="ep-est">
            <div className="ep-est-word">Estimate</div>
            <div className="ep-est-meta">No. 2026-014</div>
          </div>
        </header>

        {state === "paid" ? (
          <div className="ep-paid">
            <div className="ep-paid-mark">✓ Deposit received</div>
            <h1>You&rsquo;re on the schedule.</h1>
            <p>Thanks, Jane. Your $1,260 deposit is in and the job is booked. Brightside will reach out to confirm a start date. A receipt is on its way to your email.</p>
            <div className="ep-receipt">Paid $1,260.00 · deposit toward $4,200.00</div>
          </div>
        ) : (
          <>
            <div className="ep-intro">
              <p className="ep-hi">Hi Jane —</p>
              <p>Here&rsquo;s the estimate for your kitchen repaint, walls and trim in two coats. Take a look, and if it works, a 30% deposit books your spot.</p>
            </div>

            <div className="ep-doc">
              <div className="ep-doc-head">The work</div>
              <table className="ep-table">
                <tbody>
                  {LINES.map((l) => (
                    <tr key={l.label}><td>{l.label}</td><td className="n">{l.amount}</td></tr>
                  ))}
                  <tr className="total"><td>Total</td><td className="n">$4,200</td></tr>
                </tbody>
              </table>
              <div className="ep-notes">
                <div><span className="ep-lbl">Assumptions</span>Ceiling not included · existing paint sound · furniture moved by you</div>
                <div className="ep-flag"><span className="ep-lbl">Please confirm</span>Trim color — priced as standard white semi-gloss</div>
              </div>
            </div>

            <div className="ep-deposit">
              <div className="ep-deposit-row"><span>Deposit to book (30%)</span><strong>$1,260.00</strong></div>
              <div className="ep-deposit-row muted"><span>Balance on completion</span><span>$2,940.00</span></div>
            </div>
          </>
        )}

        <footer className="ep-foot">
          <span>Prepared and sent by Brightside&rsquo;s assistant</span>
          <span className="ep-amtech">on AMTECH<span aria-hidden>.</span></span>
        </footer>
      </div>

      {state === "view" && (
        <div className="ep-bar">
          <button className="ep-btn primary" onClick={() => setState("paid")}>Accept &amp; pay $1,260 deposit</button>
          <button className="ep-btn quiet">Ask a question</button>
        </div>
      )}
    </main>
  );
}

const CSS = `
  .ep-root { min-height: 100dvh; background: #f4f4f4; color: #0a0a0a; font-family: var(--font-inter), Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif; display: flex; flex-direction: column; }
  .ep-sheet { flex: 1; width: 100%; max-width: 561px; margin: 0 auto; background: #fff; border-left: 1px solid rgba(10,10,10,0.10); border-right: 1px solid rgba(10,10,10,0.10); display: flex; flex-direction: column; }
  .ep-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 24px 24px 18px; border-bottom: 3px solid #0a0a0a; }
  .ep-biz { font-size: 21px; font-weight: 900; letter-spacing: -0.03em; }
  .ep-biz span, .ep-amtech span { color: #e11d2a; }
  .ep-biz-sub { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(10,10,10,0.62); margin-top: 3px; }
  .ep-est { text-align: right; }
  .ep-est-word { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: #e11d2a; }
  .ep-est-meta { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; letter-spacing: 0.03em; color: rgba(10,10,10,0.62); margin-top: 3px; }
  .ep-intro { padding: 18px 24px; }
  .ep-hi { font-weight: 700; margin: 0 0 6px; }
  .ep-intro p { font-size: 15px; line-height: 1.6; color: rgba(10,10,10,0.82); margin: 0; }
  .ep-doc { padding: 0 24px; }
  .ep-doc-head { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(10,10,10,0.62); padding: 12px 0 9px; }
  .ep-table { width: 100%; border-collapse: collapse; border: 1px solid rgba(10,10,10,0.10); }
  .ep-table td { padding: 9px 12px; border-bottom: 1px solid rgba(10,10,10,0.10); font-size: 15px; }
  .ep-table td.n { text-align: right; font-variant-numeric: tabular-nums; }
  .ep-table tr:last-child td { border-bottom: 0; }
  .ep-table tr.total td { font-weight: 800; font-size: 18px; letter-spacing: -0.015em; border-top: 3px solid #0a0a0a; }
  .ep-notes { display: grid; gap: 9px; padding: 18px 0; font-size: 12px; line-height: 1.6; color: rgba(10,10,10,0.82); }
  .ep-flag { border-left: 3px solid #e11d2a; padding-left: 9px; }
  .ep-lbl { display: block; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(10,10,10,0.62); margin-bottom: 3px; }
  .ep-deposit { margin: 0 24px 24px; border: 1px solid rgba(10,10,10,0.15); }
  .ep-deposit-row { display: flex; justify-content: space-between; align-items: baseline; padding: 12px 15px; font-size: 15px; }
  .ep-deposit-row strong { font-size: 24px; font-weight: 800; letter-spacing: -0.03em; }
  .ep-deposit-row.muted { border-top: 1px solid rgba(10,10,10,0.05); color: rgba(10,10,10,0.62); font-size: 12px; padding-top: 9px; padding-bottom: 12px; }
  .ep-paid { padding: 36px 24px; text-align: center; flex: 1; }
  .ep-paid-mark { font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: #0a0a0a; }
  .ep-paid h1 { font-size: 30px; font-weight: 800; letter-spacing: -0.03em; margin: 12px 0 0; }
  .ep-paid p { font-size: 15px; line-height: 1.6; color: rgba(10,10,10,0.62); max-width: 42ch; margin: 12px auto 0; }
  .ep-receipt { display: inline-block; margin-top: 24px; border: 1px solid rgba(10,10,10,0.15); padding: 9px 15px; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(10,10,10,0.62); }
  .ep-foot { margin-top: auto; display: flex; justify-content: space-between; gap: 12px; padding: 12px 24px; border-top: 1px solid rgba(10,10,10,0.10); font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(10,10,10,0.62); }
  .ep-bar { position: sticky; bottom: 0; width: 100%; max-width: 561px; margin: 0 auto; display: flex; flex-direction: column; gap: 9px; padding: 12px; background: #fff; border-top: 3px solid #e11d2a; border-left: 1px solid rgba(10,10,10,0.10); border-right: 1px solid rgba(10,10,10,0.10); }
  .ep-btn { height: 48px; display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; }
  .ep-btn.primary { background: #0a0a0a; color: #fff; border: 1px solid #0a0a0a; }
  .ep-btn.primary:hover { background: #ff1a2b; border-color: #ff1a2b; }
  .ep-btn.quiet { background: #fff; color: #0a0a0a; border: 1px solid rgba(10,10,10,0.15); }
  .ep-btn.quiet:hover { border-color: #0a0a0a; }
`;

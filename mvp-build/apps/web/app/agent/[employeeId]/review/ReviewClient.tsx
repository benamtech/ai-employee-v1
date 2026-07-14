"use client";

/**
 * Signed mobile review surface. The signed token is the credential; this page
 * renders one scoped work object and never exposes token, provider, storage, or
 * internal tool details.
 */
import { useState } from "react";
import type { WorkAction, WorkResource } from "@amtech/shared";
import { WorkObjectRenderer } from "../components/WorkObjectRenderer";

export function ReviewClient({
  employeeId,
  token,
  resource,
  error,
}: {
  employeeId: string;
  token: string;
  resource?: WorkResource;
  error?: "expired" | "denied" | "not_found" | "generic";
}) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "failed">("idle");
  const [outcome, setOutcome] = useState("");

  async function act(action: WorkAction["action"], note?: string) {
    if (action === "view") return;
    setStatus("working");
    try {
      const res = await fetch(`/api/employee/${employeeId}/preview/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signed_token: token, action, note }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("failed");
        setOutcome(json?.error === "already_actioned" ? "You already handled this." : "That did not go through. Try again in a moment.");
        return;
      }
      setStatus("done");
      setOutcome(action === "approve" ? "Approved. Avery is on it." : action === "reject" ? "Declined. Avery will not proceed." : "Sent to Avery.");
    } catch {
      setStatus("failed");
      setOutcome("That did not go through. Try again in a moment.");
    }
  }

  return (
    <main className="review-root">
      <style>{REVIEW_CSS}</style>
      <section className="review-shell">
        <header className="review-head">
          <span>AMTECH</span>
          <strong>Avery needs your say</strong>
        </header>
        {error || !resource ? (
          <div className="review-state">
            <p>{error === "expired" ? "Expired" : "Unavailable"}</p>
            <h1>{error === "expired" ? "This link has expired" : error === "not_found" ? "Nothing to show here" : "This link cannot be opened"}</h1>
            <span>
              {error === "expired"
                ? "For security, review links do not last forever. Text Avery and it can send a fresh one."
                : "Text Avery and it can resend the work object."}
            </span>
          </div>
        ) : (
          <div className="review-object">
            <WorkObjectRenderer resource={resource} onAction={act} />
            {status === "done" ? <div className="review-outcome done">{outcome}</div> : null}
            {status === "failed" ? <div className="review-outcome failed">{outcome}</div> : null}
          </div>
        )}
      </section>
    </main>
  );
}

const REVIEW_CSS = `
  .review-root {
    min-height: 100dvh;
    background:
      radial-gradient(circle at 50% -18%, rgba(220,239,244,.9), transparent 24rem),
      linear-gradient(180deg, #fffaf0 0%, #ebe9e1 100%);
    color: #111717;
    font-family: var(--font-inter), Inter, -apple-system, "Helvetica Neue", Arial, sans-serif;
  }
  .review-shell {
    width: min(100%, 600px);
    min-height: 100dvh;
    margin: 0 auto;
    background: rgba(255,255,255,.78);
    border-left: 1px solid rgba(62,76,72,.14);
    border-right: 1px solid rgba(62,76,72,.14);
    box-shadow: 0 24px 70px rgba(43,52,48,.14);
    display: grid;
    grid-template-rows: auto 1fr;
  }
  .review-head {
    min-height: 58px;
    padding: 0 16px;
    border-bottom: 1px solid rgba(62,76,72,.14);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 11px;
    font-weight: 780;
    text-transform: uppercase;
    backdrop-filter: blur(16px);
  }
  .review-head span { color: #9f1f2b; }
  .review-head strong { color: #687777; font-size: 11px; }
  .review-object { padding: 16px; display: grid; gap: 12px; align-content: start; }
  .review-state { padding: 42px 18px; text-align: center; display: grid; gap: 10px; align-content: center; }
  .review-state p {
    margin: 0;
    font-size: 11px;
    font-weight: 780;
    text-transform: uppercase;
    color: #b4323a;
  }
  .review-state h1 { margin: 0; font-size: 28px; line-height: 1.1; }
  .review-state span { color: #687777; line-height: 1.5; }
  .review-outcome {
    position: sticky;
    bottom: 0;
    border: 1px solid rgba(62,76,72,.14);
    background: rgba(255,255,255,.92);
    border-radius: 16px;
    padding: 12px;
    text-align: center;
    font-size: 12px;
    font-weight: 780;
    text-transform: uppercase;
  }
  .review-outcome.done { color: #23734d; }
  .review-outcome.failed { color: #b4323a; }
`;

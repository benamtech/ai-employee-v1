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
    if (action === "view" || status === "working") return;
    setStatus("working");
    setOutcome("Submitting this action against the current signed scope.");
    try {
      const response = await fetch(`/api/employee/${employeeId}/preview/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signed_token: token, action, note }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus("failed");
        setOutcome(json?.error === "already_actioned"
          ? "This review was already handled. Ask your employee for a fresh work object if something changed."
          : "AMTECH could not prove that the action was accepted. Nothing will be shown as complete; try again or ask for a fresh link.");
        return;
      }
      setStatus("done");
      setOutcome(action === "approve"
        ? "Approved. Your employee can continue only within this decision gate."
        : action === "reject"
          ? "Declined. Your employee will not perform the held action."
          : "Your response was accepted and sent to your employee.");
    } catch {
      setStatus("failed");
      setOutcome("The connection ended before acceptance could be proved. Do not assume the action completed; retry or request a fresh link.");
    }
  }

  return (
    <main className="review-root" aria-busy={status === "working"}>
      <style>{REVIEW_CSS}</style>
      <section className="review-shell">
        <header className="review-head">
          <div>
            <span>AMTECH<span aria-hidden>.</span></span>
            <strong>Secure Review</strong>
          </div>
          <p>{resource?.resource_type === "approval" ? "A decision is held for you" : "One scoped work object"}</p>
        </header>

        {error || !resource ? (
          <div className="review-state">
            <p>{error === "expired" ? "Expired" : "Unavailable"}</p>
            <h1>{error === "expired" ? "This link has expired" : error === "not_found" ? "Nothing to show here" : "This link cannot be opened"}</h1>
            <span>
              {error === "expired"
                ? "Review links expire and can also be revoked. Text your employee for a fresh link."
                : "AMTECH failed closed rather than showing work from another employee or assignment. Text your employee to resend it."}
            </span>
          </div>
        ) : (
          <div className="review-object">
            <WorkObjectRenderer resource={resource} onAction={act} />
            {status !== "idle" ? <div className={`review-outcome ${status}`} role={status === "failed" ? "alert" : "status"}>{outcome}</div> : null}
          </div>
        )}
      </section>
    </main>
  );
}

const REVIEW_CSS = `
  .review-root{min-height:100dvh;padding:0 12px;background:radial-gradient(circle at 50% -12%,rgba(223,246,255,.95),transparent 28rem),radial-gradient(circle at 90% 12%,rgba(225,29,42,.06),transparent 22rem),var(--amtech-canvas);color:var(--amtech-ink);font-family:var(--amtech-font)}
  .review-shell{width:min(100%,640px);min-height:100dvh;margin:0 auto;background:rgba(255,255,255,.84);border-left:1px solid var(--amtech-line);border-right:1px solid var(--amtech-line);box-shadow:var(--amtech-shadow-float);backdrop-filter:blur(30px);display:grid;grid-template-rows:auto 1fr}
  .review-head{min-height:72px;padding:12px 20px;border-bottom:1px solid var(--amtech-line);display:flex;align-items:center;justify-content:space-between;gap:16px;background:rgba(255,255,255,.78);backdrop-filter:blur(28px)}.review-head>div{display:grid;gap:2px}.review-head span{font-weight:850;letter-spacing:.04em}.review-head span span{color:var(--amtech-red)}.review-head strong{font-size:12px;color:var(--amtech-muted)}.review-head p{max-width:210px;text-align:right;font-size:12px;color:var(--amtech-muted)}
  .review-object{padding:20px;display:grid;gap:14px;align-content:start}.review-state{padding:48px 24px;text-align:center;display:grid;gap:12px;align-content:center}.review-state p{font-size:11px;font-weight:780;letter-spacing:.12em;text-transform:uppercase;color:var(--amtech-red)}.review-state h1{font-size:clamp(28px,8vw,40px);line-height:1.05;letter-spacing:-.035em}.review-state span{max-width:480px;margin:0 auto;color:var(--amtech-muted);line-height:1.55}
  .review-outcome{position:sticky;bottom:12px;padding:13px 15px;border:1px solid var(--amtech-line);border-radius:16px;background:rgba(255,255,255,.94);box-shadow:var(--amtech-shadow-card);text-align:center;font-size:13px;font-weight:750;backdrop-filter:blur(24px)}.review-outcome.working{border-color:rgba(37,99,235,.2);color:var(--amtech-blue)}.review-outcome.done{border-color:rgba(22,138,87,.2);background:var(--amtech-green-soft);color:var(--amtech-green)}.review-outcome.failed{border-color:rgba(225,29,42,.22);background:var(--amtech-danger-soft);color:var(--amtech-red)}
  @media(max-width:640px){.review-root{padding:0}.review-shell{border:0;box-shadow:none}.review-head{align-items:flex-start}.review-object{padding:16px}.review-head p{max-width:150px}}
`;

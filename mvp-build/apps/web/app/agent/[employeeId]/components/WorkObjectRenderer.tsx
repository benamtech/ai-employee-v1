"use client";

import { useState } from "react";
import type { WorkAction, WorkResource } from "@amtech/shared";

export type WorkObjectActionHandler = (action: WorkAction["action"], note?: string) => Promise<void> | void;

export function WorkObjectRenderer({
  resource,
  onAction,
  compact = false,
}: {
  resource: WorkResource;
  onAction?: WorkObjectActionHandler;
  compact?: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const [note, setNote] = useState("");
  const [workingAction, setWorkingAction] = useState<string | null>(null);

  async function handleAction(action: WorkAction) {
    if (action.action === "view") return;
    if (!onAction) return;
    if (action.action === "respond" || action.action === "edit") {
      setReplying(true);
      return;
    }
    setWorkingAction(action.action);
    try {
      await onAction(action.action);
    } finally {
      setWorkingAction(null);
    }
  }

  async function submitNote() {
    const trimmed = note.trim();
    if (!trimmed || !onAction) return;
    setWorkingAction("respond");
    try {
      await onAction("respond", trimmed);
      setNote("");
      setReplying(false);
    } finally {
      setWorkingAction(null);
    }
  }

  const gated = resource.actions.some((action) => action.gated);

  return (
    <article className={compact ? "wo-root compact" : "wo-root"}>
      <style>{WORK_OBJECT_CSS}</style>
      <header className="wo-head">
        <div>
          <p className="wo-eyebrow">{resource.subtitle ?? labelResourceType(resource.resource_type)}</p>
          <h2>{resource.title}</h2>
          {resource.summary ? <p className="wo-summary">{resource.summary}</p> : null}
        </div>
        <div className="wo-meta">
          {resource.risk ? <span className={`wo-risk ${resource.risk}`}>{riskLabel(resource.risk)}</span> : null}
          {resource.amount ? <strong>{resource.amount}</strong> : null}
          {resource.recipient ? <span>To {resource.recipient}</span> : null}
        </div>
      </header>

      {resource.fields?.length ? (
        <dl className="wo-fields">
          {resource.fields.map((field) => (
            <div key={`${field.label}:${field.value}`}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {resource.body_html ? (
        <iframe
          title={`${resource.title} preview`}
          sandbox=""
          srcDoc={resource.body_html}
          className="wo-frame"
        />
      ) : null}

      {resource.body_kind === "media" && resource.media?.url ? (
        <figure className="wo-media">
          {resource.media.kind === "video" ? (
            <video src={resource.media.url} controls />
          ) : (
            <img src={resource.media.url} alt={resource.media.caption ?? resource.title} />
          )}
          {resource.media.caption ? <figcaption>{resource.media.caption}</figcaption> : null}
        </figure>
      ) : null}

      {resource.receipts?.length ? (
        <section className="wo-receipts" aria-label="Proof and receipts">
          <p>Proof</p>
          {resource.receipts.map((receipt) => (
            isHref(receipt.value) ? (
              <a key={`${receipt.label}:${receipt.value}`} href={receipt.value} target="_blank" rel="noreferrer">
                <span>{receipt.label}</span>
                <strong>Open</strong>
              </a>
            ) : (
              <div key={`${receipt.label}:${receipt.value}`}>
                <span>{receipt.label}</span>
                <strong>{receipt.value}</strong>
              </div>
            )
          ))}
        </section>
      ) : null}

      {gated && !resource.expired ? (
        <div className="wo-consequence">
          <strong>Held for your decision</strong>
          <span>Nothing customer-facing, financial, or high-impact proceeds until an authorized owner action is accepted.</span>
        </div>
      ) : null}

      {resource.expired ? (
        <div className="wo-expired">This work item is already handled or no longer authorized. No action is waiting on this object.</div>
      ) : null}

      {!resource.expired && resource.actions.length ? (
        <footer className={gated ? "wo-actions gated" : "wo-actions"}>
          {replying ? (
            <div className="wo-reply">
              <label htmlFor={`wo-note-${resource.resource_id}`}>Tell your employee what to change, answer, or check</label>
              <textarea
                id={`wo-note-${resource.resource_id}`}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                autoFocus
                placeholder="Add the missing detail or revision."
              />
              <div>
                <button type="button" className="wo-button" onClick={() => setReplying(false)}>Cancel</button>
                <button type="button" className="wo-button primary" disabled={!note.trim() || workingAction === "respond" || !onAction} onClick={() => void submitNote()}>
                  {workingAction === "respond" ? "Sending…" : "Send revision"}
                </button>
              </div>
            </div>
          ) : (
            resource.actions.map((action) => (
              action.action === "view" && resource.open_url ? (
                <a key={action.action} className={buttonClass(action)} href={resource.open_url} target="_blank" rel="noreferrer">
                  {action.label}
                </a>
              ) : (
                <button
                  key={action.action}
                  type="button"
                  className={buttonClass(action)}
                  disabled={!onAction || Boolean(workingAction)}
                  onClick={() => void handleAction(action)}
                >
                  {workingAction === action.action ? "Working…" : action.label}
                </button>
              )
            ))
          )}
        </footer>
      ) : null}
    </article>
  );
}

function buttonClass(action: WorkAction): string {
  const style = action.style === "primary" ? "primary" : action.style === "danger" ? "danger" : "";
  return `wo-button ${style}`.trim();
}

function labelResourceType(type: WorkResource["resource_type"]): string {
  return type.replace(/_/g, " ");
}

function riskLabel(risk: NonNullable<WorkResource["risk"]>): string {
  if (risk === "high") return "High impact";
  if (risk === "medium") return "Needs your say";
  return "Low risk";
}

function isHref(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/") || value.startsWith("#");
}

const WORK_OBJECT_CSS = `
  .wo-root{display:grid;gap:16px;color:var(--amtech-ink);font-family:var(--amtech-font)}
  .wo-root.compact{gap:12px}.wo-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:start}.wo-eyebrow,.wo-receipts>p{margin:0 0 6px;font-size:11px;line-height:1.2;text-transform:uppercase;letter-spacing:.11em;font-weight:750;color:var(--amtech-muted)}
  .wo-head h2{margin:0;font-size:clamp(20px,3vw,28px);line-height:1.08;letter-spacing:-.025em;font-weight:840}.wo-root.compact .wo-head h2{font-size:19px}.wo-summary{margin:8px 0 0;color:var(--amtech-muted);font-size:14px;line-height:1.55;max-width:68ch}
  .wo-meta{display:grid;gap:6px;justify-items:end;min-width:110px}.wo-meta strong{font-size:24px;line-height:1;font-weight:820;white-space:nowrap}.wo-meta>span:not(.wo-risk){color:var(--amtech-muted);font-size:12px;text-align:right}.wo-risk{padding:5px 10px;border:1px solid var(--amtech-line-strong);border-radius:999px;font-size:11px;font-weight:750}.wo-risk.medium{border-color:rgba(37,99,235,.25);background:var(--amtech-blue-soft);color:var(--amtech-blue)}.wo-risk.high{border-color:rgba(225,29,42,.25);background:var(--amtech-danger-soft);color:var(--amtech-red)}.wo-risk.low{border-color:rgba(22,138,87,.2);background:var(--amtech-green-soft);color:var(--amtech-green)}
  .wo-fields,.wo-receipts{margin:0;border:1px solid var(--amtech-line);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.76)}.wo-fields div,.wo-receipts a,.wo-receipts div{display:grid;grid-template-columns:minmax(110px,.42fr) minmax(0,1fr);gap:12px;padding:11px 13px;border-top:1px solid var(--amtech-line);align-items:baseline}.wo-fields div:first-child,.wo-receipts a:first-of-type,.wo-receipts div:first-of-type{border-top:0}.wo-fields dt,.wo-receipts span{margin:0;color:var(--amtech-muted);font-size:11px;font-weight:720;text-transform:uppercase;letter-spacing:.04em}.wo-fields dd,.wo-receipts strong{margin:0;font-weight:680;text-align:right;overflow-wrap:anywhere}
  .wo-frame{width:100%;min-height:420px;border:1px solid var(--amtech-line);border-radius:16px;background:#fff}.wo-media{margin:0;border:1px solid var(--amtech-line);border-radius:16px;overflow:hidden;background:var(--amtech-canvas)}.wo-media img,.wo-media video{width:100%;display:block}.wo-media figcaption{padding:10px 13px;color:var(--amtech-muted);font-size:12px;border-top:1px solid var(--amtech-line)}
  .wo-receipts{border-color:rgba(22,138,87,.18);background:var(--amtech-green-soft)}.wo-receipts>p{padding:11px 13px;margin:0;border-bottom:1px solid var(--amtech-line);color:var(--amtech-green)}.wo-receipts a{color:inherit;text-decoration:none}.wo-receipts a:hover strong{color:var(--amtech-green)}
  .wo-consequence{padding:12px 14px;display:grid;gap:4px;border:1px solid rgba(37,99,235,.2);border-radius:14px;background:var(--amtech-blue-soft);color:var(--amtech-blue)}.wo-consequence strong{font-size:13px}.wo-consequence span{font-size:12px;line-height:1.45}.wo-expired{padding:12px 14px;border:1px solid var(--amtech-line);border-radius:14px;background:rgba(255,255,255,.58);color:var(--amtech-muted);font-size:13px}
  .wo-actions{display:flex;gap:8px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--amtech-line)}.wo-actions.gated{border-top-color:rgba(225,29,42,.18)}.wo-button{min-height:44px;padding:0 17px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--amtech-line-strong);border-radius:999px;background:#fff;color:var(--amtech-ink);text-decoration:none;font-weight:760}.wo-button.primary{background:var(--amtech-red);border-color:var(--amtech-red);color:#fff}.wo-button.danger{border-color:rgba(225,29,42,.34);background:#fff;color:var(--amtech-red)}.wo-button:hover:not(:disabled){transform:translateY(-1px)}.wo-button:disabled{opacity:.45;cursor:not-allowed}
  .wo-reply{width:100%;display:grid;gap:8px}.wo-reply label{font-size:13px;font-weight:750}.wo-reply textarea{width:100%;min-height:96px;padding:12px 14px;resize:vertical;border:1px solid var(--amtech-line-strong);border-radius:14px;background:#fff;outline:none}.wo-reply textarea:focus{border-color:var(--amtech-blue);box-shadow:0 0 0 4px var(--amtech-blue-soft)}.wo-reply div{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
  @media(max-width:640px){.wo-head{grid-template-columns:1fr}.wo-meta{justify-items:start}.wo-fields div,.wo-receipts a,.wo-receipts div{grid-template-columns:1fr}.wo-fields dd,.wo-receipts strong{text-align:left}.wo-actions .wo-button{flex:1 1 140px}}
`;

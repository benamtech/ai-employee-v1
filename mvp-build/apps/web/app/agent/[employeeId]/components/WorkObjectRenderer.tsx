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
    if (action.action === "respond" || action.action === "edit") {
      setReplying(true);
      return;
    }
    setWorkingAction(action.action);
    try {
      await onAction?.(action.action);
    } finally {
      setWorkingAction(null);
    }
  }

  async function submitNote() {
    const trimmed = note.trim();
    if (!trimmed) return;
    setWorkingAction("respond");
    try {
      await onAction?.("respond", trimmed);
      setNote("");
      setReplying(false);
    } finally {
      setWorkingAction(null);
    }
  }

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

      {resource.expired ? (
        <div className="wo-expired">This work item is already handled. Nothing else is waiting on this link.</div>
      ) : null}

      {!resource.expired && resource.actions.length ? (
        <footer className={resource.actions.some((action) => action.gated) ? "wo-actions gated" : "wo-actions"}>
          {replying ? (
            <div className="wo-reply">
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                autoFocus
                placeholder="Tell Avery what to change, answer, or check..."
              />
              <div>
                <button type="button" className="wo-button" onClick={() => setReplying(false)}>Cancel</button>
                <button type="button" className="wo-button primary" disabled={!note.trim() || workingAction === "respond"} onClick={() => void submitNote()}>
                  Send to Avery
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
                  disabled={Boolean(workingAction)}
                  onClick={() => void handleAction(action)}
                >
                  {workingAction === action.action ? "Working..." : action.label}
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
  if (risk === "high") return "Money or high impact";
  if (risk === "medium") return "Needs your say";
  return "Low risk";
}

function isHref(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/") || value.startsWith("#");
}

const WORK_OBJECT_CSS = `
  .wo-root {
    --wo-ink: #111717;
    --wo-paper: #fffdf8;
    --wo-wash: #f4f1e9;
    --wo-line: rgba(62,76,72,.18);
    --wo-muted: #687777;
    --wo-blue: #276b82;
    --wo-blue-soft: #dceff4;
    --wo-green: #23734d;
    --wo-green-soft: #e4f3e9;
    --wo-amber: #a86a12;
    --wo-amber-soft: #fff2cf;
    --wo-danger: #b4323a;
    --wo-danger-soft: #ffe5e8;
    --wo-font: var(--font-inter), Inter, -apple-system, "Helvetica Neue", Arial, sans-serif;
    display: grid;
    gap: 15px;
    color: var(--wo-ink);
    background: transparent;
    font-family: var(--wo-font);
  }
  .wo-root.compact { gap: 10px; }
  .wo-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px; align-items: start; }
  .wo-eyebrow, .wo-receipts > p {
    margin: 0 0 5px;
    font-size: 11px;
    line-height: 1.2;
    text-transform: uppercase;
    font-weight: 760;
    color: var(--wo-muted);
  }
  .wo-head h2 { margin: 0; font-size: 25px; line-height: 1.08; letter-spacing: 0; font-weight: 840; }
  .wo-root.compact .wo-head h2 { font-size: 18px; }
  .wo-summary { margin: 8px 0 0; color: var(--wo-muted); font-size: 14px; line-height: 1.55; max-width: 68ch; }
  .wo-meta { display: grid; gap: 4px; justify-items: end; min-width: 94px; }
  .wo-meta strong { font-size: 24px; line-height: 1; font-weight: 800; white-space: nowrap; }
  .wo-meta span { color: var(--wo-muted); font-size: 12px; text-align: right; }
  .wo-risk {
    border: 1px solid var(--wo-line);
    padding: 5px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 760;
    text-transform: uppercase;
  }
  .wo-risk.medium { border-color: rgba(160,90,0,.28); background: var(--wo-amber-soft); color: var(--wo-amber); }
  .wo-risk.high { background: var(--wo-danger-soft); border-color: rgba(181,29,42,.3); color: var(--wo-danger); }
  .wo-fields { border: 1px solid var(--wo-line); margin: 0; border-radius: 16px; overflow: hidden; background: rgba(255,255,255,.62); }
  .wo-fields div, .wo-receipts a, .wo-receipts div {
    display: grid;
    grid-template-columns: minmax(110px, 0.42fr) minmax(0, 1fr);
    gap: 12px;
    padding: 10px 12px;
    border-top: 1px solid var(--wo-line);
    align-items: baseline;
  }
  .wo-fields div:first-child, .wo-receipts a:first-of-type, .wo-receipts div:first-of-type { border-top: 0; }
  .wo-fields dt, .wo-receipts span {
    margin: 0;
    color: var(--wo-muted);
    font-size: 11px;
    font-weight: 760;
    text-transform: uppercase;
  }
  .wo-fields dd, .wo-receipts strong { margin: 0; font-weight: 650; text-align: right; overflow-wrap: anywhere; }
  .wo-frame { width: 100%; min-height: 420px; border: 1px solid var(--wo-line); background: #ffffff; border-radius: 16px; box-shadow: inset 0 1px 0 rgba(255,255,255,.9); }
  .wo-media { margin: 0; border: 1px solid var(--wo-line); background: var(--wo-wash); border-radius: 16px; overflow: hidden; }
  .wo-media img, .wo-media video { width: 100%; display: block; }
  .wo-media figcaption { padding: 9px 12px; color: var(--wo-muted); font-size: 12px; border-top: 1px solid var(--wo-line); }
  .wo-receipts { border: 1px solid rgba(35,115,77,.18); background: rgba(228,243,233,.48); border-radius: 16px; overflow: hidden; }
  .wo-receipts > p { padding: 10px 12px; margin: 0; border-bottom: 1px solid var(--wo-line); color: var(--wo-green); }
  .wo-receipts a { color: inherit; text-decoration: none; }
  .wo-receipts a:hover strong { color: var(--wo-green); }
  .wo-expired { border: 1px solid var(--wo-line); border-radius: 14px; background: rgba(255,255,255,.54); padding: 12px; color: var(--wo-muted); font-size: 13px; }
  .wo-actions { display: flex; gap: 8px; flex-wrap: wrap; border-top: 1px solid var(--wo-line); padding-top: 12px; }
  .wo-actions.gated { border-top-color: rgba(168,106,18,.28); }
  .wo-button {
    min-height: 44px;
    border: 1px solid var(--wo-line);
    background: rgba(255,255,255,.78);
    color: var(--wo-ink);
    padding: 0 16px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    cursor: pointer;
    font: 760 14px/1 var(--wo-font);
  }
  .wo-button.primary { background: linear-gradient(180deg, #2d7991, #1f5f75); border-color: transparent; color: #ffffff; box-shadow: 0 12px 24px rgba(31,95,117,.22), inset 0 1px 0 rgba(255,255,255,.32); }
  .wo-button.primary:hover { filter: brightness(.96); }
  .wo-button.danger { border-color: rgba(181,29,42,.35); background: var(--wo-danger-soft); color: var(--wo-danger); }
  .wo-button:disabled { cursor: not-allowed; color: var(--wo-muted); background: var(--wo-wash); }
  .wo-reply { width: 100%; display: grid; gap: 8px; }
  .wo-reply textarea { width: 100%; min-height: 92px; border: 1px solid var(--wo-line); border-radius: 14px; padding: 12px; resize: vertical; font: 500 15px/1.45 var(--wo-font); }
  .wo-reply div { display: flex; justify-content: flex-end; gap: 8px; }
  @media (max-width: 640px) {
    .wo-head { grid-template-columns: 1fr; }
    .wo-meta { justify-items: start; }
    .wo-fields div, .wo-receipts a, .wo-receipts div { grid-template-columns: 1fr; gap: 4px; }
    .wo-fields dd, .wo-receipts strong { text-align: left; }
    .wo-button { flex: 1 1 42%; min-height: 48px; }
    .wo-frame { min-height: 360px; }
  }
`;

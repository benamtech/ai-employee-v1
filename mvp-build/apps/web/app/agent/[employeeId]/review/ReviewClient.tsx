"use client";

/**
 * Signed mobile review surface (Phase 3). Renders one `WorkResource` — the same
 * owner-safe state the web desk shows — with a mobile-first sticky action bar.
 * The signed token is the only credential; actions POST to the preview-action
 * proxy. No owner login, no raw provider payloads, no developer vocabulary.
 */
import { useState } from "react";
import type { WorkResource, WorkAction } from "@amtech/shared";
import { tokens } from "../surface.tokens";

const riskLabel: Record<string, string> = { low: "Low risk", medium: "Please review", high: "High impact" };
const riskColor: Record<string, string> = { low: tokens.color.textMuted, medium: tokens.color.warning, high: tokens.color.danger };

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
  const [outcome, setOutcome] = useState<string>("");
  const [replying, setReplying] = useState(false);
  const [note, setNote] = useState("");

  if (error || !resource) {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: `${tokens.space.xxl}px ${tokens.space.lg}px`, color: tokens.color.textMuted }}>
          <div style={{ fontSize: 32, marginBottom: tokens.space.md }} aria-hidden>·</div>
          <h1 style={{ fontSize: tokens.font.h2, color: tokens.color.text, margin: 0 }}>
            {error === "expired" ? "This link has expired" : error === "not_found" ? "Nothing to show here" : "This link can’t be opened"}
          </h1>
          <p style={{ maxWidth: 320, margin: `${tokens.space.md}px auto 0`, lineHeight: 1.5 }}>
            {error === "expired"
              ? "For your security these links don’t last forever. Text your employee and it will send a fresh one."
              : "Text your employee and it can resend this to you."}
          </p>
        </div>
      </Shell>
    );
  }

  const done = status === "done";
  const isTerminal = (a: WorkAction["action"]) => a === "approve" || a === "reject" || a === "acknowledge";

  async function act(action: WorkAction["action"]) {
    if (action === "respond" || action === "edit") {
      setReplying(true);
      return;
    }
    if (action === "view") return; // handled by anchor
    setStatus("working");
    try {
      const res = await fetch(`/api/employee/${employeeId}/preview/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signed_token: token, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("failed");
        setOutcome(json?.error === "already_actioned" ? "You already handled this." : "That didn’t go through. Try again in a moment.");
        return;
      }
      setStatus("done");
      setOutcome(
        action === "approve" ? "Approved — your employee is on it." :
          action === "reject" ? "Declined. Your employee won’t proceed." :
            "Got it.",
      );
    } catch {
      setStatus("failed");
      setOutcome("That didn’t go through. Try again in a moment.");
    }
  }

  async function submitReply() {
    if (!note.trim()) return;
    setStatus("working");
    try {
      const res = await fetch(`/api/employee/${employeeId}/preview/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signed_token: token, action: "respond", note }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
      setReplying(false);
      setOutcome("Sent to your employee.");
    } catch {
      setStatus("failed");
      setOutcome("That didn’t send. Try again in a moment.");
    }
  }

  return (
    <Shell>
      <div style={{ padding: tokens.space.lg }}>
        {resource.risk && (
          <span style={{ display: "inline-block", fontSize: tokens.font.tiny, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: riskColor[resource.risk], marginBottom: tokens.space.sm }}>
            {riskLabel[resource.risk] ?? resource.risk}
          </span>
        )}
        <h1 style={{ fontSize: tokens.font.h1, color: tokens.color.text, margin: `0 0 ${tokens.space.xs}px` }}>{resource.title}</h1>
        {resource.subtitle && <div style={{ color: tokens.color.textMuted, fontSize: tokens.font.small }}>{resource.subtitle}</div>}
        {resource.amount && <div style={{ fontSize: tokens.font.h1, fontWeight: 700, color: tokens.color.text, marginTop: tokens.space.md }}>{resource.amount}</div>}
        {resource.recipient && <div style={{ color: tokens.color.textMuted, fontSize: tokens.font.small, marginTop: tokens.space.xs }}>To: {resource.recipient}</div>}
        {resource.summary && <p style={{ color: tokens.color.text, lineHeight: 1.55, marginTop: tokens.space.md }}>{resource.summary}</p>}

        {resource.fields && resource.fields.length > 0 && (
          <div style={{ marginTop: tokens.space.lg, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, overflow: "hidden" }}>
            {resource.fields.map((f, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: tokens.space.md, padding: `${tokens.space.sm}px ${tokens.space.md}px`, borderTop: i ? `1px solid ${tokens.color.border}` : "none", fontSize: tokens.font.small }}>
                <span style={{ color: tokens.color.textMuted }}>{f.label}</span>
                <span style={{ color: tokens.color.text, textAlign: "right" }}>{f.value}</span>
              </div>
            ))}
          </div>
        )}

        {resource.body_kind === "media" && resource.media?.url && (
          <div style={{ marginTop: tokens.space.lg }}>
            {resource.media.kind === "video"
              ? <video src={resource.media.url} controls style={{ width: "100%", borderRadius: tokens.radius.md }} />
              : <img src={resource.media.url} alt={resource.media.caption ?? resource.title} style={{ width: "100%", borderRadius: tokens.radius.md }} />}
          </div>
        )}

        {resource.body_html && (
          <iframe
            title="Document preview"
            sandbox=""
            srcDoc={resource.body_html}
            style={{ width: "100%", height: 420, marginTop: tokens.space.lg, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, background: "#fff" }}
          />
        )}

        {resource.receipts && resource.receipts.map((r, i) => (
          <a key={i} href={r.value} style={{ display: "inline-block", marginTop: tokens.space.md, color: tokens.color.accent, fontSize: tokens.font.small, textDecoration: "none", fontWeight: 600 }}>
            {r.label} →
          </a>
        ))}

        {resource.expired && (
          <div style={{ marginTop: tokens.space.lg, padding: tokens.space.md, background: tokens.color.surfaceMuted, borderRadius: tokens.radius.md, color: tokens.color.textMuted, fontSize: tokens.font.small }}>
            This was already handled — nothing else to do.
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      {!resource.expired && resource.actions.length > 0 && (
        <div style={{ position: "sticky", bottom: 0, background: tokens.color.surface, borderTop: `1px solid ${tokens.color.border}`, padding: tokens.space.md, boxShadow: tokens.shadow.lift }}>
          {done ? (
            <div style={{ textAlign: "center", color: tokens.color.success, fontWeight: 600, padding: tokens.space.sm }}>{outcome}</div>
          ) : replying ? (
            <div style={{ display: "flex", flexDirection: "column", gap: tokens.space.sm }}>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reply to your employee…"
                autoFocus
                rows={3}
                style={{ width: "100%", padding: tokens.space.sm, borderRadius: tokens.radius.sm, border: `1px solid ${tokens.color.borderStrong}`, fontFamily: tokens.font.family, fontSize: tokens.font.body, resize: "vertical", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: tokens.space.sm }}>
                <button onClick={() => setReplying(false)} style={btn("default")}>Cancel</button>
                <button onClick={submitReply} disabled={status === "working" || !note.trim()} style={btn("primary")}>Send</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: tokens.space.sm, flexWrap: "wrap" }}>
              {resource.actions.map((a) =>
                a.action === "view" && resource.open_url ? (
                  <a
                    key={a.action}
                    href={resource.open_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ ...btn(a.style ?? "primary"), flex: "1 1 100%", textAlign: "center", textDecoration: "none" }}
                  >
                    {a.label}
                  </a>
                ) : (
                  <button
                    key={a.action}
                    onClick={() => act(a.action)}
                    disabled={status === "working"}
                    style={{ ...btn(a.style ?? "default"), flex: isTerminal(a.action) ? "1 1 40%" : "1 1 100%" }}
                  >
                    {a.label}
                  </button>
                ),
              )}
              {status === "failed" && <div style={{ width: "100%", textAlign: "center", color: tokens.color.danger, fontSize: tokens.font.small, marginTop: tokens.space.xs }}>{outcome}</div>}
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100dvh", background: tokens.color.bg, fontFamily: tokens.font.family, color: tokens.color.text, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, maxWidth: 560, width: "100%", margin: "0 auto", background: tokens.color.surface, display: "flex", flexDirection: "column", minHeight: "100dvh", boxShadow: tokens.shadow.card }}>
        {children}
      </div>
    </main>
  );
}

function btn(style: "primary" | "danger" | "default"): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: `${tokens.space.md}px ${tokens.space.lg}px`,
    borderRadius: tokens.radius.md,
    fontSize: tokens.font.body,
    fontWeight: 600,
    fontFamily: tokens.font.family,
    cursor: "pointer",
    border: `1px solid ${tokens.color.borderStrong}`,
    background: tokens.color.surface,
    color: tokens.color.text,
  };
  if (style === "primary") return { ...base, background: tokens.color.accent, borderColor: tokens.color.accent, color: "#fff" };
  if (style === "danger") return { ...base, background: tokens.color.surface, borderColor: tokens.color.danger, color: tokens.color.danger };
  return base;
}

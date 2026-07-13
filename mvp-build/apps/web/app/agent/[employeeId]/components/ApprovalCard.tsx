"use client";

/**
 * The confirmation gate as the primary trust UI (build-plan 15 §3, §7): a real
 * pending approval rendered as a one-line, plain-English decision with Approve /
 * Reject. This is the binding gate for anything that leaves the business or spends
 * money — the WorkCard's "reply/tweak" is the conversation; THIS is the yes/no.
 */
import { useState } from "react";
import type { ApprovalRow } from "../surface-types";
import { moveStyle, tokens } from "../surface.tokens";

export function ApprovalCard({
  approval,
  onResolve,
}: {
  approval: ApprovalRow;
  onResolve: (id: string, response: "approved" | "rejected") => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const review = moveStyle.review;

  async function resolve(response: "approved" | "rejected") {
    setBusy(true);
    try { await onResolve(approval.id, response); } finally { setBusy(false); }
  }

  const btnBase: React.CSSProperties = {
    fontFamily: tokens.font.mono, fontSize: tokens.font.small, fontWeight: 600,
    letterSpacing: "0.06em", textTransform: "uppercase",
    padding: `0 ${tokens.space.lg}px`, height: 30,
    display: "inline-flex", alignItems: "center", cursor: busy ? "default" : "pointer",
  };
  return (
    <article style={{ display: "flex", border: `1px solid ${tokens.color.border}`, background: tokens.color.surface, overflow: "hidden" }}>
      <div aria-hidden style={{ width: 3, background: review.bar }} />
      <div style={{ flex: 1, padding: tokens.space.lg }}>
        <div style={{ display: "flex", alignItems: "center", gap: tokens.space.sm }}>
          <span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.tiny, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: review.color, border: `1px solid ${review.bar}`, padding: "0 6px", lineHeight: "16px", height: 18, display: "inline-flex", alignItems: "center" }}>Your call</span>
          {approval.risk_level ? <span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.tiny, letterSpacing: "0.06em", textTransform: "uppercase", color: approval.risk_level === "high" ? tokens.color.accent : tokens.color.textMuted }}>{approval.risk_level} risk</span> : null}
        </div>
        <p style={{ margin: `${tokens.space.sm}px 0 0`, fontSize: tokens.font.body, color: tokens.color.text }}>{approval.summary}</p>
        <div style={{ marginTop: tokens.space.md, display: "flex", gap: tokens.space.sm }}>
          <button disabled={busy} onClick={() => resolve("approved")} style={{ ...btnBase, background: tokens.color.text, color: "#ffffff", border: `1px solid ${tokens.color.text}` }}>Approve</button>
          <button disabled={busy} onClick={() => resolve("rejected")} style={{ ...btnBase, background: "transparent", color: tokens.color.danger, border: `1px solid ${tokens.color.danger}` }}>Not yet</button>
        </div>
      </div>
    </article>
  );
}

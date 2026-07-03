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

  return (
    <article style={{ display: "flex", borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.accentSoft}`, background: tokens.color.surface, boxShadow: tokens.shadow.card, overflow: "hidden" }}>
      <div aria-hidden style={{ width: 4, background: review.bar }} />
      <div style={{ flex: 1, padding: tokens.space.lg }}>
        <div style={{ display: "flex", alignItems: "center", gap: tokens.space.sm }}>
          <span style={{ fontSize: tokens.font.tiny, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: review.color, background: review.soft, padding: "2px 8px", borderRadius: tokens.radius.pill }}>Your call</span>
          {approval.risk_level ? <span style={{ fontSize: tokens.font.tiny, color: tokens.color.textMuted }}>{approval.risk_level} risk</span> : null}
        </div>
        <p style={{ margin: `${tokens.space.sm}px 0 0`, fontSize: tokens.font.body, color: tokens.color.text }}>{approval.summary}</p>
        <div style={{ marginTop: tokens.space.md, display: "flex", gap: tokens.space.sm }}>
          <button disabled={busy} onClick={() => resolve("approved")} style={{ background: tokens.color.success, color: "#fff", border: "none", borderRadius: tokens.radius.sm, padding: `${tokens.space.sm}px ${tokens.space.lg}px`, fontSize: tokens.font.small, cursor: busy ? "default" : "pointer" }}>Approve</button>
          <button disabled={busy} onClick={() => resolve("rejected")} style={{ background: "transparent", color: tokens.color.danger, border: `1px solid ${tokens.color.dangerSoft}`, borderRadius: tokens.radius.sm, padding: `${tokens.space.sm}px ${tokens.space.lg}px`, fontSize: tokens.font.small, cursor: busy ? "default" : "pointer" }}>Not yet</button>
        </div>
      </div>
    </article>
  );
}

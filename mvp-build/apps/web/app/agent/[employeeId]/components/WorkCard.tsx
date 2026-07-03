"use client";

/**
 * A single piece of work rendered as a coworker card, not a log line (build-plan 15
 * §4 three moves: notify / question / review). Driven entirely by WorkEventDescriptor.
 * The acceptance grammar (approve/edit/reject/respond/acknowledge) becomes the card's
 * actions; respond/edit open the one-line iterative feedback loop ("no, tweak this →").
 */
import { useState } from "react";
import type { WorkEventDescriptor } from "@amtech/shared";
import { moveStyle, tokens } from "../surface.tokens";
import { Deliverable } from "./deliverables";
import { Receipt } from "./Receipt";

export function WorkCard({
  descriptor,
  employeeId,
  onRespond,
  onResolve,
}: {
  descriptor: WorkEventDescriptor;
  employeeId: string;
  onRespond: (text: string) => void;
  onResolve?: (approvalId: string, response: "approved" | "rejected") => Promise<void> | void;
}) {
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [done, setDone] = useState(false);

  const move = moveStyle[descriptor.move] ?? moveStyle.notify;
  const acceptance = descriptor.deliverable?.acceptance ?? [];
  const canRespond = acceptance.includes("respond") || acceptance.includes("edit") || descriptor.move !== "notify";
  const canAck = acceptance.includes("acknowledge");
  const approvalId = descriptor.deliverable?.refs.approval_id;
  const canApprove = Boolean(approvalId && acceptance.includes("approve") && onResolve);
  const canReject = Boolean(approvalId && acceptance.includes("reject") && onResolve);

  function submit() {
    const text = draft.trim();
    if (!text) return;
    onRespond(text);
    setDraft("");
    setComposing(false);
    setDone(true);
  }

  async function resolve(response: "approved" | "rejected") {
    if (!approvalId || !onResolve) return;
    await onResolve(approvalId, response);
    setDone(true);
  }

  return (
    <article style={{
      display: "flex", borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`,
      background: tokens.color.surface, boxShadow: tokens.shadow.card, overflow: "hidden",
    }}>
      <div aria-hidden style={{ width: 4, background: move.bar }} />
      <div style={{ flex: 1, padding: tokens.space.lg }}>
        <div style={{ display: "flex", alignItems: "center", gap: tokens.space.sm }}>
          <span style={{
            fontSize: tokens.font.tiny, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
            color: move.color, background: move.soft, padding: "2px 8px", borderRadius: tokens.radius.pill,
          }}>{move.label}</span>
          <h3 style={{ margin: 0, fontSize: tokens.font.h3 }}>{descriptor.title}</h3>
        </div>
        <p style={{ margin: `${tokens.space.sm}px 0 0`, fontSize: tokens.font.body, color: tokens.color.text }}>{descriptor.summary}</p>

        {descriptor.deliverable ? <Deliverable d={descriptor.deliverable} employeeId={employeeId} /> : null}

        {descriptor.suggested_next_action && !done ? (
          <p style={{ margin: `${tokens.space.sm}px 0 0`, fontSize: tokens.font.small, color: tokens.color.textMuted }}>
            {descriptor.suggested_next_action}
          </p>
        ) : null}

        <Receipt proof={descriptor.proof} />

        {done ? (
          <p style={{ margin: `${tokens.space.md}px 0 0`, fontSize: tokens.font.small, color: tokens.color.success }}>✓ Sent to your employee.</p>
        ) : composing ? (
          <div style={{ marginTop: tokens.space.md, display: "flex", gap: tokens.space.sm }}>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="No — tweak this: tell your employee what to change…"
              style={{ flex: 1, padding: `${tokens.space.sm}px ${tokens.space.md}px`, border: `1px solid ${tokens.color.borderStrong}`, borderRadius: tokens.radius.sm, fontSize: tokens.font.small }}
            />
            <button onClick={submit} style={primaryBtn}>Send</button>
          </div>
        ) : (canRespond || canAck || canApprove || canReject) ? (
          <div style={{ marginTop: tokens.space.md, display: "flex", gap: tokens.space.sm }}>
            {canApprove ? <button onClick={() => void resolve("approved")} style={approveBtn}>Approve</button> : null}
            {canReject ? <button onClick={() => void resolve("rejected")} style={rejectBtn}>Not yet</button> : null}
            {canRespond ? <button onClick={() => setComposing(true)} style={primaryBtn}>Reply / tweak</button> : null}
            {canAck ? <button onClick={() => setDone(true)} style={ghostBtn}>Got it</button> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

const primaryBtn: React.CSSProperties = {
  background: tokens.color.accent, color: "#fff", border: "none",
  borderRadius: tokens.radius.sm, padding: `${tokens.space.sm}px ${tokens.space.md}px`,
  fontSize: tokens.font.small, cursor: "pointer",
};
const approveBtn: React.CSSProperties = {
  background: tokens.color.success, color: "#fff", border: "none",
  borderRadius: tokens.radius.sm, padding: `${tokens.space.sm}px ${tokens.space.md}px`,
  fontSize: tokens.font.small, cursor: "pointer",
};
const rejectBtn: React.CSSProperties = {
  background: "transparent", color: tokens.color.danger, border: `1px solid ${tokens.color.dangerSoft}`,
  borderRadius: tokens.radius.sm, padding: `${tokens.space.sm}px ${tokens.space.md}px`,
  fontSize: tokens.font.small, cursor: "pointer",
};
const ghostBtn: React.CSSProperties = {
  background: "transparent", color: tokens.color.textMuted, border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.sm, padding: `${tokens.space.sm}px ${tokens.space.md}px`,
  fontSize: tokens.font.small, cursor: "pointer",
};

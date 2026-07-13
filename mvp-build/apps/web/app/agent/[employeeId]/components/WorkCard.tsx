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
import { McpUiResource, type McpUiIntent } from "./McpUiResource";
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

  const uiResource = descriptor.deliverable?.ui_resource;
  function onUiIntent(intent: McpUiIntent, intentApprovalId: string | undefined, payload: Record<string, unknown>) {
    if (intent === "accept" || intent === "accept_all") { void resolve("approved"); return; }
    if (intent === "reject") { void resolve("rejected"); return; }
    if (intent === "respond") {
      const fields = (payload.fields as Record<string, string> | undefined) ?? {};
      const text = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join(", ");
      if (text) { onRespond(text); setDone(true); }
    }
  }

  return (
    <article style={{
      display: "flex", border: `1px solid ${tokens.color.border}`,
      background: tokens.color.surface, overflow: "hidden",
    }}>
      <div aria-hidden style={{ width: 3, background: move.bar }} />
      <div style={{ flex: 1, padding: tokens.space.lg }}>
        <div style={{ display: "flex", alignItems: "center", gap: tokens.space.sm, flexWrap: "wrap" }}>
          <span style={{
            fontFamily: tokens.font.mono, fontSize: tokens.font.tiny, fontWeight: 500, letterSpacing: "0.06em",
            textTransform: "uppercase", color: move.color, border: `1px solid ${move.bar}`,
            padding: "0 6px", lineHeight: "16px", height: 18, display: "inline-flex", alignItems: "center",
          }}>{move.label}</span>
          <h3 style={{ margin: 0, fontSize: tokens.font.h3, fontWeight: 600, letterSpacing: "-0.015em" }}>{descriptor.title}</h3>
        </div>
        <p style={{ margin: `${tokens.space.sm}px 0 0`, fontSize: tokens.font.body, color: tokens.color.text }}>{descriptor.summary}</p>

        {uiResource ? (
          <McpUiResource resource={uiResource} onIntent={onUiIntent} />
        ) : descriptor.deliverable ? (
          <Deliverable d={descriptor.deliverable} employeeId={employeeId} />
        ) : null}

        {descriptor.suggested_next_action && !done ? (
          <p style={{ margin: `${tokens.space.sm}px 0 0`, fontSize: tokens.font.small, color: tokens.color.textMuted }}>
            {descriptor.suggested_next_action}
          </p>
        ) : null}

        <Receipt proof={descriptor.proof} />

        {done ? (
          <p style={{ margin: `${tokens.space.md}px 0 0`, fontFamily: tokens.font.mono, fontSize: tokens.font.small, color: tokens.color.text }}>✓ Sent to your employee.</p>
        ) : uiResource ? null : composing ? (
          <div style={{ marginTop: tokens.space.md, display: "flex", gap: tokens.space.sm }}>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="No — tweak this: tell your employee what to change…"
              style={{ flex: 1, padding: `0 ${tokens.space.md}px`, height: 30, border: `1px solid ${tokens.color.borderStrong}`, fontSize: tokens.font.small, fontFamily: tokens.font.family, outline: "none" }}
            />
            <button onClick={submit} style={primaryBtn}>Send</button>
          </div>
        ) : (canRespond || canAck || canApprove || canReject) ? (
          <div style={{ marginTop: tokens.space.md, display: "flex", gap: tokens.space.sm, flexWrap: "wrap" }}>
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

const btnBase: React.CSSProperties = {
  fontFamily: tokens.font.mono, fontSize: tokens.font.small, fontWeight: 600,
  letterSpacing: "0.06em", textTransform: "uppercase",
  padding: `0 ${tokens.space.md}px`, height: 30,
  display: "inline-flex", alignItems: "center", cursor: "pointer",
};
const primaryBtn: React.CSSProperties = {
  ...btnBase, background: tokens.color.text, color: "#ffffff", border: `1px solid ${tokens.color.text}`,
};
const approveBtn: React.CSSProperties = {
  ...btnBase, background: tokens.color.text, color: "#ffffff", border: `1px solid ${tokens.color.text}`,
};
const rejectBtn: React.CSSProperties = {
  ...btnBase, background: "transparent", color: tokens.color.danger, border: `1px solid ${tokens.color.danger}`,
};
const ghostBtn: React.CSSProperties = {
  ...btnBase, background: "transparent", color: tokens.color.textMuted, border: `1px solid ${tokens.color.borderStrong}`,
};

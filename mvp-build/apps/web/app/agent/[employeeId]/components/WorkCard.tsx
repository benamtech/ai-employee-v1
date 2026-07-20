"use client";

/**
 * A single piece of owner-safe work rendered as a coworker card, not a raw log
 * line. Native actions and MCP App actions both return through Manager-owned
 * assignment and authority-version checks.
 */
import { useState } from "react";
import type { AuthorityProjection, WorkEventDescriptor } from "@amtech/shared";
import { moveStyle, tokens } from "../surface.tokens";
import { Deliverable } from "./deliverables";
import { McpUiResource, type McpUiIntent } from "./McpUiResource";
import { Receipt } from "./Receipt";

function payloadFingerprint(value: unknown): string {
  const text = JSON.stringify(value ?? {});
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function protocolAction(intent: McpUiIntent): string {
  return intent === "accept" || intent === "accept_all" ? "approve" : intent;
}

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
  const [actionError, setActionError] = useState<string | null>(null);

  const move = moveStyle[descriptor.move] ?? moveStyle.notify;
  const acceptance = descriptor.deliverable?.acceptance ?? [];
  const canRespond = acceptance.includes("respond")
    || acceptance.includes("edit")
    || descriptor.move === "question"
    || descriptor.move === "review";
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
  async function onUiIntent(
    intent: McpUiIntent,
    _intentApprovalId: string | undefined,
    payload: Record<string, unknown>,
    authority: AuthorityProjection,
  ) {
    const action = protocolAction(intent);
    const idempotencyKey = `mcpui:${authority.resource_id}:${action}:${authority.authority_version}:${payloadFingerprint(payload)}`;
    setActionError(null);
    const response = await fetch(`/api/employee/${employeeId}/protocol-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: "amtech.mcp-app.v1",
        authority,
        action,
        idempotency_key: idempotencyKey,
        payload,
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      setActionError(body.error ?? "The employee could not verify that action. Refresh and try again.");
      return;
    }
    setDone(true);
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
        {actionError ? <p role="alert" style={{ margin: `${tokens.space.md}px 0 0`, color: tokens.color.danger }}>{actionError}</p> : null}

        {done ? (
          <p style={{ margin: `${tokens.space.md}px 0 0`, fontFamily: tokens.font.mono, fontSize: tokens.font.small, color: tokens.color.text }}>✓ Sent to your employee.</p>
        ) : uiResource ? null : composing ? (
          <div style={{ marginTop: tokens.space.md, display: "flex", gap: tokens.space.sm }}>
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
              placeholder="No — tweak this: tell your employee what to change…"
              style={{ flex: 1, padding: `0 ${tokens.space.md}px`, minHeight: 44, border: `1px solid ${tokens.color.borderStrong}`, fontSize: tokens.font.small, fontFamily: tokens.font.family, outline: "none" }}
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
  padding: `0 ${tokens.space.md}px`, minHeight: 44,
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

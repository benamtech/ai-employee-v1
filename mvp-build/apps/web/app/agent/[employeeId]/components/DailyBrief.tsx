/**
 * The daily brief (build-plan 15 §4b): the first thing the owner sees — a calm,
 * one-glance summary of what matters today, in plain language. Pro-human framing:
 * time back and money made, never a wall of telemetry. Rendered as the Today
 * hero: headline over a full-width segmented stat strip.
 */
import type { ApprovalRow, ReminderRow, ResurfaceItem, StripeInvoiceRow, WorkEventRow } from "../surface-types";
import { tokens } from "../surface.tokens";

function Stat({ n, label, tone, last }: { n: number; label: string; tone: "accent" | "warning" | "success" | "muted"; last?: boolean }) {
  const active = n > 0;
  const color = !active
    ? tokens.color.textMuted
    : tone === "accent" || tone === "warning"
      ? tokens.color.accent
      : tokens.color.text;
  return (
    <div style={{ flex: "1 1 120px", minWidth: 120, padding: `${tokens.space.md}px ${tokens.space.lg}px`, borderRight: last ? "none" : `1px solid ${tokens.color.border}` }}>
      <span style={{ display: "block", fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: "42px", color }}>{n}</span>
      <span style={{ display: "block", marginTop: 3, fontFamily: tokens.font.mono, fontSize: tokens.font.tiny, fontWeight: 500, letterSpacing: "0.09em", textTransform: "uppercase", color: tokens.color.textMuted }}>{label}</span>
    </div>
  );
}

export function DailyBrief({
  approvals,
  reminders,
  workEvents,
  invoices,
  resurfaceItems = [],
}: {
  approvals: ApprovalRow[];
  reminders: ReminderRow[];
  workEvents: WorkEventRow[];
  invoices: StripeInvoiceRow[];
  resurfaceItems?: ResurfaceItem[];
}) {
  const storedBrief = workEvents.find((e) => e.event_type === "manager.daily_brief" && e.work_event_descriptor?.summary);
  const now = Date.now();
  const upcoming = reminders.filter((r) => r.status === "scheduled" && new Date(r.scheduled_at).getTime() >= now).length;
  const questions = workEvents.filter((e) => e.work_event_descriptor?.move === "question").length;
  const needsAttention = resurfaceItems.filter((item) => item.status === "needs_you" || item.status === "blocked" || item.status === "failed").length;
  const paidCents = invoices.filter((i) => i.status.toLowerCase() === "paid").reduce((s, i) => s + (i.deposit_amount ?? 0), 0);

  const activeCount = needsAttention || approvals.length + questions;
  const nothing = activeCount + upcoming + paidCents === 0;
  const headline = storedBrief?.work_event_descriptor?.summary?.replace(/^\[SILENT\]\s*/, "") ?? (nothing
    ? "All clear — your employee is keeping up. Nothing needs you right now."
    : activeCount
      ? "A couple of things need a quick word from you. The rest is handled."
      : "Everything's moving. Here's where your jobs stand.");

  return (
    <section style={{ border: `1px solid ${tokens.color.border}`, background: tokens.color.surface }}>
      <div style={{ padding: `${tokens.space.lg}px ${tokens.space.lg}px` }}>
        <span style={{ display: "block", fontFamily: tokens.font.mono, fontSize: tokens.font.tiny, fontWeight: 500, letterSpacing: "0.09em", textTransform: "uppercase", color: tokens.color.accent, marginBottom: tokens.space.sm }}>
          Daily brief
          <span suppressHydrationWarning style={{ color: tokens.color.textMuted }}>
            {" — " + new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </span>
        </span>
        <p style={{ margin: 0, fontSize: tokens.font.h2, fontWeight: 700, letterSpacing: "-0.015em", lineHeight: 1.4, color: tokens.color.text, maxWidth: 480 }}>{headline}</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", borderTop: `1px solid ${tokens.color.border}` }}>
        <Stat n={needsAttention || approvals.length} label="need attention" tone="accent" />
        <Stat n={questions} label="customer replies" tone="warning" />
        <Stat n={upcoming} label="reminders set" tone="muted" />
        <Stat n={paidCents > 0 ? Math.round(paidCents / 100) : 0} label="deposits collected ($)" tone="success" last />
      </div>
    </section>
  );
}

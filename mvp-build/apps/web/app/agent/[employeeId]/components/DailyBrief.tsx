/**
 * The daily brief (build-plan 15 §4b): the first thing the owner sees — a calm,
 * one-glance summary of what matters today, in plain language. Pro-human framing:
 * time back and money made, never a wall of telemetry.
 */
import type { ApprovalRow, ReminderRow, ResurfaceItem, StripeInvoiceRow, WorkEventRow } from "../surface-types";
import { tokens } from "../surface.tokens";

function Stat({ n, label, tone }: { n: number; label: string; tone: "accent" | "warning" | "success" | "muted" }) {
  const color = tone === "accent" ? tokens.color.accent : tone === "warning" ? tokens.color.warning : tone === "success" ? tokens.color.success : tokens.color.textMuted;
  return (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 84 }}>
      <span style={{ fontSize: 22, fontWeight: 700, color }}>{n}</span>
      <span style={{ fontSize: tokens.font.small, color: tokens.color.textMuted }}>{label}</span>
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
    <section style={{
      borderRadius: tokens.radius.lg, border: `1px solid ${tokens.color.border}`,
      background: `linear-gradient(180deg, ${tokens.color.surface}, ${tokens.color.surfaceMuted})`,
      boxShadow: tokens.shadow.card, padding: tokens.space.xl,
    }}>
      <p style={{ margin: 0, fontSize: tokens.font.body, color: tokens.color.text }}>{headline}</p>
      <div style={{ display: "flex", gap: tokens.space.xl, marginTop: tokens.space.lg, flexWrap: "wrap" }}>
        <Stat n={needsAttention || approvals.length} label="need attention" tone="accent" />
        <Stat n={questions} label="customer replies" tone="warning" />
        <Stat n={upcoming} label="reminders set" tone="muted" />
        <Stat n={paidCents > 0 ? Math.round(paidCents / 100) : 0} label="deposits collected ($)" tone="success" />
      </div>
    </section>
  );
}

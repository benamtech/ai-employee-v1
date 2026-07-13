/**
 * The job folder (build-plan 15 §4b): the owner reads "the Smith repaint" as ONE
 * thing — estimate -> customer reply -> deposit invoice -> reminder — instead of four
 * disconnected rows. Calm timeline with status tags; provider proof stays quiet.
 */
import type { JobFolder as JobFolderModel } from "../surface-types";
import { tokens } from "../surface.tokens";

function money(cents?: number | null): string {
  return cents == null ? "" : `$${(cents / 100).toFixed(2)}`;
}

function chipColor(status: string): { fg: string; border: string; bg: string } {
  const s = status.toLowerCase();
  if (["paid", "sent", "completed", "active", "delivered"].includes(s)) return { fg: tokens.color.text, border: tokens.color.borderStrong, bg: tokens.color.surface };
  if (["failed", "error", "requirements_due"].includes(s)) return { fg: "#ffffff", border: tokens.color.danger, bg: tokens.color.danger };
  return { fg: tokens.color.textMuted, border: tokens.color.border, bg: tokens.color.surface };
}

function Chip({ status }: { status: string }) {
  const c = chipColor(status);
  return (
    <span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.tiny, fontWeight: 500, color: c.fg, background: c.bg, border: `1px solid ${c.border}`, padding: "0 6px", lineHeight: "16px", height: 18, display: "inline-flex", alignItems: "center", textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function Step({ tag, children }: { tag: string; children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", gap: tokens.space.md, alignItems: "baseline", padding: `${tokens.space.sm}px 0`, borderTop: `1px solid ${tokens.color.border.replace("0.10", "0.05")}`, fontSize: tokens.font.small, color: tokens.color.text }}>
      <span aria-hidden style={{ width: 30, flexShrink: 0, fontFamily: tokens.font.mono, fontSize: tokens.font.tiny, fontWeight: 500, letterSpacing: "0.06em", color: tokens.color.textMuted, textTransform: "uppercase" }}>{tag}</span>
      <div style={{ display: "flex", gap: tokens.space.sm, alignItems: "baseline", flexWrap: "wrap" }}>{children}</div>
    </li>
  );
}

export function JobFolder({ folder, employeeId }: { folder: JobFolderModel; employeeId: string }) {
  const { estimate, invoices, reminders, workEvents } = folder;
  return (
    <section style={{ border: `1px solid ${tokens.color.border}`, background: tokens.color.surface }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: tokens.space.sm, padding: `${tokens.space.sm}px ${tokens.space.lg}px`, borderBottom: `1px solid ${tokens.color.border}` }}>
        <span aria-hidden style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.tiny, fontWeight: 500, letterSpacing: "0.06em", color: tokens.color.accent, textTransform: "uppercase" }}>Job</span>
        <h3 style={{ margin: 0, fontSize: tokens.font.h3, fontWeight: 600, letterSpacing: "-0.015em" }}>{folder.title}</h3>
        {estimate?.payload?.recommended_total ? (
          <span style={{ marginLeft: "auto", fontFamily: tokens.font.mono, fontSize: tokens.font.small, fontWeight: 600, color: tokens.color.text }}>${estimate.payload.recommended_total}</span>
        ) : null}
      </header>
      <ul style={{ listStyle: "none", margin: 0, padding: `0 ${tokens.space.lg}px ${tokens.space.sm}px` }}>
        {estimate ? (
          <Step tag="est">
            <a href={`/agent/${employeeId}/output/${estimate.id}`} target="_blank" rel="noreferrer" style={{ color: tokens.color.accent, textDecoration: "underline", textUnderlineOffset: 3 }}>
              Estimate{estimate.payload?.customer_name ? ` for ${estimate.payload.customer_name}` : ""}
            </a>
          </Step>
        ) : null}
        {workEvents.map((ev) => (
          <Step key={ev.id} tag={ev.work_event_descriptor?.move === "question" ? "msg" : "mail"}>
            <span>{ev.work_event_descriptor?.title ?? ev.event_type}</span>
            <Chip status={ev.status} />
          </Step>
        ))}
        {invoices.map((inv) => (
          <Step key={inv.id} tag="inv">
            <span>Deposit invoice {money(inv.deposit_amount)}</span>
            <Chip status={inv.status} />
            {inv.hosted_invoice_url ? (
              <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" style={{ color: tokens.color.accent, textDecoration: "underline", textUnderlineOffset: 3 }}>open</a>
            ) : null}
          </Step>
        ))}
        {reminders.map((r) => (
          <Step key={r.id} tag="rem">
            <span>{r.message ?? "Job reminder"}</span>
            <span style={{ color: tokens.color.textMuted }}>{new Date(r.scheduled_at).toLocaleString()}</span>
            <Chip status={r.status} />
          </Step>
        ))}
      </ul>
    </section>
  );
}

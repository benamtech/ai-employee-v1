/**
 * The job folder (build-plan 15 §4b): the owner reads "the Smith repaint" as ONE
 * thing — estimate -> customer reply -> deposit invoice -> reminder — instead of four
 * disconnected rows. Calm timeline with status chips; provider proof stays quiet.
 */
import type { JobFolder as JobFolderModel } from "../surface-types";
import { tokens } from "../surface.tokens";

function money(cents?: number | null): string {
  return cents == null ? "" : `$${(cents / 100).toFixed(2)}`;
}

function chipColor(status: string): { fg: string; bg: string } {
  const s = status.toLowerCase();
  if (["paid", "sent", "completed", "active", "delivered"].includes(s)) return { fg: tokens.color.success, bg: tokens.color.successSoft };
  if (["scheduled", "draft", "pending", "open"].includes(s)) return { fg: tokens.color.warning, bg: tokens.color.warningSoft };
  if (["failed", "error", "requirements_due"].includes(s)) return { fg: tokens.color.danger, bg: tokens.color.dangerSoft };
  return { fg: tokens.color.textMuted, bg: tokens.color.surfaceMuted };
}

function Chip({ status }: { status: string }) {
  const c = chipColor(status);
  return (
    <span style={{ fontSize: tokens.font.tiny, fontWeight: 600, color: c.fg, background: c.bg, padding: "1px 7px", borderRadius: tokens.radius.pill, textTransform: "capitalize" }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function Step({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", gap: tokens.space.sm, alignItems: "baseline", padding: `${tokens.space.xs}px 0`, fontSize: tokens.font.small, color: tokens.color.text }}>
      <span aria-hidden style={{ width: 18 }}>{icon}</span>
      <div style={{ display: "flex", gap: tokens.space.sm, alignItems: "baseline", flexWrap: "wrap" }}>{children}</div>
    </li>
  );
}

export function JobFolder({ folder, employeeId }: { folder: JobFolderModel; employeeId: string }) {
  const { estimate, invoices, reminders, workEvents } = folder;
  return (
    <section style={{ borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.surface, boxShadow: tokens.shadow.card, padding: tokens.space.lg }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: tokens.space.sm, marginBottom: tokens.space.sm }}>
        <span aria-hidden>📁</span>
        <h3 style={{ margin: 0, fontSize: tokens.font.h3 }}>{folder.title}</h3>
        {estimate?.payload?.recommended_total ? (
          <span style={{ marginLeft: "auto", fontSize: tokens.font.small, color: tokens.color.textMuted }}>${estimate.payload.recommended_total}</span>
        ) : null}
      </header>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {estimate ? (
          <Step icon="📄">
            <a href={`/agent/${employeeId}/output/${estimate.id}`} target="_blank" rel="noreferrer" style={{ color: tokens.color.accent }}>
              Estimate{estimate.payload?.customer_name ? ` for ${estimate.payload.customer_name}` : ""}
            </a>
          </Step>
        ) : null}
        {workEvents.map((ev) => (
          <Step key={ev.id} icon={ev.work_event_descriptor?.move === "question" ? "💬" : "✉️"}>
            <span>{ev.work_event_descriptor?.title ?? ev.event_type}</span>
            <Chip status={ev.status} />
          </Step>
        ))}
        {invoices.map((inv) => (
          <Step key={inv.id} icon="💵">
            <span>Deposit invoice {money(inv.deposit_amount)}</span>
            <Chip status={inv.status} />
            {inv.hosted_invoice_url ? (
              <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" style={{ color: tokens.color.accent }}>open</a>
            ) : null}
          </Step>
        ))}
        {reminders.map((r) => (
          <Step key={r.id} icon="⏰">
            <span>{r.message ?? "Job reminder"}</span>
            <span style={{ color: tokens.color.textMuted }}>{new Date(r.scheduled_at).toLocaleString()}</span>
            <Chip status={r.status} />
          </Step>
        ))}
      </ul>
    </section>
  );
}

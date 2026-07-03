/**
 * Deliverable renderers — one known, pre-approved component per DeliverableType
 * (wiki/MVP/phase-3-generative-ui-reframe.md). The agent fills a typed contract; the
 * renderer is deterministic and tested-shaped, so the owner sees the SAME grammar
 * every time and the model can never surprise them with a new UI for money/customer
 * actions. Unknown types fall back to a safe generic block — never a raw payload.
 */
import type { DeliverableType, WorkDeliverableDescriptor } from "@amtech/shared";
import { tokens } from "../../surface.tokens";

function money(cents?: number, currency = "usd"): string {
  if (cents == null) return "";
  const v = (cents / 100).toFixed(2);
  return currency.toLowerCase() === "usd" ? `$${v}` : `${v} ${currency.toUpperCase()}`;
}

function Line({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <span style={{ fontSize: tokens.font.small, color: tokens.color.textMuted }}>
      <span style={{ color: tokens.color.textFaint }}>{label} </span>
      {value}
    </span>
  );
}

function Shell({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", gap: tokens.space.sm, alignItems: "baseline",
      background: tokens.color.surfaceMuted, border: `1px solid ${tokens.color.border}`,
      borderRadius: tokens.radius.sm, padding: `${tokens.space.sm}px ${tokens.space.md}px`, marginTop: tokens.space.sm,
    }}>
      <span aria-hidden style={{ fontSize: tokens.font.body }}>{icon}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: tokens.space.md }}>{children}</div>
    </div>
  );
}

const ICONS: Record<DeliverableType, string> = {
  document: "📄",
  outbound_message: "✉️",
  money_movement: "💵",
  dataset_report: "📊",
  recommendation: "💡",
  schedule_mutation: "🗓️",
  structured_record_write: "🗂️",
  media_asset: "🖼️",
  job_folder: "📁",
  external_system_action: "🔗",
  plan: "🧭",
};

export function Deliverable({ d, employeeId }: { d: WorkDeliverableDescriptor; employeeId: string }) {
  const icon = ICONS[d.type] ?? "•";
  const refs = d.refs ?? {};
  const gated = Boolean(d.leaves_business || d.money?.involved);

  switch (d.type) {
    case "money_movement":
      return (
        <Shell icon={icon}>
          <strong style={{ fontSize: tokens.font.small }}>{d.title}</strong>
          <Line label="amount" value={money(d.money?.amount_cents, d.money?.currency)} />
          {refs.hosted_invoice_url ? (
            <a href={refs.hosted_invoice_url} target="_blank" rel="noreferrer" style={{ color: tokens.color.accent, fontSize: tokens.font.small }}>Open invoice</a>
          ) : null}
          {gated ? <Line label="" value="leaves the business — your approval gates it" /> : null}
        </Shell>
      );
    case "document":
      return (
        <Shell icon={icon}>
          {refs.estimate_artifact_id || refs.artifact_id ? (
            <a href={`/agent/${employeeId}/output/${refs.estimate_artifact_id ?? refs.artifact_id}`} target="_blank" rel="noreferrer" style={{ color: tokens.color.accent, fontSize: tokens.font.small }}>
              {d.title || "Open document"}
            </a>
          ) : <strong style={{ fontSize: tokens.font.small }}>{d.title}</strong>}
        </Shell>
      );
    case "outbound_message":
      return (
        <Shell icon={icon}>
          <strong style={{ fontSize: tokens.font.small }}>{d.title}</strong>
          <Line label="to" value={refs.to ?? refs.customer_email} />
          {gated ? <Line label="" value="won't send until you approve" /> : null}
        </Shell>
      );
    case "job_folder":
      return (
        <Shell icon={icon}>
          <strong style={{ fontSize: tokens.font.small }}>{d.title}</strong>
          <Line label="customer" value={refs.customer_ref} />
        </Shell>
      );
    case "schedule_mutation":
      return (
        <Shell icon={icon}>
          <strong style={{ fontSize: tokens.font.small }}>{d.title}</strong>
          <Line label="when" value={refs.when ?? refs.scheduled_at} />
        </Shell>
      );
    default:
      // recommendation, dataset_report, structured_record_write, media_asset,
      // external_system_action, plan — safe generic block.
      return (
        <Shell icon={icon}>
          <strong style={{ fontSize: tokens.font.small }}>{d.title}</strong>
          <Line label="" value={d.type.replace(/_/g, " ")} />
        </Shell>
      );
  }
}

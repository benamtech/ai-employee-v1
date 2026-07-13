/**
 * First-run activation — what the owner sees on a brand-new employee, before any
 * work exists. Not an empty void: a clear "here's how to start" checklist. This
 * is the activation surface (send first job → connect email → connect payments).
 * Business-native language, AMTECH system, links into the real connect flow.
 */
import Link from "next/link";
import { tokens } from "../surface.tokens";

export function FirstRun({ employeeId, employeeName }: { employeeId: string; employeeName?: string }) {
  const name = employeeName || "Your employee";
  const steps = [
    {
      tag: "Step 01 — say hi",
      title: "Text it your first job",
      body: "Send a real request the way you'd tell a coworker. It comes back with an estimate you can review.",
      cta: null,
    },
    {
      tag: "Step 02 — connect",
      title: "Connect your email",
      body: "So it can send estimates and follow up with customers — always after your approval.",
      cta: { label: "Connect email", href: `/agent/${employeeId}/connect/gmail` },
    },
    {
      tag: "Step 03 — connect",
      title: "Connect payments",
      body: "So it can prepare deposit invoices and payment links. Nothing is charged without your yes.",
      cta: { label: "Connect payments", href: `/agent/${employeeId}/connect/stripe` },
    },
  ];

  return (
    <div>
      <section style={{ border: `1px solid ${tokens.color.border}`, background: tokens.color.surface }}>
        <div style={{ padding: `${tokens.space.lg}px ${tokens.space.lg}px` }}>
          <span style={{ display: "block", fontFamily: tokens.font.mono, fontSize: tokens.font.tiny, fontWeight: 500, letterSpacing: "0.09em", textTransform: "uppercase", color: tokens.color.accent, marginBottom: tokens.space.sm }}>
            ✓ {name} is ready
          </span>
          <p style={{ margin: 0, fontSize: tokens.font.h2, fontWeight: 700, letterSpacing: "-0.015em", lineHeight: 1.4, color: tokens.color.text, maxWidth: 480 }}>
            Set up and waiting for its first job. Three quick steps and it&rsquo;s working for you.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", borderTop: `1px solid ${tokens.color.border}` }}>
          <Stat n="0" label="jobs yet" />
          <Stat n="0" label="waiting on you" />
          <Stat n="0" label="connected" muted last />
        </div>
      </section>

      <div style={{ marginTop: tokens.space.lg, border: `1px solid ${tokens.color.border}`, background: tokens.color.surface }}>
        <h2 style={{ margin: 0, padding: `${tokens.space.sm}px ${tokens.space.md}px`, fontFamily: tokens.font.mono, fontSize: tokens.font.tiny, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", borderBottom: `1px solid ${tokens.color.border}` }}>
          Get started
        </h2>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: `${tokens.space.xs}px ${tokens.space.md}px`, alignItems: "center", padding: tokens.space.md, borderBottom: i < steps.length - 1 ? `1px solid ${tokens.color.border}` : "none" }}>
            <span style={{ gridColumn: 1, fontFamily: tokens.font.mono, fontSize: tokens.font.tiny, fontWeight: 500, letterSpacing: "0.09em", textTransform: "uppercase", color: tokens.color.accent }}>{s.tag}</span>
            <strong style={{ gridColumn: 1, fontSize: tokens.font.h3, fontWeight: 600, letterSpacing: "-0.015em" }}>{s.title}</strong>
            <p style={{ gridColumn: 1, margin: 0, fontSize: tokens.font.small, lineHeight: 1.5, color: tokens.color.textMuted }}>{s.body}</p>
            {s.cta ? (
              <Link href={s.cta.href} style={{ gridColumn: 2, gridRow: "1 / span 3", alignSelf: "center", fontFamily: tokens.font.mono, fontSize: tokens.font.tiny, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#ffffff", background: tokens.color.text, border: `1px solid ${tokens.color.text}`, padding: `0 ${tokens.space.md}px`, height: 30, display: "inline-flex", alignItems: "center", textDecoration: "none", whiteSpace: "nowrap" }}>{s.cta.label}</Link>
            ) : (
              <span style={{ gridColumn: 2, gridRow: "1 / span 3", alignSelf: "center", fontFamily: tokens.font.mono, fontSize: tokens.font.tiny, letterSpacing: "0.06em", textTransform: "uppercase", color: tokens.color.textMuted }}>Text the number</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ n, label, muted, last }: { n: string; label: string; muted?: boolean; last?: boolean }) {
  return (
    <div style={{ flex: "1 1 120px", minWidth: 120, padding: `${tokens.space.md}px ${tokens.space.lg}px`, borderRight: last ? "none" : `1px solid ${tokens.color.border}` }}>
      <span style={{ display: "block", fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: "42px", color: tokens.color.textMuted }}>{n}</span>
      <span style={{ display: "block", marginTop: 3, fontFamily: tokens.font.mono, fontSize: tokens.font.tiny, fontWeight: 500, letterSpacing: "0.09em", textTransform: "uppercase", color: tokens.color.textMuted }}>{label}</span>
    </div>
  );
}

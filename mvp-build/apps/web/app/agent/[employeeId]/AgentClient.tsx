"use client";

/**
 * The Work Surface (wiki/MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md):
 * Hermes's developer event stream rendered as a coworker a non-technical owner trusts
 * and enjoys — never a dashboard. One relationship, two surfaces (this + SMS), three
 * moves (notify/question/review). Everything renders from WorkEventDescriptor and
 * Manager records; no raw provider payloads, no tool names, no JSON.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { tokens } from "./surface.tokens";
import type { ResourcePayload } from "./surface-types";
import { groupByJob } from "./lib/group-by-job";
import { DailyBrief } from "./components/DailyBrief";
import { ApprovalCard } from "./components/ApprovalCard";
import { WorkCard } from "./components/WorkCard";
import { JobFolder } from "./components/JobFolder";

const EMPTY: ResourcePayload = {
  account_id: "", artifacts: [], approvals: [], messages: [], connectors: [],
  stripe_invoices: [], reminders: [], job_commitments: [], work_events: [],
};

export function AgentClient({ employeeId }: { employeeId: string }) {
  const [res, setRes] = useState<ResourcePayload>(EMPTY);
  const [chat, setChat] = useState<Array<{ role: "owner" | "employee"; body: string }>>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");

  const refresh = useCallback(async () => {
    const r = await fetch(`/api/employee/${employeeId}/resources`, { method: "POST" });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) { setStatus(json.error ?? "Could not load your work."); return; }
    setRes({ ...EMPTY, ...json });
  }, [employeeId]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    let cancelled = false;
    async function beat() {
      if (cancelled) return;
      await fetch(`/api/employee/${employeeId}/heartbeat`, { method: "POST" }).catch(() => {});
    }
    void beat();
    const timer = window.setInterval(() => { void beat(); }, 30_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [employeeId]);
  useEffect(() => {
    const events = new EventSource(`/api/employee/${employeeId}/events`);
    events.addEventListener("snapshot", (event) => {
      try {
        const json = JSON.parse((event as MessageEvent).data);
        if (json?.account_id) setRes({ ...EMPTY, ...json });
      } catch {
        // Polling remains the fallback.
      }
    });
    events.onerror = () => events.close();
    return () => events.close();
  }, [employeeId]);

  const sendToEmployee = useCallback(async (text: string) => {
    setChat((c) => [...c, { role: "owner", body: text }]);
    const r = await fetch(`/api/employee/${employeeId}/message`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }),
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) { setStatus(json.error ?? "Message failed."); return; }
    setChat((c) => [...c, { role: "employee", body: json.reply }]);
    await refresh();
  }, [employeeId, refresh]);

  const resolveApproval = useCallback(async (approvalId: string, response: "approved" | "rejected") => {
    if (!res.account_id) { setStatus("Account context is missing."); return; }
    const r = await fetch(`/api/employee/${employeeId}/approval/resolve`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_id: res.account_id, approval_id: approvalId, owner_response: response }),
    });
    const json = await r.json().catch(() => ({}));
    setStatus(json.user_facing_summary_hint ?? json.error ?? "Updated.");
    await refresh();
  }, [employeeId, res.account_id, refresh]);

  const startConnector = useCallback(async (provider: string) => {
    setStatus(`Starting ${provider}…`);
    const r = await fetch(`/api/employee/${employeeId}/connector/start`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider }),
    });
    const json = await r.json().catch(() => ({}));
    const consentUrl = json?.proof?.consent_url;
    if (r.ok && consentUrl) {
      setStatus("Opening the secure Google consent page — authorize there, then come back.");
      window.open(consentUrl, "_blank", "noopener,noreferrer");
    } else {
      setStatus(json.error ?? json.user_facing_summary_hint ?? "Could not start the connection.");
    }
    await refresh();
  }, [employeeId, refresh]);

  function onSendInput() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    void sendToEmployee(text);
  }

  const { folders, looseWorkEvents } = useMemo(() => groupByJob(res), [res]);
  const needsYou = looseWorkEvents.filter((e) => e.work_event_descriptor?.move !== "notify");
  const fyi = looseWorkEvents.filter((e) => e.work_event_descriptor?.move === "notify");
  const workApprovalIds = new Set(looseWorkEvents.map((e) => e.work_event_descriptor?.deliverable?.refs.approval_id).filter(Boolean));
  const standaloneApprovals = res.approvals.filter((a) => !workApprovalIds.has(a.id));

  return (
    <main style={{ maxWidth: 760, margin: "5vh auto", padding: tokens.space.xl, fontFamily: tokens.font.family, color: tokens.color.text, background: tokens.color.bg }}>
      <header style={{ marginBottom: tokens.space.lg }}>
        <h1 style={{ margin: 0, fontSize: tokens.font.h1 }}>Your employee</h1>
        <p style={{ margin: `${tokens.space.xs}px 0 0`, color: tokens.color.textMuted, fontSize: tokens.font.small }}>
          Here to give you your evenings back — you approve, it does the work.
        </p>
      </header>

      <DailyBrief approvals={res.approvals} reminders={res.reminders} workEvents={res.work_events} invoices={res.stripe_invoices} />

      {(standaloneApprovals.length > 0 || needsYou.length > 0) ? (
        <Section title="Needs you">
          {standaloneApprovals.map((a) => <ApprovalCard key={a.id} approval={a} onResolve={resolveApproval} />)}
          {needsYou.map((e) => e.work_event_descriptor ? (
            <WorkCard key={e.id} descriptor={e.work_event_descriptor} employeeId={employeeId} onRespond={sendToEmployee} onResolve={resolveApproval} />
          ) : null)}
        </Section>
      ) : null}

      {folders.length > 0 ? (
        <Section title="Your jobs">
          {folders.map((f) => <JobFolder key={f.key} folder={f} employeeId={employeeId} />)}
        </Section>
      ) : null}

      {fyi.length > 0 ? (
        <Section title="Handled — just so you know">
          {fyi.map((e) => e.work_event_descriptor ? (
            <WorkCard key={e.id} descriptor={e.work_event_descriptor} employeeId={employeeId} onRespond={sendToEmployee} onResolve={resolveApproval} />
          ) : null)}
        </Section>
      ) : null}

      <Section title="Talk to your employee">
        <div style={{ borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.surface, padding: tokens.space.lg }}>
          {chat.length === 0 ? (
            <p style={{ margin: 0, color: tokens.color.textMuted, fontSize: tokens.font.small }}>Ask for an estimate, a follow-up, or anything else — like texting a great office manager.</p>
          ) : chat.map((m, i) => (
            <p key={i} style={{ margin: `${tokens.space.xs}px 0`, fontSize: tokens.font.body }}>
              <strong style={{ color: m.role === "owner" ? tokens.color.text : tokens.color.accent }}>{m.role === "owner" ? "You" : "Employee"}:</strong> {m.body}
            </p>
          ))}
          <div style={{ display: "flex", gap: tokens.space.sm, marginTop: tokens.space.md }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSendInput(); }}
              placeholder="Text your employee…"
              style={{ flex: 1, padding: `${tokens.space.sm}px ${tokens.space.md}px`, border: `1px solid ${tokens.color.borderStrong}`, borderRadius: tokens.radius.sm, fontSize: tokens.font.body }}
            />
            <button onClick={onSendInput} style={{ background: tokens.color.accent, color: "#fff", border: "none", borderRadius: tokens.radius.sm, padding: `${tokens.space.sm}px ${tokens.space.lg}px`, fontSize: tokens.font.body, cursor: "pointer" }}>Send</button>
          </div>
        </div>
      </Section>

      <Section title="Your tools">
        <div style={{ display: "flex", alignItems: "center", gap: tokens.space.md, flexWrap: "wrap" }}>
          {res.connectors.some((c) => c.provider === "gmail" && c.status === "connected") ? (
            <span style={{ fontSize: tokens.font.small, color: tokens.color.success }}>Gmail connected</span>
          ) : (
            <button onClick={() => void startConnector("gmail")} style={{ background: tokens.color.accent, color: "#fff", border: "none", borderRadius: tokens.radius.sm, padding: `${tokens.space.sm}px ${tokens.space.md}px`, fontSize: tokens.font.small, cursor: "pointer" }}>
              Connect Gmail
            </button>
          )}
          {res.connectors.length > 0 ? (
            <span style={{ fontSize: tokens.font.tiny, color: tokens.color.textFaint }}>
              {res.connectors.map((c) => `${c.provider} ${c.status}`).join(" · ")}
            </span>
          ) : null}
        </div>
      </Section>

      {status ? <p style={{ marginTop: tokens.space.md, fontSize: tokens.font.small, color: tokens.color.textMuted }}>{status}</p> : null}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: tokens.space.xxl }}>
      <h2 style={{ margin: `0 0 ${tokens.space.md}px`, fontSize: tokens.font.h2 }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: tokens.space.md }}>{children}</div>
    </section>
  );
}

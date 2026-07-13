"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import type { ResourcePayload, WorkEventRow } from "./surface-types";
import { groupByJob } from "./lib/group-by-job";
import {
  defaultSelection,
  labelStatus,
  labelConnector,
  navCounts,
  previewItem,
  selectionForResurface,
  statusTone,
  type PreviewSelection,
  type SurfaceView,
} from "./lib/surface-model";
import { tokens } from "./surface.tokens";
import { DailyBrief } from "./components/DailyBrief";
import { FirstRun } from "./components/FirstRun";
import { ApprovalCard } from "./components/ApprovalCard";
import { WorkCard } from "./components/WorkCard";
import { JobFolder } from "./components/JobFolder";
import { fixtureResourcePayload } from "./fixtures";

const EMPTY: ResourcePayload = {
  account_id: "",
  employee_id: "",
  artifacts: [],
  approvals: [],
  messages: [],
  connectors: [],
  stripe_invoices: [],
  reminders: [],
  job_commitments: [],
  work_events: [],
  abilities: [],
  outputs: [],
  tasks: [],
  connection_surfaces: [],
  resurface_items: [],
};

const NAV: Array<{ id: SurfaceView; label: string }> = [
  { id: "today", label: "Today" },
  { id: "chat", label: "Chat" },
  { id: "jobs", label: "Jobs" },
  { id: "tasks", label: "Tasks" },
  { id: "outputs", label: "Outputs" },
  { id: "connected", label: "Connected" },
  { id: "abilities", label: "Abilities" },
  { id: "activity", label: "Activity" },
  { id: "settings", label: "Settings" },
];

type PendingMessage = { id: string; role: "owner" | "employee"; body: string; status: "sending" | "failed" };

const UI_FIXTURE_MODE = process.env.NEXT_PUBLIC_AMTECH_UI_FIXTURES === "1";

export function AgentClient({ employeeId }: { employeeId: string }) {
  const [res, setRes] = useState<ResourcePayload>(() => (UI_FIXTURE_MODE ? fixtureResourcePayload(employeeId) : EMPTY));
  const [active, setActive] = useState<SurfaceView>("today");
  const [selected, setSelected] = useState<PreviewSelection | null>(null);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(!UI_FIXTURE_MODE);
  const [streamState, setStreamState] = useState<"connecting" | "live" | "reconnecting" | "offline">(UI_FIXTURE_MODE ? "live" : "connecting");
  const [progress, setProgress] = useState<{ run_id: string; verb: string; state: string } | null>(null);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  // Hydration marker: the kicker reads "Starting" until React is interactive, so
  // both owners and browser checks only see "Work Surface" once clicks actually work.
  const [interactive, setInteractive] = useState(false);
  useEffect(() => { setInteractive(true); }, []);

  const refresh = useCallback(async () => {
    if (UI_FIXTURE_MODE) {
      setRes((current) => {
        const next = current.account_id ? current : fixtureResourcePayload(employeeId);
        setSelected((selection) => selection ?? defaultSelection(next));
        return next;
      });
      setStreamState("live");
      setLoading(false);
      return;
    }
    const r = await fetch(`/api/employee/${employeeId}/resources`, { method: "POST" });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) {
      setStatus(ownerError(json.error ?? "Could not load your work."));
      setStreamState("offline");
      setLoading(false);
      return;
    }
    const next = { ...EMPTY, ...json };
    setRes(next);
    setSelected((current) => current ?? defaultSelection(next));
    setLoading(false);
  }, [employeeId]);

  const mergeWorkEvent = useCallback((ev: WorkEventRow) => {
    setRes((prev) => {
      const others = prev.work_events.filter((w) => w.id !== ev.id);
      return { ...prev, work_events: [ev, ...others] };
    });
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (UI_FIXTURE_MODE) return;
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
    if (UI_FIXTURE_MODE) return;
    let es: EventSource | null = null;
    let closed = false;
    let backoff = 1000;

    function connect() {
      if (closed) return;
      setStreamState((s) => (s === "offline" ? "reconnecting" : "connecting"));
      es = new EventSource(`/api/employee/${employeeId}/events`);
      es.addEventListener("open", () => {
        setStreamState("live");
        backoff = 1000;
      });
      es.addEventListener("snapshot", (event) => {
        try {
          const json = JSON.parse((event as MessageEvent).data);
          const snap = json?.snapshot ?? json;
          if (snap?.account_id) {
            const next = { ...EMPTY, ...snap };
            setRes(next);
            setSelected((current) => current ?? defaultSelection(next));
            setStreamState("live");
            backoff = 1000;
          }
        } catch { /* poll remains the fallback */ }
      });
      es.addEventListener("work_event", (event) => {
        try {
          const json = JSON.parse((event as MessageEvent).data);
          if (json?.event?.id) mergeWorkEvent(json.event);
        } catch { /* ignore malformed stream chunks */ }
      });
      es.addEventListener("work_progress", (event) => {
        try {
          const json = JSON.parse((event as MessageEvent).data);
          if (json?.verb) setProgress({ run_id: json.run_id, verb: json.verb, state: json.state });
          if (json?.state === "completed") window.setTimeout(() => setProgress(null), 1500);
        } catch { /* ignore malformed stream chunks */ }
      });
      es.addEventListener("approval_update", () => { void refresh(); });
      es.onerror = () => {
        es?.close();
        if (closed) return;
        setStreamState("reconnecting");
        window.setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, 15000);
      };
    }
    connect();
    const pollTimer = window.setInterval(() => { void refresh(); }, 20000);
    return () => { closed = true; es?.close(); window.clearInterval(pollTimer); };
  }, [employeeId, refresh, mergeWorkEvent]);

  const sendToEmployee = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (UI_FIXTURE_MODE) {
      const created = new Date().toISOString();
      setRes((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: `fixture_owner_${Date.now()}`, direction: "from_owner", source: "web", channel: "web", body: trimmed, status: "delivered", created_at: created },
          {
            id: `fixture_employee_${Date.now()}`,
            direction: "to_owner",
            source: "employee",
            channel: "web",
            body: "UI fixture reply: I added that note to the work queue. In the real app this would go through Manager and the employee runtime.",
            status: "delivered",
            provider_id: "fixture",
            created_at: created,
          },
        ],
      }));
      setStatus("UI fixture mode: message simulated locally.");
      setActive("chat");
      return;
    }
    const pendingId = `pending:${Date.now()}`;
    setPending((p) => [...p, { id: pendingId, role: "owner", body: trimmed, status: "sending" }]);
    const r = await fetch(`/api/employee/${employeeId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed }),
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) {
      setPending((p) => p.map((m) => (m.id === pendingId ? { ...m, status: "failed" } : m)));
      setStatus(ownerError(json.error ?? "Message failed."));
      return;
    }
    setPending((p) => p.filter((m) => m.id !== pendingId));
    if (json.reply && !res.messages.some((m) => m.body === json.reply)) {
      setPending((p) => [...p, { id: `reply:${Date.now()}`, role: "employee", body: json.reply, status: "sending" }]);
      window.setTimeout(() => setPending((p) => p.filter((m) => !m.id.startsWith("reply:"))), 2500);
    }
    await refresh();
  }, [employeeId, refresh, res.messages]);

  const resolveApproval = useCallback(async (approvalId: string, response: "approved" | "rejected") => {
    if (UI_FIXTURE_MODE) {
      setRes((prev) => ({
        ...prev,
        approvals: prev.approvals.filter((a) => a.id !== approvalId),
        tasks: (prev.tasks ?? []).map((task) => task.target_id === approvalId ? { ...task, status: response === "approved" ? "done" : "blocked", summary: `${response === "approved" ? "Approved" : "Rejected"} in UI fixture mode.` } : task),
        work_events: [
          {
            id: `fixture_resolution_${Date.now()}`,
            event_type: "ui_fixture.approval_resolved",
            status: response,
            created_at: new Date().toISOString(),
            work_event_descriptor: {
              account_id: prev.account_id,
              employee_id: prev.employee_id ?? employeeId,
              move: "notify",
              title: response === "approved" ? "Approval simulated" : "Change request simulated",
              summary: response === "approved" ? "The fixture approval was marked approved locally." : "The fixture approval was marked not yet locally.",
              deliverable: { type: "recommendation", title: "Fixture approval result", refs: { approval_id: approvalId }, acceptance: ["acknowledge"] },
              proof: { fixture: "ui_only" },
            },
          },
          ...prev.work_events,
        ],
      }));
      setStatus(response === "approved" ? "UI fixture mode: approved locally." : "UI fixture mode: rejected locally.");
      return;
    }
    if (!res.account_id) { setStatus("Account context is missing."); return; }
    const r = await fetch(`/api/employee/${employeeId}/approval/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_id: res.account_id, approval_id: approvalId, owner_response: response }),
    });
    const json = await r.json().catch(() => ({}));
    setStatus(json.user_facing_summary_hint ?? ownerError(json.error ?? "Updated."));
    await refresh();
  }, [employeeId, res.account_id, refresh]);

  function onSendInput() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    void sendToEmployee(text);
  }

  const grouped = useMemo(() => groupByJob(res), [res]);
  const counts = useMemo(() => navCounts(res), [res]);
  const preview = useMemo(() => previewItem(res, selected), [res, selected]);
  const urgentTasks = (res.tasks ?? []).filter((t) => t.status === "needs_you" || t.status === "blocked" || t.status === "failed");
  const resurfaceItems = (res.resurface_items ?? []).filter((item) => item.status === "needs_you" || item.status === "blocked" || item.status === "failed");
  const recentEvents = res.work_events.slice(0, 8);
  const displayMessages = [
    ...res.messages.map((m) => ({ id: m.id, role: m.direction === "to_owner" ? "employee" as const : "owner" as const, body: m.body, status: m.status })),
    ...pending,
  ];

  return (
    <main className="ws-root">
      <style>{WORK_SURFACE_CSS}</style>
      <aside className="ws-rail" aria-label="Employee sections">
        <div className="ws-brand">
          <p className="ws-logo">AMTECH<span aria-hidden>.</span></p>
          <strong>{res.employee?.name ?? "Employee"}</strong>
          <span className="ws-emp-status">{res.employee?.status ?? "loading"}</span>
        </div>
        <nav className="ws-nav">
          {NAV.map((item) => (
            <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => setActive(item.id)}>
              <span>{item.label}</span>
              {counts[item.id] ? <b>{counts[item.id]}</b> : null}
            </button>
          ))}
        </nav>
        <HealthBlock health={res.runtime_health ?? null} streamState={streamState} />
      </aside>

      <section className="ws-main" aria-busy={loading}>
        <header className="ws-topbar">
          <div>
            <p className="ws-kicker">{interactive ? "Work Surface" : "Starting"}</p>
            <h1>{titleForView(active)}</h1>
          </div>
          <div className="ws-status-row">
            {UI_FIXTURE_MODE ? <Pill tone="quiet" label="fixture data" /> : null}
            {progress ? <Pill tone="warn" label={`${progress.verb}...`} /> : null}
            <Pill tone={streamState === "live" ? "good" : streamState === "offline" ? "bad" : "warn"} label={streamLabel(streamState)} />
          </div>
        </header>

        {status ? <div className="ws-banner">{status}</div> : null}

        <div className="ws-view">
          {loading ? <EmptyState title="Loading your employee" body="Getting the latest work, outputs, and decisions." /> : null}
          {!loading && active === "today" ? (
            <TodayView
              res={res}
              resurfaceItems={resurfaceItems}
              urgentTasks={urgentTasks}
              recentEvents={recentEvents}
              onSelect={setSelected}
              onRespond={sendToEmployee}
              onResolve={resolveApproval}
              employeeId={employeeId}
            />
          ) : null}
          {!loading && active === "chat" ? (
            <ChatView messages={displayMessages} input={input} setInput={setInput} onSend={onSendInput} onSelect={setSelected} />
          ) : null}
          {!loading && active === "jobs" ? (
            <ListShell emptyTitle="No jobs yet" emptyBody="Jobs will collect estimates, replies, invoices, reminders, and proof in one place.">
              {grouped.folders.map((f) => (
                <div key={f.key} className="ws-card-wrap">
                  <button className="ws-preview-action" onClick={() => setSelected({ kind: "job", id: f.key })}>Open in preview</button>
                  <JobFolder folder={f} employeeId={employeeId} />
                </div>
              ))}
            </ListShell>
          ) : null}
          {!loading && active === "tasks" ? <TaskList res={res} onSelect={setSelected} /> : null}
          {!loading && active === "outputs" ? <OutputList res={res} onSelect={setSelected} /> : null}
          {!loading && active === "connected" ? <ConnectorList res={res} onSelect={setSelected} /> : null}
          {!loading && active === "abilities" ? <AbilityList res={res} onSelect={setSelected} /> : null}
          {!loading && active === "activity" ? (
            <ActivityList res={res} employeeId={employeeId} onSelect={setSelected} onRespond={sendToEmployee} onResolve={resolveApproval} />
          ) : null}
          {!loading && active === "settings" ? <SettingsLite res={res} /> : null}
        </div>
      </section>

      <aside className={selected ? "ws-preview open" : "ws-preview"} aria-label="Selected work preview">
        <PreviewPane
          employeeId={employeeId}
          res={res}
          preview={preview}
          selection={selected}
          onSelect={setSelected}
          onClose={() => setSelected(null)}
          onRespond={sendToEmployee}
          onResolve={resolveApproval}
        />
      </aside>
    </main>
  );
}

function TodayView({
  res,
  resurfaceItems,
  urgentTasks,
  recentEvents,
  onSelect,
  onRespond,
  onResolve,
  employeeId,
}: {
  res: ResourcePayload;
  resurfaceItems: NonNullable<ResourcePayload["resurface_items"]>;
  urgentTasks: NonNullable<ResourcePayload["tasks"]>;
  recentEvents: WorkEventRow[];
  onSelect: (selection: PreviewSelection) => void;
  onRespond: (text: string) => void;
  onResolve: (approvalId: string, response: "approved" | "rejected") => Promise<void> | void;
  employeeId: string;
}) {
  const resurfacedApprovalIds = new Set(resurfaceItems.flatMap((item) => item.target?.kind === "approval" ? [item.target.id] : []));
  const standaloneApprovals = res.approvals.filter((approval) => !resurfacedApprovalIds.has(approval.id)).slice(0, 3);

  // First-run: a set-up employee with no work, connections, or activity yet.
  const hasWork = res.work_events.length > 0 || (res.outputs?.length ?? 0) > 0 || (res.tasks?.length ?? 0) > 0 || res.approvals.length > 0;
  const hasConnections = (res.connection_surfaces?.length ?? 0) > 0 || res.connectors.length > 0;
  if (res.employee && !hasWork && !hasConnections) {
    return <FirstRun employeeId={employeeId} employeeName={res.employee.name} />;
  }

  return (
    <>
      <DailyBrief approvals={res.approvals} reminders={res.reminders} workEvents={res.work_events} invoices={res.stripe_invoices} resurfaceItems={res.resurface_items ?? []} />
      <div className="ws-grid two">
        <Panel title="Needs attention" empty={!resurfaceItems.length && !urgentTasks.length && !standaloneApprovals.length} emptyText="Nothing needs a decision right now.">
          {resurfaceItems.slice(0, 5).map((item) => <ResurfaceRow key={item.id} item={item} onSelect={onSelect} />)}
          {standaloneApprovals.map((a) => (
            <button key={a.id} className="ws-row" onClick={() => onSelect({ kind: "approval", id: a.id })}>
              <span>Decision needed</span>
              <strong>{a.summary}</strong>
              <Pill tone="warn" label={labelStatus(a.risk_level || "review")} />
            </button>
          ))}
          {urgentTasks.slice(0, 5).map((t) => <TaskRow key={t.id} task={t} onSelect={onSelect} />)}
        </Panel>
        <Panel title="Recent work" empty={!recentEvents.length} emptyText="Employee activity will appear here as work happens.">
          {recentEvents.map((e) => e.work_event_descriptor ? (
            <WorkCard key={e.id} descriptor={e.work_event_descriptor} employeeId={employeeId} onRespond={onRespond} onResolve={onResolve} />
          ) : null)}
        </Panel>
      </div>
    </>
  );
}

function ChatView({
  messages,
  input,
  setInput,
  onSend,
  onSelect,
}: {
  messages: Array<{ id: string; role: "owner" | "employee"; body: string; status: string }>;
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onSelect: (selection: PreviewSelection) => void;
}) {
  return (
    <section className="ws-chat">
      <div className="ws-thread">
        {!messages.length ? (
          <EmptyState title="Start with the work" body="Ask for an estimate, a follow-up, a draft, a reminder, or the next best step." />
        ) : messages.map((m) => (
          <button key={m.id} className={`ws-message ${m.role}`} onClick={() => onSelect({ kind: "message", id: m.id })}>
            <span>{m.role === "owner" ? "You" : "Employee"}</span>
            <p>{m.body}</p>
            {m.status !== "sent" && m.status !== "delivered" ? <small>{m.status}</small> : null}
          </button>
        ))}
      </div>
      <Composer input={input} setInput={setInput} onSend={onSend} />
    </section>
  );
}

function TaskList({ res, onSelect }: { res: ResourcePayload; onSelect: (selection: PreviewSelection) => void }) {
  return (
    <ListShell emptyTitle="No open tasks" emptyBody="Approvals, questions, reminders, and blocked work will appear here.">
      {(res.tasks ?? []).map((task) => <TaskRow key={task.id} task={task} onSelect={onSelect} />)}
    </ListShell>
  );
}

function OutputList({ res, onSelect }: { res: ResourcePayload; onSelect: (selection: PreviewSelection) => void }) {
  return (
    <ListShell emptyTitle="No outputs yet" emptyBody="Artifacts, invoices, message receipts, and generic resources will collect here.">
      {(res.outputs ?? []).map((output) => (
        <button key={output.id} className="ws-row" onClick={() => onSelect({ kind: "output", id: output.id })}>
          <span>{output.type}</span>
          <strong>{output.title}</strong>
          {output.summary ? <p>{output.summary}</p> : null}
          <Pill tone={statusTone(output.status)} label={labelStatus(output.status)} />
        </button>
      ))}
    </ListShell>
  );
}

function ConnectorList({ res, onSelect }: { res: ResourcePayload; onSelect: (selection: PreviewSelection) => void }) {
  const connections = res.connection_surfaces ?? [];
  return (
    <ListShell emptyTitle="No connected systems yet" emptyBody="Email, payments, files, calendar, store, and other connected work will appear here.">
      {connections.map((c) => (
        <button key={c.id} className="ws-row" onClick={() => onSelect({ kind: "connection", id: c.id })}>
          <span>{c.category}</span>
          <strong>{c.label}</strong>
          <p>{c.account_label ?? c.health ?? c.what_employee_can_do}</p>
          <Pill tone={statusTone(c.state)} label={labelStatus(c.state)} />
        </button>
      ))}
      {!connections.length ? res.connectors.map((c) => (
        <button key={c.id} className="ws-row" onClick={() => onSelect({ kind: "connector", id: c.id })}>
          <span>Connection</span>
          <strong>{labelConnector(c.provider)}</strong>
          <p>{c.external_email ?? c.last_error ?? "Ready to connect when needed."}</p>
          <Pill tone={statusTone(c.status)} label={labelStatus(c.status)} />
        </button>
      )) : null}
    </ListShell>
  );
}

function AbilityList({ res, onSelect }: { res: ResourcePayload; onSelect: (selection: PreviewSelection) => void }) {
  return (
    <ListShell emptyTitle="Abilities are still loading" emptyBody="The employee's abilities will be summarized from Manager, connectors, policy, and runtime health.">
      {(res.abilities ?? []).map((ability) => (
        <button key={ability.id} className="ws-row" onClick={() => onSelect({ kind: "ability", id: ability.id })}>
          <span>{ability.category}</span>
          <strong>{ability.label}</strong>
          <p>{ability.summary}</p>
          <Pill tone={statusTone(ability.status)} label={labelStatus(ability.status)} />
        </button>
      ))}
    </ListShell>
  );
}

function ActivityList({
  res,
  employeeId,
  onSelect,
  onRespond,
  onResolve,
}: {
  res: ResourcePayload;
  employeeId: string;
  onSelect: (selection: PreviewSelection) => void;
  onRespond: (text: string) => void;
  onResolve: (approvalId: string, response: "approved" | "rejected") => Promise<void> | void;
}) {
  return (
    <ListShell emptyTitle="No activity yet" emptyBody="Provider events, work progress, receipts, and employee notices will appear here.">
      {res.work_events.map((e) => (
        <div key={e.id} className="ws-card-wrap">
          <button className="ws-preview-action" onClick={() => onSelect({ kind: "work_event", id: e.id })}>Open in preview</button>
          {e.work_event_descriptor ? (
            <WorkCard descriptor={e.work_event_descriptor} employeeId={employeeId} onRespond={onRespond} onResolve={onResolve} />
          ) : (
            <button className="ws-row" onClick={() => onSelect({ kind: "work_event", id: e.id })}>
              <strong>{e.event_type}</strong>
              <Pill tone={statusTone(e.status)} label={labelStatus(e.status)} />
            </button>
          )}
        </div>
      ))}
    </ListShell>
  );
}

function SettingsLite({ res }: { res: ResourcePayload }) {
  return (
    <div className="ws-grid two">
      <Panel title="Employee" empty={!res.employee} emptyText="Employee profile is not loaded yet.">
        <KeyValue label="Name" value={res.employee?.name} />
        <KeyValue label="Status" value={labelStatus(res.employee?.status)} />
        <KeyValue label="Setup" value={res.employee?.profile_id ? "Profile is installed" : undefined} />
      </Panel>
      <Panel title="Runtime" empty={!res.runtime_health} emptyText="Runtime health has not been checked yet.">
        <KeyValue label="Health" value={labelStatus(res.runtime_health?.status)} />
        <KeyValue label="Checked" value={res.runtime_health?.checked_at ?? undefined} />
        <p className="ws-muted">{res.runtime_health?.message}</p>
      </Panel>
    </div>
  );
}

function PreviewPane({
  employeeId,
  res,
  preview,
  selection,
  onSelect,
  onClose,
  onRespond,
  onResolve,
}: {
  employeeId: string;
  res: ResourcePayload;
  preview: ReturnType<typeof previewItem>;
  selection: PreviewSelection | null;
  onSelect: (selection: PreviewSelection) => void;
  onClose: () => void;
  onRespond: (text: string) => void;
  onResolve: (approvalId: string, response: "approved" | "rejected") => Promise<void> | void;
}) {
  if (!preview || !selection) {
    return <EmptyState title="Select work" body="Open an approval, output, task, connection, or activity item to inspect it here." />;
  }
  const approval = selection.kind === "approval" ? res.approvals.find((a) => a.id === selection.id) : null;
  const event = selection.kind === "work_event" ? res.work_events.find((e) => e.id === selection.id) : null;
  const output = selection.kind === "output" ? (res.outputs ?? []).find((o) => o.id === selection.id) : null;
  const task = selection.kind === "task" ? (res.tasks ?? []).find((t) => t.id === selection.id) : null;
  const connection = selection.kind === "connection" ? (res.connection_surfaces ?? []).find((c) => c.id === selection.id) : null;
  const connector = selection.kind === "connector" ? res.connectors.find((c) => c.id === selection.id) : null;
  const ability = selection.kind === "ability" ? (res.abilities ?? []).find((a) => a.id === selection.id) : null;
  const message = selection.kind === "message" ? res.messages.find((m) => m.id === selection.id) : null;
  const job = selection.kind === "job" ? groupByJob(res).folders.find((f) => f.key === selection.id) : null;

  return (
    <div className="ws-preview-inner">
      <button className="ws-preview-close" onClick={onClose} aria-label="Close preview">Close ✕</button>
      <p className="ws-kicker">{preview.eyebrow}</p>
      <h2>{preview.title}</h2>
      {preview.summary ? <p className="ws-muted">{preview.summary}</p> : null}
      {preview.status ? <Pill tone={statusTone(preview.status)} label={labelStatus(preview.status)} /> : null}

      <div className="ws-preview-body">
        {approval ? <ApprovalCard approval={approval} onResolve={onResolve} /> : null}
        {event?.work_event_descriptor ? <WorkCard descriptor={event.work_event_descriptor} employeeId={employeeId} onRespond={onRespond} onResolve={onResolve} /> : null}
        {output ? <OutputPreview output={output} /> : null}
        {task ? <TaskDetails task={task} onSelect={onSelect} /> : null}
        {connection ? <ConnectionDetails connection={connection} /> : null}
        {connector ? <ConnectorDetails connector={connector} /> : null}
        {ability ? <AbilityDetails ability={ability} /> : null}
        {message ? <MessageDetails message={message} /> : null}
        {job ? <JobFolder folder={job} employeeId={employeeId} /> : null}
      </div>
    </div>
  );
}

function ConnectionDetails({ connection }: { connection: NonNullable<ResourcePayload["connection_surfaces"]>[number] }) {
  return (
    <div className="ws-detail">
      <KeyValue label="Connection" value={connection.label} />
      <KeyValue label="Status" value={labelStatus(connection.state)} />
      <KeyValue label="Account" value={connection.account_label ?? undefined} />
      <KeyValue label="Last event" value={connection.last_event ?? undefined} />
      <KeyValue label="Last action" value={connection.last_action ?? undefined} />
      <p>{connection.what_employee_can_do}</p>
      {connection.setup_requirement ? <p className="ws-muted">{connection.setup_requirement}</p> : null}
    </div>
  );
}

function OutputPreview({ output }: { output: NonNullable<ResourcePayload["outputs"]>[number] }) {
  return (
    <div className="ws-detail">
      <KeyValue label="Type" value={output.type} />
      <KeyValue label="Status" value={labelStatus(output.status)} />
      {output.summary ? <p>{output.summary}</p> : null}
      {output.href ? <a className="ws-link" href={output.href} target="_blank" rel="noreferrer">Open output</a> : null}
    </div>
  );
}

function TaskDetails({ task, onSelect }: { task: NonNullable<ResourcePayload["tasks"]>[number]; onSelect: (selection: PreviewSelection) => void }) {
  return (
    <div className="ws-detail">
      <KeyValue label="Status" value={labelStatus(task.status)} />
      {task.summary ? <p>{task.summary}</p> : null}
      {task.type === "approval" && task.target_id ? <button className="ws-primary" onClick={() => onSelect({ kind: "approval", id: task.target_id! })}>Review approval</button> : null}
    </div>
  );
}

function ConnectorDetails({ connector }: { connector: ResourcePayload["connectors"][number] }) {
  return (
    <div className="ws-detail">
      <KeyValue label="Connection" value={labelConnector(connector.provider)} />
      <KeyValue label="Status" value={labelStatus(connector.status)} />
      <KeyValue label="Account" value={connector.external_email ?? undefined} />
      {connector.last_error ? <p>{connector.last_error}</p> : <p className="ws-muted">No repair action is needed from this surface right now.</p>}
    </div>
  );
}

function AbilityDetails({ ability }: { ability: NonNullable<ResourcePayload["abilities"]>[number] }) {
  return (
    <div className="ws-detail">
      <KeyValue label="Category" value={ability.category} />
      <KeyValue label="Status" value={labelStatus(ability.status)} />
      <p>{ability.summary}</p>
    </div>
  );
}

function MessageDetails({ message }: { message: ResourcePayload["messages"][number] }) {
  return (
    <div className="ws-detail">
      <KeyValue label="Direction" value={message.direction === "to_owner" ? "Employee to owner" : "Owner to employee"} />
      <KeyValue label="Status" value={labelStatus(message.status)} />
      <p>{message.body}</p>
    </div>
  );
}

function TaskRow({ task, onSelect }: { task: NonNullable<ResourcePayload["tasks"]>[number]; onSelect: (selection: PreviewSelection) => void }) {
  return (
    <button className="ws-row" onClick={() => onSelect({ kind: "task", id: task.id })}>
      <span>{task.type}</span>
      <strong>{task.title}</strong>
      {task.summary ? <p>{task.summary}</p> : null}
      <Pill tone={statusTone(task.status)} label={labelStatus(task.status)} />
    </button>
  );
}

function ResurfaceRow({ item, onSelect }: { item: NonNullable<ResourcePayload["resurface_items"]>[number]; onSelect: (selection: PreviewSelection) => void }) {
  return (
    <button className="ws-row" onClick={() => onSelect(selectionForResurface(item))}>
      <span>{item.kind}</span>
      <strong>{item.title}</strong>
      <p>{item.why}</p>
      <Pill tone={statusTone(item.status)} label={labelStatus(item.status)} />
    </button>
  );
}

function Composer({ input, setInput, onSend }: { input: string; setInput: (value: string) => void; onSend: () => void }) {
  return (
    <div className="ws-composer">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
        placeholder="Text your employee..."
      />
      <button onClick={onSend}>Send</button>
    </div>
  );
}

function HealthBlock({ health, streamState }: { health: ResourcePayload["runtime_health"] | null; streamState: string }) {
  return (
    <div className="ws-health">
      <span>Employee status</span>
      <Pill tone={statusTone(health?.status ?? streamState)} label={labelStatus(health?.status ?? streamState)} />
      <p>{health?.message ?? "Waiting for the first runtime health check."}</p>
    </div>
  );
}

function Panel({ title, empty, emptyText, children }: { title: string; empty?: boolean; emptyText?: string; children: React.ReactNode }) {
  return (
    <section className="ws-panel">
      <h2>{title}</h2>
      {empty ? <p className="ws-muted">{emptyText}</p> : children}
    </section>
  );
}

function ListShell({ emptyTitle, emptyBody, children }: { emptyTitle: string; emptyBody: string; children: React.ReactNode }) {
  const list = Array.isArray(children) ? children.filter(Boolean) : children;
  const empty = Array.isArray(list) ? list.length === 0 : !list;
  return empty ? <EmptyState title={emptyTitle} body={emptyBody} /> : <div className="ws-list">{children}</div>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="ws-empty">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="ws-kv">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Pill({ tone, label }: { tone: "good" | "warn" | "bad" | "quiet"; label: string }) {
  return <span className={`ws-pill ${tone}`}>{label}</span>;
}

function titleForView(view: SurfaceView): string {
  if (view === "today") return "Today";
  if (view === "chat") return "Conversation";
  if (view === "connected") return "Connected systems";
  if (view === "settings") return "Employee settings";
  return view.charAt(0).toUpperCase() + view.slice(1);
}

function streamLabel(state: "connecting" | "live" | "reconnecting" | "offline"): string {
  if (state === "live") return "live";
  if (state === "reconnecting") return "reconnecting";
  if (state === "offline") return "offline";
  return "connecting";
}

function ownerError(code: string): string {
  if (code === "owner_session_invalid") return "Your session expired. Log in again to keep working.";
  if (code === "runtime_unreachable") return "Your employee is not reachable right now. Work is saved; retry after runtime health recovers.";
  return code.replace(/[_-]+/g, " ");
}

const WORK_SURFACE_CSS = `
  :root {
    --ws-ink: #0a0a0a;
    --ws-paper: #ffffff;
    --ws-wash: #f4f4f4;
    --ws-red: #e11d2a;
    --ws-red-bright: #ff1a2b;
    --ws-hair-5: rgba(10,10,10,0.05);
    --ws-hair: rgba(10,10,10,0.10);
    --ws-hair-strong: rgba(10,10,10,0.15);
    --ws-muted: rgba(10,10,10,0.62);
    --ws-font: var(--font-inter), Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif;
    --ws-mono: var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .ws-root { min-height: 100vh; display: grid; grid-template-columns: 240px minmax(0, 1fr) 360px; background: var(--ws-paper); color: var(--ws-ink); font-family: var(--ws-font); }
  .ws-rail { border-right: 1px solid var(--ws-hair); display: flex; flex-direction: column; min-height: 100vh; background: var(--ws-paper); }
  .ws-brand { padding: 18px; border-bottom: 1px solid var(--ws-hair); }
  .ws-logo { margin: 0 0 12px; font-family: var(--ws-mono); font-size: 12px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; }
  .ws-logo span { color: var(--ws-red); }
  .ws-brand strong { display: block; font-size: 18px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2; }
  .ws-emp-status { display: block; margin-top: 3px; font-family: var(--ws-mono); font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ws-muted); }
  .ws-nav { display: block; padding: 9px 0; }
  .ws-nav button { width: 100%; border: 0; border-left: 3px solid transparent; background: transparent; color: var(--ws-muted); text-align: left; padding: 6px 15px 6px 18px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-family: var(--ws-font); font-size: 15px; font-weight: 500; line-height: 24px; }
  .ws-nav button:hover { background: var(--ws-wash); color: var(--ws-ink); }
  .ws-nav button.active { border-left-color: var(--ws-red); background: var(--ws-wash); color: var(--ws-ink); font-weight: 600; }
  .ws-nav b { font-family: var(--ws-mono); font-size: 9px; font-weight: 500; color: var(--ws-muted); border: 1px solid var(--ws-hair-strong); padding: 0 6px; line-height: 16px; min-width: 18px; text-align: center; }
  .ws-nav button.active b { color: #ffffff; background: var(--ws-red); border-color: var(--ws-red); }
  .ws-health { margin-top: auto; border-top: 1px solid var(--ws-hair); padding: 18px; }
  .ws-health > span, .ws-kicker { display: block; font-family: var(--ws-mono); color: var(--ws-muted); font-size: 9px; text-transform: uppercase; letter-spacing: 0.09em; font-weight: 500; }
  .ws-health .ws-pill { margin-top: 6px; }
  .ws-health p, .ws-muted { color: var(--ws-muted); font-size: 12px; line-height: 1.5; }
  .ws-health p { margin-top: 6px; }
  .ws-main { min-width: 0; overflow: auto; max-height: 100vh; display: flex; flex-direction: column; }
  .ws-topbar { display: flex; justify-content: space-between; align-items: flex-end; gap: 18px; padding: 18px 24px 15px; border-bottom: 1px solid var(--ws-hair); }
  .ws-topbar h1 { margin: 3px 0 0; font-size: 24px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
  .ws-status-row { display: flex; flex-wrap: wrap; justify-content: flex-end; }
  .ws-status-row .ws-pill { margin-left: -1px; }
  .ws-banner { border-bottom: 1px solid var(--ws-hair); border-left: 3px solid var(--ws-red); background: var(--ws-paper); color: var(--ws-ink); padding: 9px 24px; font-size: 12px; }
  .ws-view { display: grid; gap: 18px; padding: 24px; align-content: start; }
  .ws-grid.two { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; align-items: start; }
  .ws-panel, .ws-empty, .ws-chat, .ws-preview-inner { border: 1px solid var(--ws-hair); background: var(--ws-paper); padding: 0; }
  .ws-panel h2 { margin: 0; padding: 9px 12px; font-family: var(--ws-mono); font-size: 9px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; border-bottom: 1px solid var(--ws-hair); }
  .ws-panel > .ws-muted { padding: 12px; }
  .ws-panel .ws-row, .ws-panel .ws-card-wrap { border-left: 0; border-right: 0; }
  .ws-panel .ws-row { border-top: 0; }
  .ws-panel .ws-card-wrap { padding: 12px; border-bottom: 1px solid var(--ws-hair-5); }
  .ws-panel .ws-card-wrap:last-child { border-bottom: 0; }
  .ws-list { display: block; border: 1px solid var(--ws-hair); background: var(--ws-paper); }
  .ws-list > .ws-card-wrap { padding: 12px; border-bottom: 1px solid var(--ws-hair); }
  .ws-list > .ws-card-wrap:last-child { border-bottom: 0; }
  .ws-row { width: 100%; border: 0; border-bottom: 1px solid var(--ws-hair); background: var(--ws-paper); padding: 12px; text-align: left; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 3px 12px; cursor: pointer; color: var(--ws-ink); font-family: var(--ws-font); }
  .ws-row:last-child { border-bottom: 0; }
  .ws-row:hover { background: var(--ws-wash); }
  .ws-row > span { grid-column: 1; font-family: var(--ws-mono); color: var(--ws-muted); font-size: 9px; text-transform: uppercase; letter-spacing: 0.09em; font-weight: 500; }
  .ws-row > strong { grid-column: 1; font-size: 15px; font-weight: 600; letter-spacing: -0.015em; }
  .ws-row > p { grid-column: 1; margin: 0; color: var(--ws-muted); font-size: 12px; line-height: 1.5; }
  .ws-row > .ws-pill { grid-column: 2; grid-row: 1 / span 3; align-self: center; }
  .ws-card-wrap { display: grid; gap: 6px; }
  .ws-preview-action { justify-self: start; border: 1px solid var(--ws-hair-strong); background: var(--ws-paper); color: var(--ws-muted); padding: 0 9px; font-family: var(--ws-mono); font-size: 9px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; line-height: 19px; height: 21px; cursor: pointer; }
  .ws-preview-action:hover { border-color: var(--ws-ink); color: var(--ws-ink); }
  .ws-chat { min-height: calc(100vh - 150px); display: grid; grid-template-rows: 1fr auto; }
  .ws-thread { overflow: auto; display: flex; flex-direction: column; gap: 12px; min-height: 320px; padding: 18px; }
  .ws-message { max-width: 76%; border: 1px solid var(--ws-hair); border-left: 3px solid var(--ws-hair-strong); padding: 9px 12px; text-align: left; background: var(--ws-paper); color: var(--ws-ink); cursor: pointer; font-family: var(--ws-font); }
  .ws-message.owner { align-self: flex-end; background: var(--ws-wash); border-left: 1px solid var(--ws-hair); }
  .ws-message span { font-family: var(--ws-mono); color: var(--ws-muted); font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; }
  .ws-message p { margin: 3px 0 0; font-size: 15px; line-height: 1.6; }
  .ws-message small { color: var(--ws-muted); font-family: var(--ws-mono); font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; }
  .ws-composer { display: grid; grid-template-columns: 1fr auto; border-top: 1px solid var(--ws-hair); background: var(--ws-paper); }
  .ws-composer input { border: 0; background: transparent; min-width: 0; padding: 15px 18px; font-size: 15px; outline: none; color: var(--ws-ink); font-family: var(--ws-font); }
  .ws-composer button, .ws-primary { border: 0; background: var(--ws-ink); color: #ffffff; padding: 0 24px; cursor: pointer; font-family: var(--ws-mono); font-size: 12px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; }
  .ws-composer button:hover, .ws-primary:hover { background: var(--ws-red-bright); }
  .ws-primary { padding: 9px 18px; justify-self: start; }
  .ws-preview { border-left: 1px solid var(--ws-hair); background: var(--ws-paper); max-height: 100vh; overflow: auto; }
  .ws-preview .ws-empty { border: 0; }
  .ws-preview-inner { border: 0; padding: 18px; position: relative; }
  .ws-preview-close { display: none; position: absolute; top: 12px; right: 12px; border: 1px solid var(--ws-hair-strong); background: var(--ws-paper); color: var(--ws-muted); padding: 0 9px; height: 24px; font-family: var(--ws-mono); font-size: 9px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; }
  .ws-preview-close:hover { border-color: var(--ws-ink); color: var(--ws-ink); }
  .ws-preview-inner .ws-kicker { color: var(--ws-red); }
  .ws-preview-inner h2 { margin: 3px 0 6px; font-size: 18px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2; }
  .ws-preview-body { display: grid; gap: 12px; margin-top: 12px; }
  .ws-detail { display: grid; gap: 9px; border-top: 1px solid var(--ws-hair); padding-top: 12px; }
  .ws-detail p { margin: 0; color: var(--ws-muted); font-size: 12px; line-height: 1.5; }
  .ws-kv { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; border-bottom: 1px solid var(--ws-hair-5); padding-bottom: 6px; }
  .ws-kv span { font-family: var(--ws-mono); color: var(--ws-muted); font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; line-height: 18px; }
  .ws-kv strong { text-align: right; font-weight: 600; }
  .ws-link { display: inline-block; color: var(--ws-red); font-family: var(--ws-mono); font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; text-decoration: underline; text-underline-offset: 3px; }
  .ws-link:hover { color: var(--ws-red-bright); }
  .ws-pill { width: max-content; border: 1px solid var(--ws-hair-strong); background: var(--ws-paper); color: var(--ws-ink); padding: 0 6px; font-family: var(--ws-mono); font-size: 9px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; line-height: 16px; height: 18px; display: inline-flex; align-items: center; }
  .ws-pill.good { color: var(--ws-ink); border-color: var(--ws-hair-strong); }
  .ws-pill.warn { color: var(--ws-red); border-color: var(--ws-red); }
  .ws-pill.bad { color: #ffffff; background: var(--ws-red); border-color: var(--ws-red); }
  .ws-pill.quiet { color: var(--ws-muted); border-color: var(--ws-hair); }
  .ws-empty { padding: 18px; }
  .ws-empty strong { display: block; font-size: 15px; font-weight: 600; letter-spacing: -0.015em; }
  .ws-empty p { margin: 6px 0 0; color: var(--ws-muted); font-size: 12px; line-height: 1.5; }
  @media (max-width: 1100px) {
    .ws-root { grid-template-columns: 210px minmax(0, 1fr); }
    .ws-preview { grid-column: 2; border-left: 0; border-top: 1px solid var(--ws-hair); max-height: none; }
  }
  @media (max-width: 760px) {
    .ws-root { display: block; }
    .ws-rail { position: sticky; top: 0; z-index: 2; min-height: 0; border-right: 0; border-bottom: 1px solid var(--ws-hair); }
    .ws-brand { padding: 12px 15px; border-bottom: 1px solid var(--ws-hair-5); }
    .ws-nav { display: flex; overflow-x: auto; padding: 0; background: var(--ws-paper); }
    .ws-nav button { white-space: nowrap; width: auto; border-left: 0; border-bottom: 3px solid transparent; padding: 9px 12px; gap: 6px; }
    .ws-nav button.active { border-bottom-color: var(--ws-red); background: var(--ws-paper); }
    .ws-health { display: none; }
    .ws-topbar { display: block; padding: 15px; }
    .ws-status-row { justify-content: flex-start; margin-top: 9px; }
    .ws-view { padding: 15px; gap: 15px; }
    .ws-chat { min-height: 70vh; }
    .ws-message { max-width: 92%; }
    /* Preview becomes a bottom sheet: hidden until work is selected, dismissed explicitly. */
    .ws-preview { display: none; }
    .ws-preview.open { display: block; position: fixed; left: 0; right: 0; bottom: 0; z-index: 9; max-height: 66vh; overflow: auto; border-left: 0; border-top: 3px solid var(--ws-ink); background: var(--ws-paper); padding-bottom: calc(9px + env(safe-area-inset-bottom)); }
    .ws-preview-close { display: inline-flex; align-items: center; }
  }
`;

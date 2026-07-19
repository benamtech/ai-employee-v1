"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ResourcePayload, WorkEventRow } from "./surface-types";
import type { SurfaceEnvelope, WorkAction, WorkResource } from "@amtech/shared";
import { fixtureResourcePayload } from "./fixtures";
import { WorkObjectRenderer } from "./components/WorkObjectRenderer";

type PrimaryView = "command" | "work" | "decisions" | "proof" | "connected";
type StreamState = "connecting" | "live" | "reconnecting" | "offline";
type Notice = { tone: "info" | "success" | "error"; text: string } | null;

interface Props {
  employeeId: string;
  fixtureMode: boolean;
}

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
  capabilities: [],
  surface_envelopes: [],
  connection_surfaces: [],
  resurface_items: [],
  outputs: [],
  tasks: [],
};

const VIEWS: Array<{ id: PrimaryView; label: string; description: string }> = [
  { id: "command", label: "Command", description: "Talk to your employee" },
  { id: "work", label: "Work", description: "Active and prepared work" },
  { id: "decisions", label: "Decisions", description: "What needs your say" },
  { id: "proof", label: "Proof", description: "Receipts and outcomes" },
  { id: "connected", label: "Connected", description: "Systems and readiness" },
];

export function AgentSurface({ employeeId, fixtureMode }: Props) {
  const [res, setRes] = useState<ResourcePayload>(() => fixtureMode ? fixtureResourcePayload(employeeId) : EMPTY);
  const [view, setView] = useState<PrimaryView>("work");
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(!fixtureMode);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState("");
  const [streamState, setStreamState] = useState<StreamState>(fixtureMode ? "live" : "connecting");
  const retryIntent = useRef<{ message: string; intentId: string } | null>(null);

  const refresh = useCallback(async () => {
    if (fixtureMode) {
      setRes(fixtureResourcePayload(employeeId));
      setLoading(false);
      setStreamState("live");
      return;
    }
    try {
      const response = await fetch(`/api/employee/${employeeId}/resources`, { method: "POST" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNotice({ tone: "error", text: ownerError(json.error ?? "Could not load this employee's work.") });
        setStreamState("offline");
        return;
      }
      setRes({ ...EMPTY, ...json });
      setNotice(null);
    } catch {
      setNotice({ tone: "error", text: "The work surface could not reach AMTECH. No message was resent." });
      setStreamState("offline");
    } finally {
      setLoading(false);
    }
  }, [employeeId, fixtureMode]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (fixtureMode) return;
    let source: EventSource | null = null;
    let closed = false;
    let reconnectDelay = 1000;

    function connect() {
      if (closed) return;
      setStreamState((current) => current === "offline" ? "reconnecting" : "connecting");
      source = new EventSource(`/api/employee/${employeeId}/events`);
      source.addEventListener("open", () => {
        reconnectDelay = 1000;
        setStreamState("live");
      });
      source.addEventListener("snapshot", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data);
          const snapshot = payload?.snapshot ?? payload;
          if (snapshot?.account_id) setRes({ ...EMPTY, ...snapshot });
          setStreamState("live");
        } catch {
          setNotice({ tone: "error", text: "AMTECH received an unreadable state update and requested a fresh snapshot." });
          void refresh();
        }
      });
      source.addEventListener("work_event", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data);
          const next = payload?.event as WorkEventRow | undefined;
          if (!next?.id) return;
          setRes((current) => ({
            ...current,
            work_events: [next, ...current.work_events.filter((item) => item.id !== next.id)],
          }));
        } catch {
          void refresh();
        }
      });
      source.addEventListener("work_progress", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data);
          const verb = typeof payload?.verb === "string" ? payload.verb : "Working";
          const state = typeof payload?.state === "string" ? payload.state : "working";
          setProgress(state === "completed" ? "" : verb);
          if (state === "completed") void refresh();
        } catch {
          setProgress("");
        }
      });
      source.addEventListener("approval_update", () => { void refresh(); });
      source.onerror = () => {
        source?.close();
        if (closed) return;
        setStreamState("reconnecting");
        window.setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 15000);
      };
    }

    connect();
    return () => {
      closed = true;
      source?.close();
    };
  }, [employeeId, fixtureMode, refresh]);

  const envelopes = res.surface_envelopes ?? [];
  const decisions = useMemo(() => envelopes.filter((envelope) =>
    envelope.kind === "approval" || envelope.safety.requires_approval || envelope.status === "needs_you" || envelope.status === "blocked",
  ), [envelopes]);
  const work = useMemo(() => envelopes.filter((envelope) =>
    !decisions.some((decision) => decision.id === envelope.id) && envelope.status !== "done" && envelope.status !== "failed",
  ), [decisions, envelopes]);
  const proof = useMemo(() => envelopes.filter((envelope) =>
    envelope.status === "done" || envelope.status === "failed" || hasProof(envelope),
  ), [envelopes]);

  async function sendMessage(messageOverride?: string) {
    const body = (messageOverride ?? input).trim();
    if (!body || sending) return;
    const previous = retryIntent.current;
    const intentId = previous?.message === body ? previous.intentId : createIntentId(employeeId);
    retryIntent.current = { message: body, intentId };
    setSending(true);
    setNotice({ tone: "info", text: "Starting this work with the exact employee and assignment shown above." });

    if (fixtureMode) {
      const now = new Date().toISOString();
      setRes((current) => ({
        ...current,
        messages: [
          ...current.messages,
          { id: `fixture-owner-${Date.now()}`, direction: "from_owner", body, status: "delivered", created_at: now },
          { id: `fixture-employee-${Date.now()}`, direction: "to_owner", body: "I picked that up. I will prepare the work, stop when your judgment is needed, and leave proof after any accepted action.", status: "delivered", created_at: now },
        ],
      }));
      setInput("");
      retryIntent.current = null;
      setSending(false);
      setNotice({ tone: "success", text: "Fixture demonstration only. No provider or customer action occurred." });
      return;
    }

    try {
      const response = await fetch(`/api/employee/${employeeId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: body, intent_id: intentId }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setInput(body);
        setNotice({ tone: "error", text: ownerError(json.error ?? "This turn was not accepted. Retry uses the same intent and will not create a second turn.") });
        return;
      }
      setInput("");
      retryIntent.current = null;
      setNotice({ tone: response.status === 202 ? "info" : "success", text: response.status === 202 ? "The turn started but is not terminal. AMTECH is reconciling it; do not resend." : "The turn was accepted. Work and proof will update here." });
      await refresh();
    } catch {
      setInput(body);
      setNotice({ tone: "error", text: "The connection ended before AMTECH could prove acceptance. Retry keeps the same intent; it does not create a second turn." });
    } finally {
      setSending(false);
    }
  }

  async function resolveApproval(approvalId: string, response: "approved" | "rejected") {
    if (!approvalId) return;
    setNotice({ tone: "info", text: response === "approved" ? "Submitting approval through the current assignment and policy." : "Recording the decline. The held action will not proceed." });
    const result = await fetch(`/api/employee/${employeeId}/approval/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approval_id: approvalId, owner_response: response }),
    });
    const json = await result.json().catch(() => ({}));
    setNotice(result.ok
      ? { tone: "success", text: json.user_facing_summary_hint ?? (response === "approved" ? "Approved. The employee can continue within this gate." : "Declined. The employee will not perform that action.") }
      : { tone: "error", text: ownerError(json.error ?? "The decision was not accepted.") });
    await refresh();
  }

  async function handleObjectAction(resource: WorkResource, action: WorkAction["action"], note?: string) {
    if ((action === "approve" || action === "reject") && resource.resource_type === "approval") {
      await resolveApproval(resource.resource_id, action === "approve" ? "approved" : "rejected");
      return;
    }
    if (action === "respond" || action === "edit") {
      await sendMessage(`${resource.title}: ${note ?? "Please revise this work."}`);
      return;
    }
    if (action === "acknowledge") {
      await sendMessage(`${resource.title}: acknowledged.`);
    }
  }

  const employeeName = res.employee?.name ?? "Avery";
  const activeDescription = VIEWS.find((item) => item.id === view)?.description ?? "";

  return (
    <main className="as-root">
      <style>{SURFACE_CSS}</style>
      <header className="as-header">
        <div className="as-identity">
          <a className="as-brand" href="/dashboard">AMTECH<span>.</span></a>
          <div>
            <strong>{employeeName}</strong>
            <span>{runtimeLabel(res, streamState)}</span>
          </div>
        </div>
        <div className="as-runtime" aria-label="Runtime identity">
          <span className={`as-dot ${streamState}`} aria-hidden />
          <span>{streamState === "live" ? "Connected" : streamState === "reconnecting" ? "Reconnecting without replay" : streamState}</span>
          <small>{res.employee_id ?? employeeId}</small>
        </div>
      </header>

      <div className="as-shell">
        <nav className="as-tabs" role="tablist" aria-label="Employee work planes">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={view === item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => setView(item.id)}
            >
              {item.label}
              {item.id === "decisions" && decisions.length ? <span>{decisions.length}</span> : null}
            </button>
          ))}
        </nav>

        <section className="as-heading">
          <div>
            <p>{activeDescription}</p>
            <h1>{VIEWS.find((item) => item.id === view)?.label}</h1>
          </div>
          {progress ? <div className="as-progress" aria-live="polite">{employeeName} is working: {progress}</div> : null}
        </section>

        {notice ? (
          <div className={`as-notice ${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
            <span>{notice.text}</span>
            {notice.tone === "error" ? <button type="button" onClick={() => void refresh()}>Refresh state</button> : null}
          </div>
        ) : null}

        {loading ? <QuietState title={`Loading ${employeeName}'s current state`} body="AMTECH is resolving the exact owner, assignment, runtime, and latest durable snapshot." /> : null}

        {!loading && view === "command" ? (
          <section className="as-command" role="tabpanel">
            <div className="as-messages" aria-live="polite">
              {res.messages.length ? res.messages.slice(-24).map((message) => (
                <article key={message.id} className={message.direction === "to_owner" ? "employee" : "owner"}>
                  <span>{message.direction === "to_owner" ? employeeName : "You"}</span>
                  <p>{message.body}</p>
                  <small>{message.status}</small>
                </article>
              )) : <QuietState title="Start with normal words" body="Describe the job, customer request, office task, or result. Durable work will move into Work, Decisions, and Proof." />}
            </div>
            <Composer employeeName={employeeName} value={input} setValue={setInput} sending={sending} onSend={() => void sendMessage()} />
          </section>
        ) : null}

        {!loading && view === "work" ? (
          <section className="as-grid" role="tabpanel">
            {work.length ? work.map((envelope) => <EnvelopeCard key={envelope.id} envelope={envelope} onAction={handleObjectAction} />) : null}
            {!work.length && (res.tasks ?? []).filter((task) => ["in_progress", "scheduled"].includes(task.status)).map((task) => (
              <article className="as-card" key={task.id}>
                <span className="as-eyebrow">{task.status}</span>
                <h2>{task.title}</h2>
                <p>{task.summary ?? "This work is active in the durable employee state."}</p>
              </article>
            ))}
            {!work.length && !(res.tasks ?? []).some((task) => ["in_progress", "scheduled"].includes(task.status)) ? <QuietState title="No active work" body="Give the employee a real task in Command. Prepared objects and current progress will appear here." /> : null}
          </section>
        ) : null}

        {!loading && view === "decisions" ? (
          <section className="as-grid" role="tabpanel">
            {decisions.map((envelope) => <EnvelopeCard key={envelope.id} envelope={envelope} onAction={handleObjectAction} />)}
            {!decisions.length && res.approvals.map((approval) => (
              <article className="as-card decision" key={approval.id}>
                <span className="as-eyebrow">Needs your say · {approval.risk_level}</span>
                <h2>{approval.summary}</h2>
                <p>The employee is holding this action until the current authorized owner decides.</p>
                <div className="as-actions">
                  <button className="primary" type="button" onClick={() => void resolveApproval(approval.id, "approved")}>Approve</button>
                  <button type="button" onClick={() => void resolveApproval(approval.id, "rejected")}>Decline</button>
                </div>
              </article>
            ))}
            {!decisions.length && !res.approvals.length ? <QuietState title="Nothing needs your say" body="Customer-facing, money-related, blocked, and judgment-heavy work will stop here before it proceeds." /> : null}
          </section>
        ) : null}

        {!loading && view === "proof" ? (
          <section className="as-proof" role="tabpanel">
            {proof.map((envelope) => <EnvelopeCard key={envelope.id} envelope={envelope} onAction={handleObjectAction} compact />)}
            {res.work_events.slice(0, 18).map((event) => (
              <article className="as-proof-row" key={event.id}>
                <span>{formatDate(event.created_at)}</span>
                <div>
                  <strong>{event.work_event_descriptor?.title ?? readable(event.event_type)}</strong>
                  <p>{event.work_event_descriptor?.summary ?? `Recorded as ${event.status}.`}</p>
                </div>
                <small>{Object.keys(event.work_event_descriptor?.proof ?? {}).length ? "Proof attached" : event.status}</small>
              </article>
            ))}
            {!proof.length && !res.work_events.length ? <QuietState title="No proof yet" body="Accepted sends, receipts, completed work, failures, and repair outcomes will settle here." /> : null}
          </section>
        ) : null}

        {!loading && view === "connected" ? (
          <section className="as-grid connections" role="tabpanel">
            {(res.connection_surfaces ?? []).map((connection) => (
              <article className="as-card" key={connection.id}>
                <span className="as-eyebrow">{readable(connection.state)}</span>
                <h2>{connection.label}</h2>
                <p>{connection.health ?? connection.what_employee_can_do}</p>
                <dl>
                  <div><dt>Can do</dt><dd>{connection.what_employee_can_do}</dd></div>
                  {connection.account_label ? <div><dt>Account</dt><dd>{connection.account_label}</dd></div> : null}
                  {connection.last_action ? <div><dt>Last action</dt><dd>{connection.last_action}</dd></div> : null}
                </dl>
              </article>
            ))}
            {!(res.connection_surfaces ?? []).length ? <QuietState title="No connected systems reported" body="Connections appear only when Manager can prove their current scope and health." /> : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function EnvelopeCard({ envelope, onAction, compact = false }: {
  envelope: SurfaceEnvelope;
  onAction: (resource: WorkResource, action: WorkAction["action"], note?: string) => Promise<void> | void;
  compact?: boolean;
}) {
  if (envelope.resource) {
    return (
      <div className="as-card resource">
        <WorkObjectRenderer resource={envelope.resource} compact={compact} onAction={(action, note) => onAction(envelope.resource!, action, note)} />
        <ProofLine envelope={envelope} />
      </div>
    );
  }
  return (
    <article className={`as-card ${envelope.safety.requires_approval ? "decision" : ""}`}>
      <span className="as-eyebrow">{readable(envelope.status ?? envelope.kind)}</span>
      <h2>{envelope.title}</h2>
      <p>{envelope.summary ?? "This state came from the owner-safe Manager read model."}</p>
      <ProofLine envelope={envelope} />
    </article>
  );
}

function ProofLine({ envelope }: { envelope: SurfaceEnvelope }) {
  const proof = Object.entries(envelope.proof).filter(([, value]) => value);
  return proof.length ? (
    <div className="as-proof-line">
      <strong>Proof</strong>
      <span>{proof.map(([key, value]) => `${readable(key)} ${String(value)}`).join(" · ")}</span>
    </div>
  ) : null;
}

function Composer({ employeeName, value, setValue, sending, onSend }: {
  employeeName: string;
  value: string;
  setValue: (value: string) => void;
  sending: boolean;
  onSend: () => void;
}) {
  return (
    <div className="as-composer">
      <label htmlFor="employee-command">Tell {employeeName} what happened or what you need</label>
      <div>
        <textarea
          id="employee-command"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") onSend();
          }}
          rows={4}
          placeholder="Customer approved the estimate. Prepare the deposit invoice and show me before sending."
        />
        <button type="button" disabled={!value.trim() || sending} onClick={onSend}>{sending ? "Starting…" : "Send to employee"}</button>
      </div>
      <small>Command starts work. Decisions and external effects remain governed by assignment, approval, and durable receipts.</small>
    </div>
  );
}

function QuietState({ title, body }: { title: string; body: string }) {
  return <div className="as-quiet"><strong>{title}</strong><p>{body}</p></div>;
}

function createIntentId(employeeId: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `web:${employeeId}:${random}`.slice(0, 160);
}

function hasProof(envelope: SurfaceEnvelope): boolean {
  return Object.values(envelope.proof).some(Boolean);
}

function readable(value: string): string {
  return value.replace(/[_:-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function ownerError(value: string): string {
  return readable(String(value).replace(/^error\s*/i, ""));
}

function formatDate(value?: string | null): string {
  if (!value) return "Unknown time";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function runtimeLabel(res: ResourcePayload, streamState: StreamState): string {
  if (res.runtime_health?.message) return res.runtime_health.message;
  if (streamState === "live") return "Exact assignment and runtime connected";
  if (streamState === "reconnecting") return "Restoring state without replaying work";
  return "Resolving exact runtime context";
}

const SURFACE_CSS = `
  .as-root{min-height:100vh;background:radial-gradient(circle at 8% 0%,rgba(223,246,255,.9),transparent 28rem),radial-gradient(circle at 92% 6%,rgba(225,29,42,.06),transparent 24rem),var(--amtech-canvas);color:var(--amtech-ink)}
  .as-header{position:sticky;top:0;z-index:20;min-height:72px;padding:12px clamp(16px,4vw,48px);display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid var(--amtech-line);background:rgba(255,255,255,.86);backdrop-filter:blur(28px)}
  .as-identity,.as-runtime{display:flex;align-items:center;gap:12px}.as-brand{font-weight:850;letter-spacing:.04em;text-decoration:none}.as-brand span{color:var(--amtech-red)}.as-identity>div{display:grid}.as-identity strong{font-size:16px}.as-identity div span,.as-runtime{font-size:12px;color:var(--amtech-muted)}
  .as-runtime{justify-content:flex-end;flex-wrap:wrap}.as-runtime small{max-width:180px;overflow:hidden;text-overflow:ellipsis}.as-dot{width:9px;height:9px;border-radius:50%;background:var(--amtech-blue)}.as-dot.live{background:var(--amtech-green)}.as-dot.offline{background:var(--amtech-red)}
  .as-shell{width:min(1180px,100%);margin:0 auto;padding:24px clamp(16px,4vw,40px) 64px}.as-tabs{display:flex;gap:8px;overflow:auto;padding:4px;margin-bottom:24px;border:1px solid var(--amtech-line);border-radius:999px;background:rgba(255,255,255,.72);backdrop-filter:blur(24px)}
  .as-tabs button{min-height:44px;padding:0 18px;border:0;border-radius:999px;background:transparent;font-weight:700;white-space:nowrap}.as-tabs button.active{background:var(--amtech-red);color:#fff;box-shadow:0 8px 22px rgba(225,29,42,.18)}.as-tabs button span{margin-left:7px;padding:2px 7px;border-radius:999px;background:rgba(255,255,255,.25);font-size:11px}
  .as-heading{display:flex;align-items:end;justify-content:space-between;gap:24px;margin:0 0 20px}.as-heading p,.as-eyebrow{font-size:11px;font-weight:750;letter-spacing:.12em;text-transform:uppercase;color:var(--amtech-muted)}.as-heading h1{font-size:clamp(30px,5vw,52px);line-height:1;font-weight:850;letter-spacing:-.045em}.as-progress{max-width:420px;padding:10px 14px;border-radius:999px;background:var(--amtech-blue-soft);color:var(--amtech-blue);font-size:13px;font-weight:700}
  .as-notice{margin-bottom:20px;padding:13px 16px;display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid var(--amtech-line);border-radius:16px;background:var(--amtech-white);font-size:13px}.as-notice.info{border-color:rgba(37,99,235,.18);background:var(--amtech-blue-soft);color:var(--amtech-blue)}.as-notice.success{border-color:rgba(22,138,87,.18);background:var(--amtech-green-soft);color:var(--amtech-green)}.as-notice.error{border-color:rgba(225,29,42,.2);background:var(--amtech-danger-soft);color:var(--amtech-red)}.as-notice button{min-height:36px;padding:0 14px;border:1px solid currentColor;border-radius:999px;background:#fff;color:inherit;font-weight:700}
  .as-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px}.as-grid.connections{align-items:start}.as-card,.as-quiet,.as-command{border:1px solid var(--amtech-line);border-radius:var(--amtech-radius-card);background:var(--amtech-glass);box-shadow:var(--amtech-shadow-card);backdrop-filter:blur(28px)}.as-card{padding:20px;display:grid;gap:12px;align-content:start}.as-card.resource{padding:20px}.as-card.decision{border-color:rgba(225,29,42,.22);box-shadow:0 14px 38px rgba(225,29,42,.07)}.as-card h2{font-size:20px;line-height:1.15}.as-card>p{color:var(--amtech-muted)}
  .as-card dl{margin:4px 0 0;display:grid;gap:8px}.as-card dl div{display:grid;grid-template-columns:90px 1fr;gap:12px;padding-top:8px;border-top:1px solid var(--amtech-line)}.as-card dt{color:var(--amtech-muted);font-size:12px}.as-card dd{margin:0;font-size:13px;font-weight:650}.as-actions{display:flex;gap:8px;flex-wrap:wrap}.as-actions button{min-height:44px;padding:0 18px;border:1px solid var(--amtech-line-strong);border-radius:999px;background:#fff;font-weight:750}.as-actions button.primary{background:var(--amtech-red);border-color:var(--amtech-red);color:#fff}
  .as-proof-line{margin-top:4px;padding-top:12px;display:grid;gap:4px;border-top:1px solid var(--amtech-line);font-size:11px;color:var(--amtech-green)}.as-proof-line span{overflow-wrap:anywhere}.as-proof{display:grid;gap:12px}.as-proof-row{padding:16px 18px;display:grid;grid-template-columns:150px minmax(0,1fr) auto;gap:18px;align-items:start;border:1px solid var(--amtech-line);border-radius:16px;background:rgba(255,255,255,.78)}.as-proof-row>span,.as-proof-row small{font-size:12px;color:var(--amtech-muted)}.as-proof-row p{margin-top:4px;color:var(--amtech-muted)}
  .as-command{padding:20px;display:grid;gap:16px}.as-messages{min-height:360px;max-height:58vh;overflow:auto;display:flex;flex-direction:column;gap:10px;padding:4px}.as-messages article{max-width:min(82%,680px);padding:12px 14px;border:1px solid var(--amtech-line);border-radius:16px;background:#fff}.as-messages article.owner{align-self:flex-end;background:var(--amtech-cyan)}.as-messages article span,.as-messages article small{font-size:11px;font-weight:750;color:var(--amtech-muted)}.as-messages article p{margin:5px 0}.as-composer{display:grid;gap:8px}.as-composer label{font-weight:750}.as-composer>div{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end}.as-composer textarea{width:100%;min-height:112px;padding:14px 16px;resize:vertical;border:1px solid var(--amtech-line-strong);border-radius:16px;background:#fff;outline:none}.as-composer textarea:focus{border-color:var(--amtech-blue);box-shadow:0 0 0 4px var(--amtech-blue-soft)}.as-composer button{min-height:48px;padding:0 22px;border:0;border-radius:999px;background:var(--amtech-red);color:#fff;font-weight:800}.as-composer button:disabled{opacity:.45}.as-composer small{color:var(--amtech-muted)}
  .as-quiet{padding:28px;text-align:center;display:grid;gap:8px}.as-quiet p{max-width:620px;margin:0 auto;color:var(--amtech-muted)}
  @media(max-width:720px){.as-header{align-items:flex-start}.as-runtime small{display:none}.as-shell{padding-top:16px}.as-heading{align-items:flex-start;flex-direction:column}.as-tabs{border-radius:18px}.as-proof-row{grid-template-columns:1fr}.as-composer>div{grid-template-columns:1fr}.as-composer button{width:100%}.as-messages article{max-width:92%}}
`;

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ResourcePayload } from "./surface-types";
import {
  planAdaptiveOperatingLayout,
  type ActiveSave,
  type AdaptiveLayoutRegion,
  type DelegatedWorkUnit,
  type OperatingContextManifest,
  type OperatingDecision,
  type OperatingEvidence,
  type OperatingSurfaceState,
  type OperatingSystemChange,
  type OperatingWorkLoop,
  type SurfaceEnvelope,
  type WorkAction,
  type WorkResource,
} from "@amtech/shared";
import { fixtureResourcePayload } from "./fixtures";
import { WorkObjectRenderer } from "./components/WorkObjectRenderer";
import {
  applyOwnerWorkEvent,
  installOwnerSnapshot,
  protocolAuthority,
  validateScopedFrame,
  type OwnerStreamScope,
} from "./owner-stream-state";

type StreamState = "connecting" | "live" | "reconnecting" | "offline";
type Notice = { tone: "info" | "success" | "error"; text: string } | null;

interface Props {
  employeeId: string;
  fixtureMode: boolean;
}

const EMPTY: ResourcePayload = {
  account_id: "",
  assignment_id: "",
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

export function AgentSurface({ employeeId, fixtureMode }: Props) {
  const [res, setRes] = useState<ResourcePayload>(() => fixtureMode ? fixtureResourcePayload(employeeId) : EMPTY);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(!fixtureMode);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState("");
  const [streamState, setStreamState] = useState<StreamState>(fixtureMode ? "live" : "connecting");
  const [focusLoopId, setFocusLoopId] = useState<string | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const retryIntent = useRef<{ message: string; intentId: string } | null>(null);
  const refreshTimer = useRef<number | null>(null);
  const streamScope = useRef<OwnerStreamScope | null>(null);
  const resourcesRef = useRef<ResourcePayload>(res);

  const installResources = useCallback((next: ResourcePayload) => {
    resourcesRef.current = next;
    setRes(next);
  }, []);

  useEffect(() => {
    resourcesRef.current = res;
  }, [res]);

  const refresh = useCallback(async () => {
    if (fixtureMode) {
      installResources(fixtureResourcePayload(employeeId));
      setLoading(false);
      setStreamState("live");
      return;
    }
    const scope = streamScope.current;
    if (!scope) {
      setNotice({ tone: "error", text: "AMTECH has not established the exact account, employee, assignment, and authority version. No owner action was sent." });
      setStreamState("offline");
      return;
    }
    try {
      const response = await fetch(`/api/employee/${employeeId}/resources`, { method: "POST" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNotice({ tone: "error", text: ownerError(json.error ?? "Could not load this employee's operating state.") });
        setStreamState("offline");
        return;
      }
      if (json.account_id !== scope.account_id || json.employee_id !== scope.employee_id || json.assignment_id !== scope.assignment_id) {
        setNotice({ tone: "error", text: "AMTECH denied a resource projection that did not match the installed account, employee, and assignment." });
        setStreamState("offline");
        return;
      }
      installResources({ ...EMPTY, ...json });
      setNotice(null);
    } catch {
      setNotice({ tone: "error", text: "The operating surface could not reach AMTECH. No command was resent." });
      setStreamState("offline");
    } finally {
      setLoading(false);
    }
  }, [employeeId, fixtureMode, installResources]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => { void refresh(); }, 180);
  }, [refresh]);

  useEffect(() => {
    streamScope.current = null;
    retryIntent.current = null;
    const initial = fixtureMode ? fixtureResourcePayload(employeeId) : EMPTY;
    installResources(initial);
    setInput("");
    setNotice(null);
    setLoading(!fixtureMode);
    setProgress("");
    setStreamState(fixtureMode ? "live" : "connecting");
    setFocusLoopId(null);
  }, [employeeId, fixtureMode, installResources]);

  useEffect(() => {
    if (fixtureMode) void refresh();
    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    };
  }, [fixtureMode, refresh]);

  useEffect(() => {
    if (fixtureMode) return;
    let source: EventSource | null = null;
    let closed = false;
    let reconnectDelay = 1000;
    let reconnectTimer: number | null = null;

    function denyProjection(reason: string) {
      source?.close();
      streamScope.current = null;
      setLoading(false);
      setProgress("");
      setStreamState("offline");
      setNotice({ tone: "error", text: `AMTECH denied an invalid owner-state projection (${ownerError(reason)}). No command was sent or replayed.` });
    }

    function connect() {
      if (closed) return;
      streamScope.current = null;
      setStreamState((current) => current === "offline" ? "reconnecting" : "connecting");
      source = new EventSource(`/api/employee/${employeeId}/events`);
      source.addEventListener("open", () => {
        reconnectDelay = 1000;
      });
      source.addEventListener("snapshot", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data);
          const installed = installOwnerSnapshot(payload, employeeId);
          if (!installed.ok) {
            denyProjection(installed.reason);
            return;
          }
          streamScope.current = installed.scope;
          installResources({ ...EMPTY, ...installed.snapshot });
          setLoading(false);
          setProgress("");
          setNotice(null);
          setStreamState("live");
        } catch {
          denyProjection("snapshot_parse_failed");
        }
      });
      source.addEventListener("work_event", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data);
          const scope = streamScope.current;
          if (!scope) {
            denyProjection("work_event_before_snapshot");
            return;
          }
          const applied = applyOwnerWorkEvent(resourcesRef.current, payload, scope);
          if (applied.accepted) {
            streamScope.current = applied.scope;
            installResources(applied.resources);
            return;
          }
          if (applied.reason === "scope_mismatch" || applied.reason === "invalid_event") denyProjection(applied.reason);
        } catch {
          denyProjection("work_event_parse_failed");
        }
      });
      source.addEventListener("work_progress", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data);
          const scope = streamScope.current;
          if (!scope || !validateScopedFrame(payload, scope, "work_progress")) {
            denyProjection("work_progress_scope_mismatch");
            return;
          }
          const verb = typeof payload?.verb === "string" ? payload.verb : "Working";
          const state = typeof payload?.state === "string" ? payload.state : "working";
          setProgress(state === "completed" ? "" : verb);
          if (state === "completed") scheduleRefresh();
        } catch {
          denyProjection("work_progress_parse_failed");
        }
      });
      source.addEventListener("approval_update", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data);
          const scope = streamScope.current;
          if (!scope || !validateScopedFrame(payload, scope, "approval_update")) {
            denyProjection("approval_update_scope_mismatch");
            return;
          }
          scheduleRefresh();
        } catch {
          denyProjection("approval_update_parse_failed");
        }
      });
      source.onerror = () => {
        source?.close();
        streamScope.current = null;
        if (closed) return;
        setStreamState("reconnecting");
        reconnectTimer = window.setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 15000);
      };
    }

    connect();
    return () => {
      closed = true;
      streamScope.current = null;
      source?.close();
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
    };
  }, [employeeId, fixtureMode, installResources, scheduleRefresh]);

  const operating = useMemo(() => res.operating_state ?? fallbackOperatingState(res, employeeId), [employeeId, res]);
  const employeeName = res.employee?.name ?? operating.context.employee_name ?? "Your employee";
  const selectedLoopId = focusLoopId ?? operating.focus_loop_id ?? operating.layout.focus_loop_id ?? operating.loops[0]?.id ?? null;
  const selectedLoop = operating.loops.find((loop) => loop.id === selectedLoopId) ?? null;
  const envelopeById = useMemo(() => new Map((res.surface_envelopes ?? []).map((envelope) => [envelope.id, envelope])), [res.surface_envelopes]);

  async function sendMessage(messageOverride?: string) {
    const body = (messageOverride ?? input).trim();
    if (!body || sending) return;
    const authority = fixtureMode ? null : protocolAuthority(streamScope.current);
    if (!fixtureMode && !authority) {
      setNotice({ tone: "error", text: "AMTECH is restoring the exact assignment authority. This owner intent was not sent; retry after the surface is live." });
      return;
    }
    const previous = retryIntent.current;
    const intentId = previous?.message === body ? previous.intentId : createIntentId(employeeId);
    retryIntent.current = { message: body, intentId };
    setSending(true);
    setNotice({ tone: "info", text: "Starting this work with the exact employee, assignment, authority version, and current operating context." });

    if (fixtureMode) {
      const now = new Date().toISOString();
      setRes((current) => {
        const next = {
          ...current,
          messages: [
            ...current.messages,
            { id: `fixture-owner-${Date.now()}`, direction: "from_owner", body, status: "delivered", created_at: now },
            { id: `fixture-employee-${Date.now()}`, direction: "to_owner", body: "I picked that up. I will form the work, delegate bounded parts where useful, bring back decisions and active saves, and leave evidence after accepted effects.", status: "delivered", created_at: now },
          ],
        };
        resourcesRef.current = next;
        return next;
      });
      setInput("");
      retryIntent.current = null;
      setSending(false);
      setNotice({ tone: "success", text: "Fixture demonstration only. No provider, customer, or business effect occurred." });
      return;
    }

    try {
      const response = await fetch(`/api/employee/${employeeId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: body, intent_id: intentId, ...authority }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setInput(body);
        setNotice({ tone: "error", text: ownerError(json.error ?? "This turn was not accepted. Retry uses the same intent and will not create a second turn.") });
        return;
      }
      setInput("");
      retryIntent.current = null;
      setNotice({ tone: response.status === 202 ? "info" : "success", text: response.status === 202 ? "The turn started but is not terminal. AMTECH is reconciling it; do not resend." : "The turn was accepted. Durable state will update through the validated stream; reconnect will not resend it." });
    } catch {
      setInput(body);
      setNotice({ tone: "error", text: "The connection ended before AMTECH could prove acceptance. Retry keeps the same intent; reconnect itself does not create a second turn." });
    } finally {
      setSending(false);
    }
  }

  async function resolveApproval(approvalId: string, response: "approved" | "rejected") {
    if (!approvalId) return;
    const authority = fixtureMode ? null : protocolAuthority(streamScope.current);
    if (!fixtureMode && !authority) {
      setNotice({ tone: "error", text: "AMTECH is restoring the exact approval authority. The decision was not sent." });
      return;
    }
    setNotice({ tone: "info", text: response === "approved" ? "Submitting approval through the exact current assignment and authority version." : "Recording the decline against the exact held revision. The action will not proceed." });
    try {
      const result = await fetch(`/api/employee/${employeeId}/approval/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approval_id: approvalId, owner_response: response, ...authority }),
      });
      const json = await result.json().catch(() => ({}));
      setNotice(result.ok
        ? { tone: "success", text: json.user_facing_summary_hint ?? (response === "approved" ? "Approved. The employee can continue only within this exact gate." : "Declined. The employee will not perform that action.") }
        : { tone: "error", text: ownerError(json.error ?? "The decision was not accepted.") });
      if (result.ok) scheduleRefresh();
    } catch {
      setNotice({ tone: "error", text: "The connection ended before AMTECH could prove the approval decision. It was not replayed." });
    }
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
    if (action === "acknowledge") await sendMessage(`${resource.title}: acknowledged.`);
  }

  return (
    <main className="os-root">
      <style>{OPERATING_CSS}</style>
      <header className="os-header">
        <div className="os-identity">
          <a className="os-brand" href="/dashboard">AMTECH<span>.</span></a>
          <div>
            <strong>{employeeName}</strong>
            <span>{operating.context.business_name ?? "AI employee operating surface"}</span>
          </div>
        </div>
        <button className="os-runtime" type="button" onClick={() => setContextOpen((value) => !value)} aria-expanded={contextOpen}>
          <span className={`os-dot ${streamState}`} aria-hidden />
          <span>{streamState === "live" ? "Live" : streamState === "reconnecting" ? "Restoring state" : streamState === "offline" ? "Unavailable" : "Validating state"}</span>
          <small>{operating.context.dominant_domains.slice(0, 3).map(readable).join(" · ") || "General operations"}</small>
        </button>
      </header>

      <div className={`os-shell ${operating.layout.density}`}>
        <section className={`os-guidance ${operating.guidance.mode}`}>
          <div>
            <p>{guidanceEyebrow(operating)}</p>
            <h1>{operating.guidance.headline}</h1>
            <span>{operating.guidance.summary}</span>
          </div>
          <div className="os-guidance-actions">
            {operating.guidance.suggested_prompt ? (
              <button type="button" onClick={() => setInput(operating.guidance.suggested_prompt ?? "")}>Use suggested direction</button>
            ) : null}
            {selectedLoop ? <button className="secondary" type="button" onClick={() => document.getElementById(`loop-${selectedLoop.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}>Open current work</button> : null}
          </div>
          {progress ? <div className="os-progress" aria-live="polite">{employeeName} is working: {progress}</div> : null}
        </section>

        {notice ? (
          <div className={`os-notice ${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
            <span>{notice.text}</span>
            {notice.tone === "error" ? <button type="button" onClick={() => void refresh()}>Refresh state</button> : null}
          </div>
        ) : null}

        {contextOpen ? <ContextPanel context={operating.context} runtime={res.runtime_health?.message} onClose={() => setContextOpen(false)} /> : null}
        {loading ? <QuietState title={`Resolving ${employeeName}'s operating state`} body="AMTECH is validating the exact account, employee, assignment, authority version, cursor, current work, active saves, delegated units, and evidence." /> : null}

        {!loading ? (
          <div className="os-regions">
            {operating.layout.ordered_regions.map((region) => (
              <OperatingRegion
                key={region.kind}
                region={region}
                operating={operating}
                res={res}
                selectedLoopId={selectedLoopId}
                setSelectedLoopId={setFocusLoopId}
                envelopeById={envelopeById}
                onObjectAction={handleObjectAction}
                onApproval={resolveApproval}
                onCommand={(message) => void sendMessage(message)}
              />
            ))}
          </div>
        ) : null}

        <section className="os-command-dock" aria-label={`Work with ${employeeName}`}>
          <div className="os-command-label">
            <strong>Work with {employeeName}</strong>
            <span>Give an outcome, change priority, answer a question, or ask what will return next.</span>
          </div>
          <div className="os-command-input">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void sendMessage();
              }}
              rows={3}
              placeholder="Example: Watch the campaign through Friday, delegate the source review, and bring it back if cost per lead rises above $85."
              aria-label={`Command ${employeeName}`}
            />
            <button type="button" disabled={!input.trim() || sending || (!fixtureMode && streamState !== "live")} onClick={() => void sendMessage()}>{sending ? "Starting…" : streamState === "reconnecting" ? "Restoring…" : "Send"}</button>
          </div>
          <small>Owner intent is assignment- and authority-version-bound. External effects remain governed by policy, approval, C3, one durable reservation, and terminal receipts.</small>
        </section>
      </div>
    </main>
  );
}

function OperatingRegion({
  region,
  operating,
  res,
  selectedLoopId,
  setSelectedLoopId,
  envelopeById,
  onObjectAction,
  onApproval,
  onCommand,
}: {
  region: AdaptiveLayoutRegion;
  operating: OperatingSurfaceState;
  res: ResourcePayload;
  selectedLoopId: string | null;
  setSelectedLoopId: (id: string) => void;
  envelopeById: Map<string, SurfaceEnvelope>;
  onObjectAction: (resource: WorkResource, action: WorkAction["action"], note?: string) => Promise<void> | void;
  onApproval: (approvalId: string, response: "approved" | "rejected") => Promise<void> | void;
  onCommand: (message: string) => void;
}) {
  if (region.kind === "guidance") return null;
  if (region.kind === "attention") {
    const blocked = operating.loops.filter((loop) => loop.state === "blocked" || loop.state === "failed");
    if (!operating.decisions.length && !blocked.length) return null;
    return (
      <Section title="Needs you" summary="Judgment, authorization, or a blocking dependency is holding the next branch." tone="attention">
        <div className="os-card-grid">
          {operating.decisions.slice(0, region.limit).map((decision) => (
            <DecisionCard key={decision.id} decision={decision} envelope={decision.source_envelope_id ? envelopeById.get(decision.source_envelope_id) : undefined} onObjectAction={onObjectAction} onApproval={onApproval} />
          ))}
          {blocked.slice(0, Math.max(0, region.limit - operating.decisions.length)).map((loop) => (
            <LoopCard key={loop.id} loop={loop} selected={selectedLoopId === loop.id} onSelect={() => setSelectedLoopId(loop.id)} delegated={operating.delegated_work.filter((unit) => unit.parent_loop_id === loop.id)} saves={operating.active_saves.filter((save) => save.loop_id === loop.id)} />
          ))}
        </div>
      </Section>
    );
  }
  if (region.kind === "work_loops") {
    if (!operating.loops.length) return <Section title="Current work" summary="Durable work loops will form here as the employee takes on real outcomes."><QuietState title="No work loop is active" body="Use the command below to describe the next business outcome. AMTECH will shape it into persistent work rather than leaving it as a chat message." /></Section>;
    const loops = operating.loops.slice(0, region.limit);
    const focused = operating.loops.find((loop) => loop.id === selectedLoopId) ?? loops[0];
    const focusedEnvelopes = focused?.source_envelope_ids.map((id) => envelopeById.get(id)).filter((value): value is SurfaceEnvelope => Boolean(value)) ?? [];
    return (
      <Section title="Current work" summary="Persistent outcomes the employee is carrying across systems, sessions, and time.">
        <div className="os-loop-layout">
          <div className="os-loop-list">
            {loops.map((loop) => <LoopCard key={loop.id} loop={loop} selected={focused?.id === loop.id} onSelect={() => setSelectedLoopId(loop.id)} delegated={operating.delegated_work.filter((unit) => unit.parent_loop_id === loop.id)} saves={operating.active_saves.filter((save) => save.loop_id === loop.id)} />)}
          </div>
          {focused ? (
            <article className="os-focus" id={`loop-${focused.id}`}>
              <div className="os-focus-head">
                <div><p>{readable(focused.domain)} · {readable(focused.state)}</p><h3>{focused.title}</h3><span>{focused.summary ?? "This loop is preserved in the employee's durable operating state."}</span></div>
                <button type="button" onClick={() => onCommand(`For ${focused.title}: show me what changed, what is delegated, what is uncertain, and the next safe action.`)}>Ask about this work</button>
              </div>
              <dl className="os-loop-facts">
                <div><dt>Next</dt><dd>{focused.next_step ?? "Continue from current state"}</dd></div>
                {focused.return_condition ? <div><dt>Returns when</dt><dd>{focused.return_condition.description}</dd></div> : null}
                <div><dt>Updated</dt><dd>{formatDate(focused.updated_at)}</dd></div>
              </dl>
              {focusedEnvelopes.map((envelope) => <EnvelopeCard key={envelope.id} envelope={envelope} onAction={onObjectAction} />)}
              <DelegationStrip units={operating.delegated_work.filter((unit) => unit.parent_loop_id === focused.id)} />
              <SaveStrip saves={operating.active_saves.filter((save) => save.loop_id === focused.id)} />
            </article>
          ) : null}
        </div>
      </Section>
    );
  }
  if (region.kind === "active_saves") {
    if (!operating.active_saves.length) return null;
    return <Section title="Held for return" summary="Future intentions the employee is carrying—not notifications you must remember yourself."><div className="os-card-grid saves">{operating.active_saves.slice(0, region.limit).map((save) => <ActiveSaveCard key={save.id} save={save} />)}</div></Section>;
  }
  if (region.kind === "system_changes") {
    if (!operating.changes.length) return null;
    return <Section title="What changed" summary="Meaningful business and runtime changes from the ambient event stream."><div className="os-change-list">{operating.changes.slice(0, region.limit).map((change) => <ChangeRow key={change.id} change={change} />)}</div></Section>;
  }
  if (region.kind === "delegated_work") {
    if (!operating.delegated_work.length) return null;
    return <Section title="Work delegated by the employee" summary="Bounded contributors are shown by purpose and result—not as an org chart you must manage."><div className="os-delegated-list">{operating.delegated_work.slice(0, region.limit).map((unit) => <DelegatedRow key={unit.id} unit={unit} />)}</div></Section>;
  }
  if (region.kind === "evidence") {
    if (!operating.evidence.length) return null;
    return <Section title="Evidence and outcomes" summary="Artifacts, receipts, recorded results, and terminal failures tied back to the work."><div className="os-evidence-list">{operating.evidence.slice(0, region.limit).map((item) => <EvidenceRow key={item.id} item={item} />)}</div></Section>;
  }
  if (region.kind === "connections") {
    const connections = (res.connection_surfaces ?? []).filter((connection) => connection.state === "needs_you" || connection.state === "working").slice(0, region.limit);
    if (!connections.length) return null;
    return <Section title="Systems affecting work" summary="Connections appear here only when their state changes what the employee can do."><div className="os-card-grid">{connections.map((connection) => <article className="os-card" key={connection.id}><p>{readable(connection.state)}</p><h3>{connection.label}</h3><span>{connection.health ?? connection.what_employee_can_do}</span>{connection.last_event ? <small>{connection.last_event}</small> : null}</article>)}</div></Section>;
  }
  if (region.kind === "context") {
    return <details className="os-context-inline"><summary>Why this surface is arranged this way</summary><p>{operating.layout.rationale_codes.map(readable).join(" · ")}</p><small>Context {operating.layout.context_fingerprint.slice(0, 20)}…</small></details>;
  }
  return null;
}

function Section({ title, summary, tone, children }: { title: string; summary: string; tone?: "attention"; children: React.ReactNode }) {
  return <section className={`os-section ${tone ?? ""}`}><header><div><p>{title}</p><h2>{title}</h2></div><span>{summary}</span></header>{children}</section>;
}

function LoopCard({ loop, selected, onSelect, delegated, saves }: { loop: OperatingWorkLoop; selected: boolean; onSelect: () => void; delegated: DelegatedWorkUnit[]; saves: ActiveSave[] }) {
  return <button type="button" className={`os-loop-card ${selected ? "selected" : ""} ${loop.state}`} onClick={onSelect}><span>{readable(loop.state)} · {readable(loop.horizon)}</span><strong>{loop.title}</strong><p>{loop.summary ?? loop.next_step}</p><small>{delegated.length ? `${delegated.length} delegated` : "Handled by employee"}{saves.length ? ` · ${saves.length} held for return` : ""}</small></button>;
}

function DecisionCard({ decision, envelope, onObjectAction, onApproval }: { decision: OperatingDecision; envelope?: SurfaceEnvelope; onObjectAction: (resource: WorkResource, action: WorkAction["action"], note?: string) => Promise<void> | void; onApproval: (approvalId: string, response: "approved" | "rejected") => Promise<void> | void }) {
  if (envelope?.resource) return <div className="os-card decision"><WorkObjectRenderer resource={envelope.resource} onAction={(action, note) => onObjectAction(envelope.resource!, action, note)} /></div>;
  const approvalId = decision.target?.kind === "approval" ? decision.target.id : null;
  return <article className="os-card decision"><p>{readable(decision.risk)} impact</p><h3>{decision.title}</h3><span>{decision.consequence}</span>{approvalId ? <div className="os-actions"><button type="button" onClick={() => void onApproval(approvalId, "approved")}>Approve</button><button className="secondary" type="button" onClick={() => void onApproval(approvalId, "rejected")}>Decline</button></div> : null}</article>;
}

function ActiveSaveCard({ save }: { save: ActiveSave }) {
  return <article className={`os-card save ${save.state}`}><p>{readable(save.state)}</p><h3>{save.title}</h3><span>{save.why_held}</span><div className="os-return"><strong>Returns when</strong><small>{save.return_condition.description}</small>{save.return_condition.due_at ? <small>{formatDate(save.return_condition.due_at)}</small> : null}</div></article>;
}

function ChangeRow({ change }: { change: OperatingSystemChange }) {
  return <article className={`os-change ${change.state}`}><time>{formatDate(change.occurred_at)}</time><div><strong>{change.title}</strong><p>{change.summary ?? `Recorded from ${readable(change.source)}.`}</p></div><span>{readable(change.state)}</span></article>;
}

function DelegatedRow({ unit }: { unit: DelegatedWorkUnit }) {
  return <article className={`os-delegated ${unit.state}`}><div><p>{readable(unit.executor_kind)}</p><strong>{unit.title}</strong><span>{unit.purpose}</span></div><div><strong>{readable(unit.state)}</strong><small>{unit.result_summary ?? unit.blocking_reason ?? unit.executor_label ?? "Bounded delegated work"}</small></div></article>;
}

function EvidenceRow({ item }: { item: OperatingEvidence }) {
  const content = <><div><strong>{item.title}</strong><p>{item.summary ?? "Recorded in durable operating evidence."}</p></div><span>{readable(item.state)} · {formatDate(item.recorded_at)}</span></>;
  return item.href ? <a className={`os-evidence ${item.state}`} href={item.href} target="_blank" rel="noreferrer">{content}</a> : <article className={`os-evidence ${item.state}`}>{content}</article>;
}

function DelegationStrip({ units }: { units: DelegatedWorkUnit[] }) {
  if (!units.length) return null;
  return <div className="os-strip"><strong>Delegated work</strong>{units.map((unit) => <span key={unit.id}>{unit.title} · {readable(unit.state)}</span>)}</div>;
}

function SaveStrip({ saves }: { saves: ActiveSave[] }) {
  if (!saves.length) return null;
  return <div className="os-strip saves"><strong>Held for return</strong>{saves.map((save) => <span key={save.id}>{save.title} · {save.return_condition.description}</span>)}</div>;
}

function EnvelopeCard({ envelope, onAction }: { envelope: SurfaceEnvelope; onAction: (resource: WorkResource, action: WorkAction["action"], note?: string) => Promise<void> | void }) {
  if (envelope.resource) return <div className="os-object"><WorkObjectRenderer resource={envelope.resource} onAction={(action, note) => onAction(envelope.resource!, action, note)} /></div>;
  return <article className="os-object"><p>{readable(envelope.status ?? envelope.kind)}</p><h3>{envelope.title}</h3><span>{envelope.summary ?? "Materialized from the current owner-safe state."}</span></article>;
}

function ContextPanel({ context, runtime, onClose }: { context: OperatingContextManifest; runtime?: string; onClose: () => void }) {
  return <aside className="os-context-panel"><header><div><p>Operating context</p><h2>{context.employee_name} in {context.business_name ?? "this business"}</h2></div><button type="button" onClick={onClose}>Close</button></header><dl><div><dt>Assignment</dt><dd>{context.assignment_id}</dd></div><div><dt>Profile</dt><dd>{context.profile_key ?? "general"}{context.profile_version ? ` · ${context.profile_version}` : ""}</dd></div><div><dt>Session</dt><dd>{context.session_id ?? "No current transcript ID"}</dd></div><div><dt>Last active</dt><dd>{formatDate(context.session_last_active)}</dd></div><div><dt>Runtime</dt><dd>{runtime ?? "No runtime message"}</dd></div><div><dt>Domains</dt><dd>{context.dominant_domains.map(readable).join(", ")}</dd></div></dl><p>Layout uses {context.signals.length} bounded owner-safe context signals. Raw memory, soul files, provider payloads, AGENTS.md, CODEGRAPH.md, credentials, and private reasoning are not exposed here.</p></aside>;
}

function QuietState({ title, body }: { title: string; body: string }) {
  return <div className="os-quiet"><strong>{title}</strong><p>{body}</p></div>;
}

function fallbackOperatingState(res: ResourcePayload, employeeId: string): OperatingSurfaceState {
  const now = new Date().toISOString();
  const loops: OperatingWorkLoop[] = (res.tasks ?? []).map((task) => ({
    id: `loop:${task.id}`,
    title: task.title,
    summary: task.summary,
    state: task.status === "in_progress" ? "active" : task.status === "scheduled" ? "waiting" : task.status,
    horizon: task.status === "scheduled" ? "later" : "now",
    domain: "custom",
    updated_at: task.created_at ?? null,
    next_step: task.status === "needs_you" ? "Owner input" : task.status === "blocked" ? "Clear the dependency" : "Continue",
    return_condition: task.status === "scheduled" ? { kind: "time", description: task.summary ?? "Return at the scheduled time", due_at: task.created_at ?? null } : null,
    source_envelope_ids: [],
    target: task.target_id ? { kind: task.type, id: task.target_id } : null,
    proof: { assignment_id: res.assignment_id ?? null, source_table: "fixture_tasks", source_id: task.id },
  }));
  const saves: ActiveSave[] = (res.resurface_items ?? []).map((item) => ({
    id: `save:${item.id}`,
    title: item.title,
    why_held: item.why,
    state: item.status === "scheduled" ? "scheduled" : item.status === "needs_you" ? "needs_you" : item.status === "blocked" || item.status === "failed" ? "blocked" : "waiting",
    return_condition: { kind: item.status === "scheduled" ? "time" : item.status === "needs_you" ? "owner" : item.kind === "connector" ? "dependency" : "event", description: item.why, due_at: item.resurface_at ?? null, source: item.channel },
    target: item.target ?? null,
    proof: { ...item.proof, assignment_id: res.assignment_id ?? null },
  }));
  const decisions: OperatingDecision[] = (res.approvals ?? []).map((approval) => ({ id: `decision:${approval.id}`, title: approval.summary, consequence: "This action is held until an authorized owner decides.", risk: approval.risk_level === "low" ? "low" : approval.risk_level === "medium" ? "medium" : "high", target: { kind: "approval", id: approval.id }, proof: { approval_id: approval.id, assignment_id: res.assignment_id ?? null } }));
  const changes: OperatingSystemChange[] = (res.work_events ?? []).map((event) => ({ id: `change:${event.id}`, title: event.work_event_descriptor?.title ?? readable(event.event_type), summary: event.work_event_descriptor?.summary, source: "fixture", state: event.status === "failed" ? "failed" : "observed", occurred_at: event.created_at, proof: { inbound_event_id: event.id, assignment_id: res.assignment_id ?? null } }));
  const evidence: OperatingEvidence[] = (res.outputs ?? []).map((output) => ({ id: `evidence:${output.id}`, title: output.title, summary: output.summary, state: output.status === "failed" ? "failed" : output.status === "draft" ? "draft" : "recorded", recorded_at: output.created_at ?? null, href: output.href ?? null, proof: { artifact_id: output.artifact_id ?? null, assignment_id: res.assignment_id ?? null } }));
  const context: OperatingContextManifest = { version: 1, generated_at: now, account_id: res.account_id, assignment_id: res.assignment_id ?? "fixture_assignment", employee_id: res.employee_id ?? employeeId, employee_name: res.employee?.name ?? "Avery", business_name: "Fixture business", business_kind: "demonstration", profile_key: res.employee?.profile_id ?? "fixture", profile_version: "fixture", session_id: "fixture-session", session_last_active: now, runtime_context_version: "fixture", doctrine_versions: { design_system: "fixture", agent_interface: "fixture" }, dominant_domains: ["customer", "finance", "operations"], owner_experience: "guided", preferred_density: "balanced", signals: [] };
  const layout = planAdaptiveOperatingLayout({ generated_at: now, context_fingerprint: "fixture", owner_experience: context.owner_experience, preferred_density: context.preferred_density, loops, active_saves: saves, decisions, changes, delegated_work: [], evidence, connection_attention_count: (res.connection_surfaces ?? []).filter((connection) => connection.state === "needs_you").length });
  return { version: 1, generated_at: now, guidance: decisions.length ? { headline: `${context.employee_name} has ${decisions.length} decisions ready`, summary: "Fixture operating state shows how work, future intentions, decisions, and evidence return to the owner.", suggested_prompt: "Explain the most important decision and what happens next.", mode: "needs_you" } : { headline: `${context.employee_name} is ready`, summary: "Give the employee a business outcome to carry across time and systems.", suggested_prompt: "Here is the outcome I need next...", mode: "quiet" }, focus_loop_id: layout.focus_loop_id, loops, active_saves: saves, decisions, changes, delegated_work: [], evidence, context, layout };
}

function guidanceEyebrow(operating: OperatingSurfaceState): string {
  if (operating.guidance.mode === "needs_you") return "Your judgment is needed";
  if (operating.guidance.mode === "blocked") return "Work is safely held";
  if (operating.guidance.mode === "working") return "Employee operating now";
  if (operating.guidance.mode === "degraded") return "Degraded but explicit";
  return "Ready for the next outcome";
}

function createIntentId(employeeId: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `web:${employeeId}:${random}`.slice(0, 160);
}

function readable(value: string): string {
  return String(value).replace(/[_:-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function ownerError(value: string): string {
  return readable(String(value).replace(/^error\s*/i, ""));
}

function formatDate(value?: string | null): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const OPERATING_CSS = `
  .os-root{min-height:100vh;background:radial-gradient(circle at 8% 0%,rgba(223,246,255,.9),transparent 30rem),radial-gradient(circle at 92% 7%,rgba(225,29,42,.06),transparent 26rem),var(--amtech-canvas);color:var(--amtech-ink)}
  .os-header{position:sticky;top:0;z-index:30;min-height:72px;padding:12px clamp(16px,4vw,48px);display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid var(--amtech-line);background:rgba(255,255,255,.86);backdrop-filter:blur(30px)}.os-identity,.os-runtime{display:flex;align-items:center;gap:12px}.os-brand{font-weight:860;letter-spacing:.04em;text-decoration:none}.os-brand span{color:var(--amtech-red)}.os-identity>div{display:grid}.os-identity strong{font-size:16px}.os-identity div span{font-size:12px;color:var(--amtech-muted)}
  .os-runtime{min-height:44px;padding:0 14px;border:1px solid var(--amtech-line);border-radius:999px;background:rgba(255,255,255,.82);color:var(--amtech-ink)}.os-runtime>span{font-size:12px;font-weight:760}.os-runtime small{max-width:240px;color:var(--amtech-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.os-dot{width:9px;height:9px;border-radius:50%;background:var(--amtech-blue)}.os-dot.live{background:var(--amtech-green)}.os-dot.offline{background:var(--amtech-red)}
  .os-shell{width:min(1240px,100%);margin:0 auto;padding:24px clamp(16px,4vw,42px) 180px}.os-shell.calm{width:min(1080px,100%)}.os-shell.dense{width:min(1380px,100%)}
  .os-guidance{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;padding:clamp(24px,5vw,48px);border:1px solid var(--amtech-line);border-radius:var(--amtech-radius-panel);background:rgba(255,255,255,.84);box-shadow:var(--amtech-shadow-float);backdrop-filter:blur(30px);overflow:hidden}.os-guidance:after{content:"";position:absolute;right:-80px;top:-120px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.1),transparent 68%);pointer-events:none}.os-guidance.needs_you{border-color:rgba(225,29,42,.18)}.os-guidance.blocked{border-color:rgba(225,29,42,.22)}.os-guidance>div:first-child{position:relative;z-index:1;max-width:820px}.os-guidance p,.os-section header p,.os-card>p,.os-object>p,.os-focus-head p,.os-delegated p{font-size:11px;font-weight:780;letter-spacing:.12em;text-transform:uppercase;color:var(--amtech-muted)}.os-guidance h1{margin:8px 0 12px;font-size:clamp(34px,6vw,66px);line-height:.98;letter-spacing:-.05em;font-weight:870}.os-guidance>div:first-child>span{display:block;max-width:720px;color:var(--amtech-muted);font-size:16px;line-height:1.65}.os-guidance-actions{position:relative;z-index:1;display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:8px;min-width:220px}.os-guidance-actions button,.os-actions button{min-height:44px;padding:0 18px;border:1px solid var(--amtech-red);border-radius:999px;background:var(--amtech-red);color:#fff;font-weight:780}.os-guidance-actions button.secondary,.os-actions button.secondary{border-color:var(--amtech-line-strong);background:#fff;color:var(--amtech-ink)}.os-progress{position:absolute;left:clamp(24px,5vw,48px);bottom:14px;padding:7px 11px;border-radius:999px;background:var(--amtech-blue-soft);color:var(--amtech-blue);font-size:12px;font-weight:720}
  .os-notice{margin-top:16px;padding:13px 16px;display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid var(--amtech-line);border-radius:16px;background:#fff;font-size:13px}.os-notice.info{border-color:rgba(37,99,235,.18);background:var(--amtech-blue-soft);color:var(--amtech-blue)}.os-notice.success{border-color:rgba(22,138,87,.18);background:var(--amtech-green-soft);color:var(--amtech-green)}.os-notice.error{border-color:rgba(225,29,42,.2);background:var(--amtech-danger-soft);color:var(--amtech-red)}.os-notice button{min-height:36px;padding:0 14px;border:1px solid currentColor;border-radius:999px;background:#fff;color:inherit;font-weight:720}
  .os-context-panel{margin-top:16px;padding:20px;border:1px solid rgba(37,99,235,.18);border-radius:var(--amtech-radius-card);background:rgba(255,255,255,.9);box-shadow:var(--amtech-shadow-card)}.os-context-panel header{display:flex;justify-content:space-between;gap:16px}.os-context-panel header p{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--amtech-blue);font-weight:780}.os-context-panel h2{font-size:22px}.os-context-panel header button{min-height:40px;padding:0 14px;border:1px solid var(--amtech-line);border-radius:999px;background:#fff}.os-context-panel dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:18px 0}.os-context-panel dl div{padding:10px 12px;border:1px solid var(--amtech-line);border-radius:12px;background:var(--amtech-canvas)}.os-context-panel dt{font-size:11px;color:var(--amtech-muted)}.os-context-panel dd{margin:3px 0 0;font-size:12px;font-weight:680;overflow-wrap:anywhere}.os-context-panel>p{color:var(--amtech-muted);font-size:12px}
  .os-regions{display:grid;gap:28px;margin-top:28px}.os-section{display:grid;gap:16px}.os-section>header{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,.7fr);gap:24px;align-items:end}.os-section>header p{color:var(--amtech-red)}.os-section>header h2{font-size:clamp(24px,4vw,36px);line-height:1.05;letter-spacing:-.035em}.os-section>header>span{color:var(--amtech-muted);font-size:13px;line-height:1.55}.os-section.attention>header p{color:var(--amtech-red)}
  .os-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:14px}.os-card{padding:20px;display:grid;gap:10px;border:1px solid var(--amtech-line);border-radius:var(--amtech-radius-card);background:var(--amtech-glass);box-shadow:var(--amtech-shadow-card);backdrop-filter:blur(26px)}.os-card.decision{border-color:rgba(225,29,42,.22)}.os-card.save{border-color:rgba(37,99,235,.16)}.os-card h3,.os-object h3{font-size:19px;line-height:1.15}.os-card>span,.os-object>span{color:var(--amtech-muted);line-height:1.55}.os-card small{color:var(--amtech-muted)}.os-return{margin-top:4px;padding-top:10px;display:grid;gap:3px;border-top:1px solid var(--amtech-line)}.os-return strong{font-size:11px;color:var(--amtech-blue);text-transform:uppercase;letter-spacing:.08em}
  .os-loop-layout{display:grid;grid-template-columns:minmax(260px,.72fr) minmax(0,1.6fr);gap:16px;align-items:start}.os-loop-list{display:grid;gap:8px;position:sticky;top:92px}.os-loop-card{width:100%;padding:15px 16px;display:grid;gap:5px;text-align:left;border:1px solid var(--amtech-line);border-radius:16px;background:rgba(255,255,255,.78);color:var(--amtech-ink)}.os-loop-card.selected{border-color:rgba(37,99,235,.32);background:#fff;box-shadow:var(--amtech-shadow-card)}.os-loop-card.needs_you,.os-loop-card.blocked,.os-loop-card.failed{border-left:4px solid var(--amtech-red)}.os-loop-card.active,.os-loop-card.repairing{border-left:4px solid var(--amtech-blue)}.os-loop-card>span{font-size:10px;font-weight:760;text-transform:uppercase;letter-spacing:.08em;color:var(--amtech-muted)}.os-loop-card>strong{font-size:15px}.os-loop-card>p{font-size:12px;color:var(--amtech-muted);line-height:1.45}.os-loop-card>small{font-size:10px;color:var(--amtech-muted)}
  .os-focus{padding:22px;display:grid;gap:16px;border:1px solid var(--amtech-line);border-radius:var(--amtech-radius-panel);background:rgba(255,255,255,.9);box-shadow:var(--amtech-shadow-float)}.os-focus-head{display:flex;align-items:start;justify-content:space-between;gap:20px}.os-focus-head h3{font-size:clamp(24px,4vw,38px);line-height:1.04;letter-spacing:-.035em}.os-focus-head>div>span{display:block;margin-top:8px;color:var(--amtech-muted)}.os-focus-head button{min-height:42px;padding:0 15px;border:1px solid var(--amtech-line-strong);border-radius:999px;background:#fff;white-space:nowrap;font-weight:720}.os-loop-facts{margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}.os-loop-facts div{padding:10px 12px;border:1px solid var(--amtech-line);border-radius:12px;background:var(--amtech-canvas)}.os-loop-facts dt{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--amtech-muted)}.os-loop-facts dd{margin:4px 0 0;font-size:12px;font-weight:650}.os-object{padding:16px;border:1px solid var(--amtech-line);border-radius:16px;background:#fff;display:grid;gap:8px}.os-strip{padding:12px 14px;display:flex;gap:8px;flex-wrap:wrap;border:1px solid rgba(37,99,235,.16);border-radius:14px;background:var(--amtech-blue-soft);font-size:11px;color:var(--amtech-blue)}.os-strip.saves{border-color:rgba(22,138,87,.16);background:var(--amtech-green-soft);color:var(--amtech-green)}.os-strip strong{width:100%;text-transform:uppercase;letter-spacing:.08em}
  .os-change-list,.os-delegated-list,.os-evidence-list{display:grid;gap:8px}.os-change,.os-delegated,.os-evidence{padding:14px 16px;display:grid;grid-template-columns:130px minmax(0,1fr) auto;gap:16px;align-items:start;border:1px solid var(--amtech-line);border-radius:14px;background:rgba(255,255,255,.76);color:inherit;text-decoration:none}.os-change time,.os-change>span,.os-evidence>span{font-size:11px;color:var(--amtech-muted)}.os-change p,.os-evidence p{margin-top:3px;color:var(--amtech-muted);font-size:12px}.os-change.failed,.os-evidence.failed{border-color:rgba(225,29,42,.2)}.os-change.accepted,.os-evidence.accepted{border-color:rgba(22,138,87,.18)}.os-delegated{grid-template-columns:minmax(0,1fr) minmax(180px,.45fr)}.os-delegated>div{display:grid;gap:4px}.os-delegated>div:last-child{text-align:right}.os-delegated span,.os-delegated small{color:var(--amtech-muted);font-size:12px}.os-delegated.blocked,.os-delegated.failed{border-left:4px solid var(--amtech-red)}.os-delegated.working{border-left:4px solid var(--amtech-blue)}
  .os-context-inline{padding:14px 16px;border:1px solid var(--amtech-line);border-radius:14px;background:rgba(255,255,255,.64);color:var(--amtech-muted);font-size:12px}.os-context-inline summary{cursor:pointer;font-weight:720;color:var(--amtech-ink)}.os-context-inline p{margin:8px 0 4px}
  .os-command-dock{position:fixed;left:50%;bottom:14px;z-index:40;width:min(1120px,calc(100% - 28px));transform:translateX(-50%);padding:14px;display:grid;grid-template-columns:minmax(180px,.45fr) minmax(0,1.55fr);gap:14px;border:1px solid var(--amtech-line-strong);border-radius:22px;background:rgba(255,255,255,.92);box-shadow:0 24px 70px rgba(30,48,80,.2);backdrop-filter:blur(34px)}.os-command-label{display:grid;align-content:center;gap:3px}.os-command-label strong{font-size:14px}.os-command-label span,.os-command-dock>small{font-size:11px;color:var(--amtech-muted)}.os-command-input{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.os-command-input textarea{width:100%;min-height:70px;max-height:180px;padding:11px 13px;resize:vertical;border:1px solid var(--amtech-line-strong);border-radius:14px;background:#fff;outline:none}.os-command-input textarea:focus{border-color:var(--amtech-blue);box-shadow:0 0 0 4px var(--amtech-blue-soft)}.os-command-input button{min-width:96px;border:0;border-radius:999px;background:var(--amtech-red);color:#fff;font-weight:800}.os-command-input button:disabled{opacity:.45}.os-command-dock>small{grid-column:2}
  .os-quiet{padding:28px;text-align:center;display:grid;gap:8px;border:1px solid var(--amtech-line);border-radius:var(--amtech-radius-card);background:rgba(255,255,255,.72)}.os-quiet p{max-width:640px;margin:0 auto;color:var(--amtech-muted)}
  @media(max-width:850px){.os-guidance{grid-template-columns:1fr}.os-guidance-actions{min-width:0;flex-direction:row;justify-content:flex-start;flex-wrap:wrap}.os-loop-layout{grid-template-columns:1fr}.os-loop-list{position:static;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}.os-section>header{grid-template-columns:1fr}.os-command-dock{grid-template-columns:1fr}.os-command-dock>small{grid-column:1}.os-command-label{display:none}}
  @media(max-width:620px){.os-header{align-items:flex-start}.os-runtime small{display:none}.os-shell{padding-top:16px;padding-bottom:190px}.os-guidance{padding:24px 20px}.os-guidance h1{font-size:36px}.os-guidance-actions button{width:100%}.os-focus-head{flex-direction:column}.os-focus-head button{width:100%}.os-change,.os-evidence,.os-delegated{grid-template-columns:1fr}.os-delegated>div:last-child{text-align:left}.os-command-input{grid-template-columns:1fr}.os-command-input button{min-height:44px}.os-command-dock{bottom:8px;width:calc(100% - 16px);padding:10px;border-radius:18px}}
`;

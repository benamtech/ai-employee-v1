"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ResourcePayload } from "./surface-types";
import { AgentSurface } from "./AgentSurface";
import { fixtureResourcePayload } from "./fixtures";
import { protocolAuthority, type OwnerStreamScope } from "./owner-stream-state";
import { openOwnerProjectionController } from "./owner-projection-controller";

type PrimaryMode = "talk" | "operate";
type StreamState = "connecting" | "live" | "reconnecting" | "offline";
type PendingTurn = {
  id: string;
  intentId: string;
  body: string;
  createdAt: string;
  status: "sending" | "accepted" | "failed";
};
type LiveRun = {
  runId: string;
  messageId: string;
  text: string;
  activity: string;
  status: "streaming" | "completed" | "failed";
  lastSequence: number;
  startedAt: number;
};

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

/**
 * Default owner experience: a chat-first, token-streaming Hermes client with the
 * richer AMTECH operating workspace one click away. Exactly one owner SSE stream
 * is active: this component owns it in Talk mode; AgentSurface owns it in Operate.
 */
export function LiveEmployeeOperatingShell({
  employeeId,
  fixtureMode,
}: {
  employeeId: string;
  fixtureMode: boolean;
}) {
  const [mode, setMode] = useState<PrimaryMode>("talk");
  const [res, setRes] = useState<ResourcePayload>(() => fixtureMode ? fixtureResourcePayload(employeeId) : EMPTY);
  const [runs, setRuns] = useState<Record<string, LiveRun>>({});
  const [pending, setPending] = useState<PendingTurn[]>([]);
  const [input, setInput] = useState("");
  const [dispatching, setDispatching] = useState(false);
  const [status, setStatus] = useState("");
  const [streamState, setStreamState] = useState<StreamState>(fixtureMode ? "live" : "connecting");
  const scopeRef = useRef<OwnerStreamScope | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const installResources = useCallback((next: ResourcePayload) => {
    setRes({ ...EMPTY, ...next });
  }, []);

  const refreshResources = useCallback(async () => {
    if (fixtureMode || mode !== "talk") return;
    const scope = scopeRef.current;
    if (!scope) return;
    try {
      const response = await fetch(`/api/employee/${employeeId}/resources`, { method: "POST", cache: "no-store" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) return;
      if (json.account_id !== scope.account_id || json.employee_id !== scope.employee_id || json.assignment_id !== scope.assignment_id) {
        scopeRef.current = null;
        setStreamState("offline");
        setStatus("AMTECH rejected a refreshed view that did not match this employee assignment.");
        return;
      }
      installResources(json as ResourcePayload);
    } catch {
      // The validated stream remains authoritative; a failed convenience refresh
      // must not erase the live conversation or resend owner intent.
    }
  }, [employeeId, fixtureMode, installResources, mode]);

  useEffect(() => {
    if (!fixtureMode) return;
    installResources(fixtureResourcePayload(employeeId));
    setStreamState("live");
  }, [employeeId, fixtureMode, installResources]);

  useEffect(() => {
    if (fixtureMode || mode !== "talk") {
      scopeRef.current = null;
      return;
    }
    return openOwnerProjectionController({
      employeeId,
      eventKinds: ["assistant_delta", "work_progress", "run_completed", "approval_update"],
      onState: setStreamState,
      onSnapshot(snapshot, scope) {
        scopeRef.current = scope;
        installResources(snapshot);
        setStatus("");
      },
      onEvent(kind, payload, scope) {
        scopeRef.current = scope;
        if (kind === "approval_update") {
          void refreshResources();
          return;
        }
        const runId = typeof payload.run_id === "string" ? payload.run_id : "";
        if (!runId) return;
        if (kind === "assistant_delta") {
          const messageId = typeof payload.message_id === "string" ? payload.message_id : "assistant:" + runId;
          const delta = typeof payload.delta === "string" ? payload.delta : "";
          const sequence = Number(payload.sequence ?? -1);
          if (!delta || !Number.isInteger(sequence) || sequence < 0) return;
          setRuns((current) => {
            const previous = current[runId];
            if (previous && sequence <= previous.lastSequence) return current;
            return { ...current, [runId]: { runId, messageId, text: (previous?.text ?? "") + delta, activity: previous?.activity ?? "Responding", status: "streaming", lastSequence: sequence, startedAt: previous?.startedAt ?? Date.now() } };
          });
          setDispatching(false);
          setStatus("");
          return;
        }
        if (kind === "work_progress") {
          const activity = typeof payload.verb === "string" ? payload.verb : "Working";
          const state = typeof payload.state === "string" ? payload.state : "step";
          setRuns((current) => {
            const previous = current[runId] ?? { runId, messageId: "assistant:" + runId, text: "", activity, status: "streaming" as const, lastSequence: -1, startedAt: Date.now() };
            return { ...current, [runId]: { ...previous, activity, status: state === "completed" ? previous.status : "streaming" } };
          });
          setDispatching(false);
          return;
        }
        const terminalStatus = String(payload.status ?? "completed");
        setRuns((current) => {
          const previous = current[runId];
          if (!previous) return current;
          const failed = terminalStatus === "failed";
          return { ...current, [runId]: { ...previous, activity: failed ? "Needs attention" : "Saved to workspace", status: failed ? "failed" : "completed" } };
        });
        setDispatching(false);
        window.setTimeout(() => { void refreshResources(); }, 120);
      },
      onDenied(reason) {
        scopeRef.current = null;
        setStatus("AMTECH stopped an invalid live conversation projection (" + reason + "). No owner action was replayed.");
      },
    });
  }, [employeeId, fixtureMode, installResources, mode, refreshResources]);

  const employeeName = res.employee?.name ?? res.operating_state?.context.employee_name ?? "Your employee";
  const durableMessages = useMemo(
    () => [...res.messages].sort((left, right) => left.created_at.localeCompare(right.created_at)).slice(-30),
    [res.messages],
  );
  const durableOwnerBodies = useMemo(
    () => new Set(durableMessages.filter((message) => ownerRole(message.direction)).map((message) => message.body)),
    [durableMessages],
  );
  const durableEmployeeBodies = useMemo(
    () => new Set(durableMessages.filter((message) => !ownerRole(message.direction)).map((message) => message.body)),
    [durableMessages],
  );
  const visiblePending = useMemo(
    () => pending.filter((turn) => turn.status === "failed" || !durableOwnerBodies.has(turn.body)),
    [durableOwnerBodies, pending],
  );
  const visibleRuns = useMemo(
    () => Object.values(runs)
      .filter((run) => !run.text || !durableEmployeeBodies.has(run.text))
      .sort((left, right) => left.startedAt - right.startedAt)
      .slice(-8),
    [durableEmployeeBodies, runs],
  );
  const suggestedPrompts = useMemo(() => {
    const values = [
      res.operating_state?.guidance.suggested_prompt,
      ...(res.operating_state?.loops ?? []).slice(0, 2).map((loop) => `What changed with ${loop.title}, and what should happen next?`),
    ];
    return values.filter((value): value is string => Boolean(value?.trim())).slice(0, 3);
  }, [res.operating_state]);
  const threadVersion = `${durableMessages.length}:${visiblePending.length}:${visibleRuns.map((run) => `${run.runId}:${run.text.length}:${run.status}`).join("|")}`;

  useEffect(() => {
    if (mode !== "talk") return;
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mode, threadVersion]);

  const sendMessage = useCallback(async (messageOverride?: string) => {
    const body = (messageOverride ?? input).trim();
    if (!body || dispatching) return;

    if (fixtureMode) {
      const intentId = createIntentId(employeeId);
      const now = new Date().toISOString();
      setPending((current) => [...current, { id: `pending:${intentId}`, intentId, body, createdAt: now, status: "accepted" }]);
      setInput("");
      const runId = `fixture:${intentId}`;
      setRuns((current) => ({
        ...current,
        [runId]: {
          runId,
          messageId: `assistant:${runId}`,
          text: "I picked that up. I’ll keep the conversation fast, move the work into the workspace when it becomes durable, and ask before anything consequential leaves the business.",
          activity: "Fixture response",
          status: "completed",
          lastSequence: 0,
          startedAt: Date.now(),
        },
      }));
      return;
    }

    const authority = protocolAuthority(scopeRef.current);
    if (!authority) {
      setStatus("AMTECH is restoring this employee’s exact assignment. Your message was not sent.");
      return;
    }

    const intentId = createIntentId(employeeId);
    const pendingId = `pending:${intentId}`;
    setPending((current) => [...current, {
      id: pendingId,
      intentId,
      body,
      createdAt: new Date().toISOString(),
      status: "sending",
    }]);
    setInput("");
    setDispatching(true);
    setStatus("Starting the turn…");

    // The durable Manager request may stay open until the run is terminal. The
    // composer unlocks as soon as SSE proves work started, with a bounded fallback
    // so the owner can queue the next thought instead of staring at a disabled UI.
    window.setTimeout(() => setDispatching(false), 1_200);

    try {
      const response = await fetch(`/api/employee/${employeeId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: body, intent_id: intentId, ...authority }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPending((current) => current.map((turn) => turn.id === pendingId ? { ...turn, status: "failed" } : turn));
        setInput((current) => current || body);
        setStatus(ownerError(json.error ?? "The turn was not accepted."));
        return;
      }
      setPending((current) => current.map((turn) => turn.id === pendingId ? { ...turn, status: "accepted" } : turn));
      setStatus(response.status === 202 ? "Queued safely. The employee will answer in order." : "Accepted. Streaming the response now.");
    } catch {
      setPending((current) => current.map((turn) => turn.id === pendingId ? { ...turn, status: "failed" } : turn));
      setInput((current) => current || body);
      setStatus("The connection ended before acceptance was proved. Retry keeps a new, explicit owner intent.");
    } finally {
      setDispatching(false);
    }
  }, [dispatching, employeeId, fixtureMode, input]);

  return (
    <div className={`nextgen-employee-shell mode-${mode}`}>
      <style>{SHELL_CSS}</style>
      <header className="nextgen-topbar">
        <div className="nextgen-identity">
          <a href="/dashboard" className="nextgen-brand">AMTECH<span>.</span></a>
          <div><strong>{employeeName}</strong><small>{res.operating_state?.context.business_name ?? "AI employee"}</small></div>
        </div>
        <nav aria-label="Employee view">
          <button type="button" className={mode === "talk" ? "active" : ""} onClick={() => setMode("talk")}>Talk</button>
          <button type="button" className={mode === "operate" ? "active" : ""} onClick={() => setMode("operate")}>Workspace</button>
        </nav>
        <div className={`nextgen-stream ${streamState}`}><span aria-hidden />{streamLabel(streamState)}</div>
      </header>

      {mode === "operate" ? (
        <div className="nextgen-operate"><AgentSurface employeeId={employeeId} fixtureMode={fixtureMode} /></div>
      ) : (
        <main className="nextgen-talk">
          <section className="nextgen-conversation" aria-label={`Conversation with ${employeeName}`}>
            <div className="nextgen-thread">
              {!durableMessages.length && !visiblePending.length && !visibleRuns.length ? (
                <div className="nextgen-welcome">
                  <p>Talk naturally. The workspace handles the rest.</p>
                  <h1>{res.operating_state?.guidance.headline ?? `What should ${employeeName} take on?`}</h1>
                  <span>{res.operating_state?.guidance.summary ?? "Responses stream here immediately. Durable work, approvals, connectors, and proof stay organized in Workspace."}</span>
                  {suggestedPrompts.length ? <div className="nextgen-prompts">{suggestedPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => setInput(prompt)}>{prompt}</button>)}</div> : null}
                </div>
              ) : null}

              {durableMessages.map((message) => (
                <article key={message.id} className={`nextgen-message ${ownerRole(message.direction) ? "owner" : "employee"}`}>
                  <div>{ownerRole(message.direction) ? "You" : employeeName}</div>
                  <p>{message.body}</p>
                  <small>{message.status === "delivered" ? formatTime(message.created_at) : message.status}</small>
                </article>
              ))}

              {visiblePending.map((turn) => (
                <article key={turn.id} className={`nextgen-message owner ${turn.status}`}>
                  <div>You</div><p>{turn.body}</p><small>{turn.status === "failed" ? "Not accepted" : turn.status === "sending" ? "Sending" : "Accepted"}</small>
                </article>
              ))}

              {visibleRuns.map((run) => (
                <article key={run.runId} className={`nextgen-message employee live ${run.status}`}>
                  <div>{employeeName}<span>{run.activity}</span></div>
                  {run.text ? <p>{run.text}{run.status === "streaming" ? <i aria-hidden /> : null}</p> : <p className="quiet">Working before the first words arrive…</p>}
                  <small>{run.status === "streaming" ? "Now" : run.status === "failed" ? "Needs attention" : "Saved"}</small>
                </article>
              ))}
              <div ref={threadEndRef} />
            </div>

            {status ? <div className="nextgen-status" role="status">{status}</div> : null}
            <div className="nextgen-composer">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                rows={1}
                placeholder={`Message ${employeeName}…`}
                aria-label={`Message ${employeeName}`}
              />
              <button type="button" onClick={() => void sendMessage()} disabled={!input.trim() || dispatching || (!fixtureMode && streamState !== "live")}>{dispatching ? "Starting" : "Send"}</button>
              <small>Enter to send · Shift+Enter for a new line · consequential actions still require their exact gate</small>
            </div>
          </section>

          <aside className="nextgen-rail" aria-label="Current employee context">
            <div className="nextgen-rail-head"><p>In the workspace</p><button type="button" onClick={() => setMode("operate")}>Open all</button></div>
            {(res.operating_state?.loops ?? []).slice(0, 3).map((loop) => <button type="button" key={loop.id} className="nextgen-context-card" onClick={() => setMode("operate")}><span>{readable(loop.state)}</span><strong>{loop.title}</strong><small>{loop.next_step ?? loop.summary ?? "Continue from current state"}</small></button>)}
            {(res.operating_state?.decisions ?? []).slice(0, 2).map((decision) => <button type="button" key={decision.id} className="nextgen-context-card attention" onClick={() => setMode("operate")}><span>Needs you</span><strong>{decision.title}</strong><small>{decision.consequence}</small></button>)}
            {!(res.operating_state?.loops?.length || res.operating_state?.decisions?.length) ? <div className="nextgen-empty-rail"><strong>No durable work yet</strong><span>Start naturally here. Work appears in the workspace only when there is something worth carrying forward.</span></div> : null}
          </aside>
        </main>
      )}
    </div>
  );
}

function ownerRole(direction: string): boolean {
  return direction === "from_owner" || direction === "to_employee";
}

function createIntentId(employeeId: string): string {
  const entropy = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `owner-web:${employeeId}:${entropy}`;
}

function streamLabel(state: StreamState): string {
  if (state === "live") return "Live";
  if (state === "reconnecting") return "Restoring";
  if (state === "offline") return "Unavailable";
  return "Connecting";
}

function ownerError(value: unknown): string {
  const error = String(value ?? "");
  if (error.includes("authority") || error.includes("assignment")) return "This employee assignment changed. AMTECH stopped the message instead of sending it under stale authority.";
  if (error.includes("rate")) return "This employee is briefly at capacity. Your message was not duplicated.";
  if (error.includes("runtime")) return "The employee runtime is recovering. Nothing was shown as complete.";
  return error || "AMTECH could not prove that the message was accepted.";
}

function formatTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function readable(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const SHELL_CSS = `
  .nextgen-employee-shell{min-height:100dvh;background:radial-gradient(circle at 50% -18rem,#e7f5ff 0,transparent 42rem),#f6f5f1;color:#101828;font-family:var(--amtech-font,Inter,ui-sans-serif,system-ui,sans-serif)}
  .nextgen-topbar{position:sticky;top:0;z-index:90;height:68px;padding:0 22px;display:grid;grid-template-columns:minmax(220px,1fr) auto minmax(160px,1fr);align-items:center;gap:18px;border-bottom:1px solid rgba(15,23,42,.1);background:rgba(255,255,255,.82);backdrop-filter:blur(24px)}
  .nextgen-identity{display:flex;align-items:center;gap:14px;min-width:0}.nextgen-brand{font-size:15px;font-weight:900;letter-spacing:.04em;color:#101828;text-decoration:none}.nextgen-brand span{color:#e11d2e}.nextgen-identity>div{display:grid;min-width:0}.nextgen-identity strong{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nextgen-identity small{font-size:11px;color:#667085;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .nextgen-topbar nav{display:flex;padding:3px;border:1px solid rgba(15,23,42,.1);border-radius:13px;background:#f3f4f6}.nextgen-topbar nav button{border:0;border-radius:10px;padding:8px 16px;background:transparent;color:#667085;font:inherit;font-size:12px;font-weight:760;cursor:pointer}.nextgen-topbar nav button.active{background:#fff;color:#101828;box-shadow:0 1px 3px rgba(15,23,42,.12)}
  .nextgen-stream{justify-self:end;display:flex;align-items:center;gap:7px;font-size:11px;font-weight:760;color:#667085}.nextgen-stream span{width:8px;height:8px;border-radius:999px;background:#eab308;box-shadow:0 0 0 4px rgba(234,179,8,.12)}.nextgen-stream.live span{background:#16a34a;box-shadow:0 0 0 4px rgba(22,163,74,.12)}.nextgen-stream.offline span{background:#dc2626;box-shadow:0 0 0 4px rgba(220,38,38,.1)}
  .nextgen-talk{width:min(1280px,100%);min-height:calc(100dvh - 68px);margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:22px;padding:22px}
  .nextgen-conversation{min-width:0;min-height:calc(100dvh - 112px);display:grid;grid-template-rows:minmax(0,1fr) auto auto;border:1px solid rgba(15,23,42,.11);border-radius:24px;background:rgba(255,255,255,.9);box-shadow:0 22px 70px rgba(15,23,42,.08);overflow:hidden}
  .nextgen-thread{overflow:auto;padding:32px clamp(18px,5vw,64px);scrollbar-gutter:stable}.nextgen-welcome{max-width:760px;margin:7vh auto 32px;text-align:center}.nextgen-welcome>p{margin:0 0 12px;color:#e11d2e;font-size:11px;font-weight:850;letter-spacing:.12em;text-transform:uppercase}.nextgen-welcome h1{margin:0;font-size:clamp(32px,5vw,58px);line-height:1.02;letter-spacing:-.045em}.nextgen-welcome>span{display:block;max-width:650px;margin:18px auto 0;color:#667085;font-size:15px;line-height:1.65}.nextgen-prompts{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:26px}.nextgen-prompts button{max-width:100%;padding:10px 13px;border:1px solid rgba(15,23,42,.1);border-radius:999px;background:#fff;color:#344054;font:inherit;font-size:12px;cursor:pointer}.nextgen-prompts button:hover{border-color:#e11d2e;color:#b42318}
  .nextgen-message{position:relative;width:min(82%,720px);margin:0 0 18px;padding:14px 16px;border-radius:18px}.nextgen-message>div{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px;font-size:11px;font-weight:820;color:#667085}.nextgen-message>div span{font-weight:650;color:#98a2b3}.nextgen-message p{margin:0;white-space:pre-wrap;font-size:15px;line-height:1.58}.nextgen-message small{display:block;margin-top:7px;color:#98a2b3;font-size:10px}.nextgen-message.owner{margin-left:auto;background:#111827;color:#fff;border-bottom-right-radius:6px}.nextgen-message.owner>div,.nextgen-message.owner small{color:#cbd5e1}.nextgen-message.owner.failed{background:#7f1d1d}.nextgen-message.employee{margin-right:auto;border:1px solid #e5e7eb;background:#fff;border-bottom-left-radius:6px;box-shadow:0 7px 20px rgba(15,23,42,.045)}.nextgen-message.employee.live.streaming{border-color:rgba(37,99,235,.22);box-shadow:0 8px 28px rgba(37,99,235,.08)}.nextgen-message.employee.failed{border-color:rgba(220,38,38,.24);background:#fff7f7}.nextgen-message p.quiet{color:#667085;font-style:italic}.nextgen-message i{display:inline-block;width:2px;height:1em;margin-left:3px;vertical-align:-2px;background:#e11d2e;animation:nextgen-caret 1s steps(1) infinite}
  .nextgen-status{padding:9px 18px;border-top:1px solid rgba(15,23,42,.07);background:#f8fafc;color:#667085;font-size:11px;text-align:center}
  .nextgen-composer{padding:14px 16px 12px;border-top:1px solid rgba(15,23,42,.1);background:rgba(255,255,255,.96);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px}.nextgen-composer textarea{min-height:48px;max-height:180px;resize:vertical;padding:13px 15px;border:1px solid rgba(15,23,42,.14);border-radius:16px;background:#fff;color:#101828;font:inherit;font-size:15px;line-height:1.45;outline:none}.nextgen-composer textarea:focus{border-color:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,.1)}.nextgen-composer>button{align-self:stretch;min-width:86px;border:0;border-radius:15px;background:#111827;color:#fff;font:inherit;font-size:13px;font-weight:820;cursor:pointer}.nextgen-composer>button:disabled{opacity:.42;cursor:not-allowed}.nextgen-composer small{grid-column:1/-1;color:#98a2b3;font-size:10px;text-align:center}
  .nextgen-rail{align-self:start;position:sticky;top:90px;display:grid;gap:10px}.nextgen-rail-head{display:flex;align-items:center;justify-content:space-between;padding:2px 2px 5px}.nextgen-rail-head p{margin:0;font-size:11px;font-weight:840;text-transform:uppercase;letter-spacing:.1em;color:#667085}.nextgen-rail-head button{border:0;background:transparent;color:#2563eb;font:inherit;font-size:11px;font-weight:760;cursor:pointer}.nextgen-context-card{display:grid;gap:7px;width:100%;padding:15px;text-align:left;border:1px solid rgba(15,23,42,.1);border-radius:17px;background:rgba(255,255,255,.86);box-shadow:0 9px 28px rgba(15,23,42,.05);font:inherit;cursor:pointer}.nextgen-context-card span{font-size:10px;font-weight:830;letter-spacing:.08em;text-transform:uppercase;color:#2563eb}.nextgen-context-card strong{font-size:13px;line-height:1.25}.nextgen-context-card small{color:#667085;line-height:1.45}.nextgen-context-card.attention span{color:#e11d2e}.nextgen-empty-rail{display:grid;gap:8px;padding:18px;border:1px dashed rgba(15,23,42,.16);border-radius:17px;color:#667085}.nextgen-empty-rail strong{color:#344054;font-size:13px}.nextgen-empty-rail span{font-size:12px;line-height:1.5}
  .nextgen-operate .os-header{display:none}.nextgen-operate .os-root{min-height:calc(100dvh - 68px)}
  @keyframes nextgen-caret{50%{opacity:0}}
  @media(max-width:900px){.nextgen-talk{grid-template-columns:1fr;padding:12px}.nextgen-rail{position:static;grid-row:1;display:flex;overflow:auto;padding-bottom:2px}.nextgen-rail-head{display:none}.nextgen-context-card{min-width:250px}.nextgen-conversation{min-height:calc(100dvh - 104px)}.nextgen-topbar{grid-template-columns:1fr auto}.nextgen-stream{display:none}}
  @media(max-width:620px){.nextgen-topbar{height:60px;padding:0 12px;gap:8px}.nextgen-identity small{display:none}.nextgen-topbar nav button{padding:7px 11px}.nextgen-talk{min-height:calc(100dvh - 60px);padding:0}.nextgen-rail{display:none}.nextgen-conversation{min-height:calc(100dvh - 60px);border:0;border-radius:0;box-shadow:none}.nextgen-thread{padding:22px 13px}.nextgen-welcome{margin-top:5vh}.nextgen-message{width:min(91%,720px)}.nextgen-composer{padding:10px}.nextgen-composer small{display:none}}
  @media(prefers-reduced-motion:reduce){.nextgen-message i{animation:none}.nextgen-thread{scroll-behavior:auto}}
`;

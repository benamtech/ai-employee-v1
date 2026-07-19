"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  planAdaptiveOperatingLayout,
  type ActiveSave,
  type OperatingContextManifest,
  type OperatingDecision,
  type OperatingEvidence,
  type OperatingSurfaceState,
  type OperatingSystemChange,
  type OperatingWorkLoop,
  type ResourcePayload,
} from "@amtech/shared";
import {
  FIXTURE_SCENARIOS,
  fixtureRuntimeForEmployee,
  planFixtureCommand,
  type FixtureRuntimeFrame,
  type FixtureRuntimeProjection,
  type FixtureScenarioId,
} from "../../agent/[employeeId]/fixture-runtime";

export function FixtureLabClient({
  scenarioId,
  employeeId,
}: {
  scenarioId: FixtureScenarioId;
  employeeId: string;
}) {
  const session = useMemo(() => fixtureRuntimeForEmployee(employeeId), [employeeId]);
  const [payload, setPayload] = useState<ResourcePayload>(session.initial_payload);
  const [projection, setProjection] = useState<FixtureRuntimeProjection>(session.initial_projection);
  const [progress, setProgress] = useState(session.initial_projection.summary);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("Fixture demonstration only. No provider, customer, money, publishing, inventory, or runtime effect can occur here.");
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);
  const operating = useMemo(() => payload.operating_state ?? deriveOperatingState(payload, employeeId), [employeeId, payload]);

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current = [];
  }, []);

  const scheduleFrames = useCallback((frames: FixtureRuntimeFrame[]) => {
    for (const frame of frames) {
      timers.current.push(window.setTimeout(() => {
        setProjection(frame.projection);
        setProgress(frame.progress ?? frame.projection.summary);
      }, frame.after_ms));
    }
  }, []);

  useEffect(() => {
    setPayload(session.initial_payload);
    setProjection(session.initial_projection);
    setProgress(session.initial_projection.summary);
    setInput("");
    setRunning(false);
    clearTimers();
    scheduleFrames(session.frames);
    return clearTimers;
  }, [clearTimers, scheduleFrames, session]);

  function resetScenario() {
    clearTimers();
    setPayload(session.initial_payload);
    setProjection(session.initial_projection);
    setProgress(session.initial_projection.summary);
    setInput("");
    setRunning(false);
    setNotice("Scenario reset to its deterministic fixture snapshot. No command was replayed.");
    scheduleFrames(session.frames);
  }

  function simulateHeartbeatGap() {
    clearTimers();
    const observedAt = new Date().toISOString();
    setProjection((current) => ({
      ...current,
      sequence: current.sequence + 1,
      observed_at: observedAt,
      phase: "working",
      health: "active",
      summary: "The fixture run is active, but the next owner-safe heartbeat has been intentionally withheld.",
    }));
    setProgress("Waiting for the next owner-safe heartbeat");
    setNotice("The lab paused heartbeat delivery. The browser will not resend the command or restart a runtime.");
    timers.current.push(window.setTimeout(() => {
      setProjection((current) => ({
        ...current,
        sequence: current.sequence + 1,
        observed_at: new Date().toISOString(),
        phase: "reconciling",
        health: "stalled",
        summary: "No recent liveness confirmation. The surface is reconciling state and explicitly forbids command replay.",
      }));
      setProgress("Heartbeat overdue; state reconciliation required");
    }, 1600));
  }

  function recoverProjection() {
    clearTimers();
    setProjection((current) => ({
      ...current,
      sequence: current.sequence + 1,
      observed_at: new Date().toISOString(),
      phase: "recovering",
      health: "recovering",
      summary: "Requesting a fresh fixture snapshot and preserving the original intent without replay.",
    }));
    setProgress("Recovering from the current snapshot");
    setNotice("Recovery is a state refresh in this lab. It does not execute a second command.");
    timers.current.push(window.setTimeout(() => {
      setProjection((current) => ({
        ...current,
        sequence: current.sequence + 1,
        observed_at: new Date().toISOString(),
        phase: "completed",
        health: "completed",
        summary: "Fresh fixture state restored. The original command was not replayed.",
      }));
      setProgress("");
    }, 900));
  }

  function submitFixtureCommand() {
    const body = input.trim();
    if (!body || running) return;
    const plan = planFixtureCommand(payload, operating, scenarioId, body);
    clearTimers();
    setPayload(plan.accepted);
    setInput("");
    setRunning(true);
    setNotice("Fixture intent accepted locally. The lab is projecting bounded work; no real employee runtime or external system is being called.");
    scheduleFrames(plan.frames);
    timers.current.push(window.setTimeout(() => {
      setPayload(plan.completed);
      setRunning(false);
      setNotice("Fixture work reached its projected owner state. Any decision remains simulated and no external effect occurred.");
    }, plan.completion_delay_ms + 40));
  }

  function resolveFixtureDecision(decision: OperatingDecision, resolution: "approved" | "rejected") {
    const now = new Date().toISOString();
    setPayload((current) => {
      const state = current.operating_state ?? deriveOperatingState(current, employeeId);
      const nextChange: OperatingSystemChange = {
        id: `fixture_resolution_${decision.id}_${Date.now()}`,
        title: resolution === "approved" ? `Approval path simulated: ${decision.title}` : `Decline path simulated: ${decision.title}`,
        summary: resolution === "approved"
          ? "The fixture shows where Manager authority, C3, provider execution, receipt, and proof would continue. None of those effects ran."
          : "The fixture held the branch and projected that the employee would revise, stop, or ask for another direction.",
        source: "fixture decision",
        state: resolution === "approved" ? "prepared" : "observed",
        occurred_at: now,
        proof: { assignment_id: state.context.assignment_id, source_table: "fixture_decision_resolutions", source_id: decision.id },
      };
      const nextEvidence: OperatingEvidence = {
        id: `fixture_resolution_evidence_${decision.id}_${Date.now()}`,
        title: resolution === "approved" ? "Simulated approval boundary" : "Simulated decline boundary",
        summary: "Interaction evidence only. No accepted provider receipt or production proof exists.",
        state: "draft",
        recorded_at: now,
        proof: { assignment_id: state.context.assignment_id, source_table: "fixture_decision_resolutions", source_id: decision.id },
      };
      const nextState = relayout({
        ...state,
        generated_at: now,
        guidance: {
          headline: resolution === "approved" ? "The approved path is visible, but not executed" : "The branch is safely held",
          summary: nextChange.summary ?? "Fixture decision projected.",
          suggested_prompt: resolution === "approved" ? "Show the exact production authority and receipt path that would be required." : "Revise the work without taking the declined action.",
          mode: resolution === "approved" ? "working" : "blocked",
        },
        decisions: state.decisions.filter((item) => item.id !== decision.id),
        changes: [nextChange, ...state.changes],
        evidence: [nextEvidence, ...state.evidence],
      });
      return { ...current, operating_state: nextState };
    });
    setNotice(resolution === "approved"
      ? "Approval path simulated. The lab stopped before Manager authority, C3, provider execution, or receipt creation."
      : "Decline path simulated. The fixture branch remains held and no external effect occurred.");
  }

  return (
    <main className="fixture-lab-root" data-fixture-scenario={scenarioId}>
      <style>{LAB_CSS}</style>
      <header className="fixture-lab-header">
        <div>
          <Link href="/ui-lab" className="fixture-lab-brand">AMTECH<span>.</span></Link>
          <div>
            <strong>Fixture Operating Lab</strong>
            <small>typed optimistic employee runtime</small>
          </div>
        </div>
        <button type="button" onClick={resetScenario}>Reset scenario</button>
      </header>

      <nav className="fixture-lab-nav" aria-label="Fixture employee scenarios">
        {FIXTURE_SCENARIOS.map((scenario) => (
          <Link key={scenario.id} className={scenario.id === scenarioId ? "active" : ""} href={`/ui-lab/${scenario.id}`}>
            {scenario.shortLabel}
          </Link>
        ))}
      </nav>

      <div className={`fixture-lab-shell ${operating.layout.density}`}>
        <section className="fixture-lab-intro">
          <div>
            <p>Fixture demonstration only</p>
            <h1>{session.scenario.label}</h1>
            <span>{session.scenario.summary}</span>
          </div>
          <dl>
            <div><dt>Employee</dt><dd>{operating.context.employee_name}</dd></div>
            <div><dt>Business</dt><dd>{operating.context.business_name ?? "Fixture business"}</dd></div>
            <div><dt>Profile</dt><dd>{operating.context.profile_key ?? "fixture"}</dd></div>
            <div><dt>Evidence</dt><dd>fixture_demonstration</dd></div>
          </dl>
        </section>

        <section className={`fixture-heartbeat ${projection.health}`} aria-live="polite">
          <div className="fixture-heartbeat-state">
            <span className="fixture-heartbeat-dot" aria-hidden />
            <div>
              <p>Owner-safe runtime projection</p>
              <h2>{readable(projection.health)} · {readable(projection.phase)}</h2>
            </div>
          </div>
          <div className="fixture-heartbeat-summary">
            <strong>{projection.summary}</strong>
            <span>{progress || "No non-terminal progress is currently projected."}</span>
          </div>
          <dl>
            <div><dt>Run</dt><dd>{projection.run_id}</dd></div>
            <div><dt>Sequence</dt><dd>{projection.sequence}</dd></div>
            <div><dt>Observed</dt><dd>{formatDate(projection.observed_at)}</dd></div>
            <div><dt>Context</dt><dd>{projection.context_version ?? "not supplied"}</dd></div>
          </dl>
          <div className="fixture-heartbeat-actions">
            <button type="button" onClick={simulateHeartbeatGap}>Simulate heartbeat gap</button>
            <button type="button" className="secondary" onClick={recoverProjection}>Recover without replay</button>
          </div>
          <small>Heartbeat proves liveness only. It never proves correctness, authority, an external effect, or a durable receipt.</small>
        </section>

        <div className="fixture-notice" role="status">{notice}</div>

        <section className={`fixture-guidance ${operating.guidance.mode}`}>
          <p>{guidanceEyebrow(operating)}</p>
          <h2>{operating.guidance.headline}</h2>
          <span>{operating.guidance.summary}</span>
          {operating.guidance.suggested_prompt ? (
            <button type="button" onClick={() => setInput(operating.guidance.suggested_prompt ?? "")}>Use suggested direction</button>
          ) : null}
        </section>

        {operating.decisions.length ? (
          <LabSection title="Needs you" summary="Consequential branches remain explicit and simulated.">
            <div className="fixture-card-grid">
              {operating.decisions.map((decision) => (
                <article className={`fixture-card decision ${decision.risk}`} key={decision.id}>
                  <p>{readable(decision.risk)} impact</p>
                  <h3>{decision.title}</h3>
                  <span>{decision.consequence}</span>
                  <div className="fixture-card-actions">
                    <button type="button" onClick={() => resolveFixtureDecision(decision, "approved")}>Simulate approve path</button>
                    <button type="button" className="secondary" onClick={() => resolveFixtureDecision(decision, "rejected")}>Simulate decline path</button>
                  </div>
                </article>
              ))}
            </div>
          </LabSection>
        ) : null}

        <LabSection title="Current work" summary="Persistent outcomes carried across systems, sessions, roles, and time.">
          <div className="fixture-card-grid">
            {operating.loops.map((loop) => (
              <article className={`fixture-card loop ${loop.state}`} key={loop.id}>
                <p>{readable(loop.domain)} · {readable(loop.state)}</p>
                <h3>{loop.title}</h3>
                <span>{loop.summary ?? loop.next_step}</span>
                <dl>
                  <div><dt>Next</dt><dd>{loop.next_step ?? "Continue"}</dd></div>
                  {loop.return_condition ? <div><dt>Returns when</dt><dd>{loop.return_condition.description}</dd></div> : null}
                </dl>
              </article>
            ))}
          </div>
        </LabSection>

        {operating.active_saves.length ? (
          <LabSection title="Held for return" summary="Future intentions with an explicit reason and return condition.">
            <div className="fixture-card-grid">
              {operating.active_saves.map((save) => (
                <article className={`fixture-card save ${save.state}`} key={save.id}>
                  <p>{readable(save.state)}</p>
                  <h3>{save.title}</h3>
                  <span>{save.why_held}</span>
                  <dl><div><dt>Returns when</dt><dd>{save.return_condition.description}</dd></div></dl>
                </article>
              ))}
            </div>
          </LabSection>
        ) : null}

        {operating.delegated_work.length ? (
          <LabSection title="Delegated work" summary="Bounded contributors are shown by purpose, state, and material result.">
            <div className="fixture-list">
              {operating.delegated_work.map((unit) => (
                <article key={unit.id}>
                  <div><p>{readable(unit.executor_kind)}</p><strong>{unit.title}</strong><span>{unit.purpose}</span></div>
                  <div><b>{readable(unit.state)}</b><small>{unit.result_summary ?? unit.blocking_reason ?? unit.executor_label ?? "Bounded fixture work"}</small></div>
                </article>
              ))}
            </div>
          </LabSection>
        ) : null}

        {operating.changes.length ? (
          <LabSection title="What changed" summary="Meaningful owner-safe changes, not a raw event firehose.">
            <div className="fixture-list changes">
              {operating.changes.map((change) => (
                <article key={change.id}>
                  <time>{formatDate(change.occurred_at)}</time>
                  <div><strong>{change.title}</strong><span>{change.summary ?? `Recorded from ${change.source}.`}</span></div>
                  <b>{readable(change.state)}</b>
                </article>
              ))}
            </div>
          </LabSection>
        ) : null}

        {operating.evidence.length ? (
          <LabSection title="Evidence and outcomes" summary="Fixture artifacts and proof-shaped records remain visibly non-production.">
            <div className="fixture-list evidence">
              {operating.evidence.map((item) => (
                <article key={item.id}>
                  <div><strong>{item.title}</strong><span>{item.summary ?? "Fixture evidence."}</span></div>
                  <b>{readable(item.state)}</b>
                </article>
              ))}
            </div>
          </LabSection>
        ) : null}

        {(payload.connection_surfaces ?? []).length ? (
          <LabSection title="Connected systems" summary="Capabilities and limitations are projected without real credentials or provider payloads.">
            <div className="fixture-card-grid connections">
              {(payload.connection_surfaces ?? []).map((connection) => (
                <article className={`fixture-card connection ${connection.state}`} key={connection.id}>
                  <p>{readable(connection.state)}</p>
                  <h3>{connection.label}</h3>
                  <span>{connection.what_employee_can_do}</span>
                  <small>{connection.last_event ?? connection.health ?? "Fixture connection"}</small>
                </article>
              ))}
            </div>
          </LabSection>
        ) : null}

        <details className="fixture-context">
          <summary>Inspect bounded context and layout rationale</summary>
          <dl>
            <div><dt>Assignment</dt><dd>{operating.context.assignment_id}</dd></div>
            <div><dt>Session</dt><dd>{operating.context.session_id ?? "none"}</dd></div>
            <div><dt>Context fingerprint</dt><dd>{operating.layout.context_fingerprint}</dd></div>
            <div><dt>Primary region</dt><dd>{readable(operating.layout.primary_region)}</dd></div>
            <div><dt>Rationale</dt><dd>{operating.layout.rationale_codes.map(readable).join(" · ")}</dd></div>
          </dl>
          <p>Raw memory, USER.md, skills, prompts, provider payloads, credentials, and private reasoning are not exposed or editable here.</p>
        </details>

        <section className="fixture-command" aria-label={`Run a fixture outcome with ${operating.context.employee_name}`}>
          <div>
            <strong>Run an optimistic fixture interaction</strong>
            <span>Describe an outcome. The lab will form work, delegate a bounded unit, project heartbeat frames, and return a simulated decision, save, or evidence object.</span>
          </div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submitFixtureCommand();
            }}
            rows={4}
            aria-label={`Fixture command ${operating.context.employee_name}`}
            placeholder={fixturePlaceholder(scenarioId)}
          />
          <button type="button" disabled={!input.trim() || running} onClick={submitFixtureCommand}>{running ? "Projecting…" : "Run fixture interaction"}</button>
          <small>Nothing in this lab counts as provider, browser/channel, commercial, deployment, or production acceptance.</small>
        </section>
      </div>
    </main>
  );
}

function LabSection({ title, summary, children }: { title: string; summary: string; children: React.ReactNode }) {
  return <section className="fixture-section"><header><div><p>{title}</p><h2>{title}</h2></div><span>{summary}</span></header>{children}</section>;
}

function deriveOperatingState(payload: ResourcePayload, employeeId: string): OperatingSurfaceState {
  const now = new Date().toISOString();
  const assignmentId = payload.assignment_id ?? "asn_fixture_contractor";
  const loops: OperatingWorkLoop[] = (payload.tasks ?? []).map((task) => ({
    id: `loop:${task.id}`,
    title: task.title,
    summary: task.summary,
    state: task.status === "in_progress" ? "active" : task.status === "scheduled" ? "waiting" : task.status,
    horizon: task.status === "scheduled" ? "later" : "now",
    domain: "custom",
    updated_at: task.created_at ?? now,
    next_step: task.status === "needs_you" ? "Owner input" : task.status === "blocked" ? "Clear the dependency" : "Continue",
    return_condition: task.status === "scheduled" ? { kind: "time", description: task.summary ?? "Return at the scheduled time", due_at: task.created_at ?? null } : null,
    source_envelope_ids: [],
    target: task.target_id ? { kind: task.type, id: task.target_id } : null,
    proof: { assignment_id: assignmentId, source_table: "fixture_tasks", source_id: task.id },
  }));
  const saves: ActiveSave[] = (payload.resurface_items ?? []).map((item) => ({
    id: `save:${item.id}`,
    title: item.title,
    why_held: item.why,
    state: item.status === "scheduled" ? "scheduled" : item.status === "needs_you" ? "needs_you" : item.status === "blocked" || item.status === "failed" ? "blocked" : "waiting",
    return_condition: { kind: item.status === "scheduled" ? "time" : item.status === "needs_you" ? "owner" : item.kind === "connector" ? "dependency" : "event", description: item.why, due_at: item.resurface_at ?? null, source: item.channel },
    target: item.target ?? null,
    proof: { ...item.proof, assignment_id: assignmentId },
  }));
  const decisions: OperatingDecision[] = payload.approvals.map((approval) => ({
    id: `decision:${approval.id}`,
    title: approval.summary,
    consequence: "This action is held until an authorized owner decides. The fixture will not execute it.",
    risk: approval.risk_level === "low" ? "low" : approval.risk_level === "medium" ? "medium" : "high",
    target: { kind: "approval", id: approval.id },
    proof: { approval_id: approval.id, assignment_id: assignmentId },
  }));
  const changes: OperatingSystemChange[] = payload.work_events.map((event) => ({
    id: `change:${event.id}`,
    title: event.work_event_descriptor?.title ?? readable(event.event_type),
    summary: event.work_event_descriptor?.summary,
    source: "fixture",
    state: event.status === "failed" ? "failed" : "observed",
    occurred_at: event.created_at,
    proof: { inbound_event_id: event.id, assignment_id: assignmentId },
  }));
  const evidence: OperatingEvidence[] = (payload.outputs ?? []).map((output) => ({
    id: `evidence:${output.id}`,
    title: output.title,
    summary: output.summary,
    state: output.status === "failed" ? "failed" : output.status === "draft" ? "draft" : "recorded",
    recorded_at: output.created_at ?? now,
    href: output.href ?? null,
    proof: { artifact_id: output.artifact_id ?? null, assignment_id: assignmentId },
  }));
  const context: OperatingContextManifest = {
    version: 1,
    generated_at: now,
    account_id: payload.account_id,
    assignment_id: assignmentId,
    employee_id: payload.employee_id ?? employeeId,
    employee_name: payload.employee?.name ?? "Avery",
    business_name: "Contractor fixture business",
    business_kind: "service contractor",
    profile_key: payload.employee?.profile_id ?? "contractor_fixture",
    profile_version: "fixture",
    session_id: "fixture-session",
    session_last_active: now,
    runtime_context_version: "fixture",
    doctrine_versions: { design_system: "fixture", agent_interface: "fixture" },
    dominant_domains: ["customer", "finance", "operations"],
    owner_experience: "guided",
    preferred_density: "balanced",
    signals: [],
  };
  const layout = planAdaptiveOperatingLayout({
    generated_at: now,
    context_fingerprint: "sha256:fixture-contractor",
    owner_experience: context.owner_experience,
    preferred_density: context.preferred_density,
    loops,
    active_saves: saves,
    decisions,
    changes,
    delegated_work: [],
    evidence,
    connection_attention_count: (payload.connection_surfaces ?? []).filter((connection) => connection.state === "needs_you").length,
  });
  return {
    version: 1,
    generated_at: now,
    guidance: decisions.length
      ? { headline: `${context.employee_name} has ${decisions.length} decisions ready`, summary: "Fixture contractor work shows estimates, customer communication, money gates, scheduling, saves, and evidence.", suggested_prompt: "Explain the most important decision and what happens next.", mode: "needs_you" }
      : { headline: `${context.employee_name} is ready`, summary: "Give the fixture employee a contractor outcome to carry across time and systems.", suggested_prompt: "Prepare the next customer job package.", mode: "quiet" },
    focus_loop_id: layout.focus_loop_id,
    loops,
    active_saves: saves,
    decisions,
    changes,
    delegated_work: [],
    evidence,
    context,
    layout,
  };
}

function relayout(state: OperatingSurfaceState): OperatingSurfaceState {
  const layout = planAdaptiveOperatingLayout({
    generated_at: state.generated_at,
    context_fingerprint: state.layout.context_fingerprint,
    owner_experience: state.context.owner_experience,
    preferred_density: state.context.preferred_density,
    loops: state.loops,
    active_saves: state.active_saves,
    decisions: state.decisions,
    changes: state.changes,
    delegated_work: state.delegated_work,
    evidence: state.evidence,
    connection_attention_count: 0,
  });
  return { ...state, focus_loop_id: layout.focus_loop_id, layout };
}

function guidanceEyebrow(operating: OperatingSurfaceState): string {
  if (operating.guidance.mode === "needs_you") return "Your judgment is needed";
  if (operating.guidance.mode === "blocked") return "Work is safely held";
  if (operating.guidance.mode === "working") return "Employee operating now";
  if (operating.guidance.mode === "degraded") return "Degraded but explicit";
  return "Stable fixture state";
}

function fixturePlaceholder(scenario: FixtureScenarioId): string {
  if (scenario === "clothing-ops") return "Example: Reconcile today's Shopify orders with blank inventory, embroidery capacity, supplier pricing, margin targets, and promised ship dates. Bring back the smallest safe purchase decision.";
  if (scenario === "website") return "Example: Qualify this visitor, answer only public questions, collect the missing scope, and prepare a private office handoff for approval.";
  if (scenario === "office") return "Example: Rebuild Monday's schedule across dispatcher, estimator, bookkeeper, and field crews without breaking customer promises or payroll constraints.";
  if (scenario === "personal-brain") return "Example: Hold this pricing idea until the next qualified customer conversation, preserve why it matters, and bring it back during my weekly review.";
  if (scenario === "research") return "Example: Compare the strongest primary evidence, preserve contradictions, delegate the methodology review, and ask me to choose the recommendation scope.";
  return "Example: Prepare the estimate, customer reply, deposit request, schedule window, and follow-up plan, then stop at the exact approval gates.";
}

function readable(value: string): string {
  return String(value).replace(/[_:-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value?: string | null): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" });
}

const LAB_CSS = `
  .fixture-lab-root{min-height:100dvh;background:radial-gradient(circle at 7% 0%,rgba(223,246,255,.95),transparent 34rem),radial-gradient(circle at 94% 5%,rgba(225,29,42,.065),transparent 28rem),var(--amtech-canvas);color:var(--amtech-ink)}
  .fixture-lab-header{position:sticky;top:0;z-index:40;min-height:72px;padding:12px clamp(16px,4vw,48px);display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid var(--amtech-line);background:rgba(255,255,255,.9);backdrop-filter:blur(28px)}.fixture-lab-header>div{display:flex;align-items:center;gap:12px}.fixture-lab-brand{font-weight:880;letter-spacing:.04em;text-decoration:none}.fixture-lab-brand span{color:var(--amtech-red)}.fixture-lab-header>div>div{display:grid}.fixture-lab-header strong{font-size:14px}.fixture-lab-header small{color:var(--amtech-muted);font-size:11px}.fixture-lab-header button{min-height:44px;padding:0 16px;border:1px solid var(--amtech-line-strong);border-radius:999px;background:#fff;font-weight:750}
  .fixture-lab-nav{position:sticky;top:72px;z-index:35;padding:8px clamp(16px,4vw,48px);display:flex;gap:8px;overflow-x:auto;border-bottom:1px solid var(--amtech-line);background:rgba(247,249,252,.92);backdrop-filter:blur(24px)}.fixture-lab-nav a{min-height:44px;padding:0 14px;display:inline-flex;align-items:center;border:1px solid transparent;border-radius:999px;color:var(--amtech-muted);font-size:12px;font-weight:760;text-decoration:none;white-space:nowrap}.fixture-lab-nav a.active{border-color:rgba(225,29,42,.18);background:#fff;color:var(--amtech-red);box-shadow:var(--amtech-shadow-card)}
  .fixture-lab-shell{width:min(1260px,100%);margin:0 auto;padding:24px clamp(16px,4vw,42px) 176px;display:grid;gap:28px}.fixture-lab-shell.dense{width:min(1440px,100%)}
  .fixture-lab-intro{padding:clamp(24px,5vw,48px);display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.7fr);gap:30px;border:1px solid var(--amtech-line);border-radius:var(--amtech-radius-panel);background:rgba(255,255,255,.88);box-shadow:var(--amtech-shadow-float)}.fixture-lab-intro p,.fixture-guidance>p,.fixture-section>header p,.fixture-card>p,.fixture-list p,.fixture-heartbeat p{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--amtech-red)}.fixture-lab-intro h1{margin:8px 0 14px;font-size:clamp(38px,7vw,72px);line-height:.95;letter-spacing:-.052em}.fixture-lab-intro>div>span{display:block;max-width:720px;color:var(--amtech-muted);font-size:16px;line-height:1.6}.fixture-lab-intro dl,.fixture-heartbeat dl,.fixture-context dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.fixture-lab-intro dl div,.fixture-heartbeat dl div,.fixture-context dl div{padding:11px 12px;border:1px solid var(--amtech-line);border-radius:14px;background:var(--amtech-canvas)}dt{font-size:10px;color:var(--amtech-muted)}dd{margin:3px 0 0;font-size:12px;font-weight:720;overflow-wrap:anywhere}
  .fixture-heartbeat{padding:22px;display:grid;grid-template-columns:minmax(220px,.7fr) minmax(280px,1.3fr);gap:18px;border:1px solid rgba(37,99,235,.18);border-radius:var(--amtech-radius-card);background:rgba(255,255,255,.9);box-shadow:var(--amtech-shadow-card)}.fixture-heartbeat.stalled{border-color:rgba(225,29,42,.28);background:var(--amtech-danger-soft)}.fixture-heartbeat.recovering{border-color:rgba(37,99,235,.28);background:var(--amtech-blue-soft)}.fixture-heartbeat.completed{border-color:rgba(22,138,87,.22);background:var(--amtech-green-soft)}.fixture-heartbeat-state{display:flex;align-items:center;gap:12px}.fixture-heartbeat-dot{width:12px;height:12px;border-radius:50%;background:var(--amtech-blue);box-shadow:0 0 0 7px rgba(37,99,235,.08)}.fixture-heartbeat.stalled .fixture-heartbeat-dot{background:var(--amtech-red);box-shadow:0 0 0 7px rgba(225,29,42,.08)}.fixture-heartbeat.completed .fixture-heartbeat-dot{background:var(--amtech-green);box-shadow:0 0 0 7px rgba(22,138,87,.08)}.fixture-heartbeat h2{margin-top:4px;font-size:24px}.fixture-heartbeat-summary{display:grid;gap:7px}.fixture-heartbeat-summary strong{font-size:15px;line-height:1.45}.fixture-heartbeat-summary span{color:var(--amtech-muted);font-size:13px}.fixture-heartbeat dl{grid-column:1/-1;grid-template-columns:repeat(4,minmax(0,1fr))}.fixture-heartbeat-actions{grid-column:1/-1;display:flex;gap:10px;flex-wrap:wrap}.fixture-heartbeat-actions button,.fixture-guidance button,.fixture-card-actions button,.fixture-command>button{min-height:44px;padding:0 16px;border:1px solid var(--amtech-red);border-radius:999px;background:var(--amtech-red);color:#fff;font-weight:780}.fixture-heartbeat-actions button.secondary,.fixture-card-actions button.secondary{border-color:var(--amtech-line-strong);background:#fff;color:var(--amtech-ink)}.fixture-heartbeat>small{grid-column:1/-1;color:var(--amtech-muted);font-size:11px}
  .fixture-notice{padding:13px 16px;border:1px solid rgba(37,99,235,.18);border-radius:16px;background:var(--amtech-blue-soft);color:var(--amtech-blue);font-size:13px;font-weight:680}
  .fixture-guidance{padding:28px;display:grid;gap:10px;border:1px solid var(--amtech-line);border-radius:var(--amtech-radius-card);background:#fff;box-shadow:var(--amtech-shadow-card)}.fixture-guidance.needs_you{border-color:rgba(225,29,42,.22)}.fixture-guidance h2{font-size:clamp(28px,5vw,48px);line-height:1;letter-spacing:-.04em}.fixture-guidance>span{max-width:820px;color:var(--amtech-muted);line-height:1.6}.fixture-guidance button{width:max-content;margin-top:8px}
  .fixture-section{display:grid;gap:16px}.fixture-section>header{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.7fr);gap:24px;align-items:end}.fixture-section h2{font-size:clamp(25px,4vw,38px);letter-spacing:-.035em}.fixture-section>header>span{color:var(--amtech-muted);font-size:13px;line-height:1.55}
  .fixture-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));gap:14px}.fixture-card{padding:20px;display:grid;gap:10px;border:1px solid var(--amtech-line);border-radius:var(--amtech-radius-card);background:rgba(255,255,255,.9);box-shadow:var(--amtech-shadow-card)}.fixture-card.decision{border-color:rgba(225,29,42,.22)}.fixture-card h3{font-size:20px;line-height:1.14}.fixture-card>span{color:var(--amtech-muted);line-height:1.55}.fixture-card dl{display:grid;gap:8px;margin-top:6px}.fixture-card dl div{padding:9px 10px;border-radius:12px;background:var(--amtech-canvas)}.fixture-card-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.fixture-card small{color:var(--amtech-muted)}
  .fixture-list{display:grid;gap:10px}.fixture-list article{padding:16px 18px;display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,.45fr);gap:20px;align-items:center;border:1px solid var(--amtech-line);border-radius:16px;background:rgba(255,255,255,.88)}.fixture-list article>div{display:grid;gap:5px}.fixture-list article span,.fixture-list article small{color:var(--amtech-muted);line-height:1.45}.fixture-list article>div:last-child{text-align:right}.fixture-list.changes article{grid-template-columns:130px minmax(0,1fr) auto}.fixture-list.evidence article{grid-template-columns:minmax(0,1fr) auto}.fixture-list time{font-size:11px;color:var(--amtech-muted)}
  .fixture-context{padding:18px;border:1px solid var(--amtech-line);border-radius:16px;background:rgba(255,255,255,.82)}.fixture-context summary{min-height:44px;display:flex;align-items:center;font-weight:760;cursor:pointer}.fixture-context dl{margin-top:14px}.fixture-context p{margin-top:14px;color:var(--amtech-muted);font-size:12px;line-height:1.5}
  .fixture-command{position:sticky;bottom:14px;z-index:25;padding:18px;display:grid;grid-template-columns:minmax(230px,.65fr) minmax(320px,1.2fr) auto;gap:14px;align-items:center;border:1px solid rgba(37,99,235,.18);border-radius:24px;background:rgba(255,255,255,.94);box-shadow:var(--amtech-shadow-float);backdrop-filter:blur(30px)}.fixture-command>div{display:grid;gap:4px}.fixture-command>div span{color:var(--amtech-muted);font-size:12px;line-height:1.45}.fixture-command textarea{min-height:96px;padding:13px 14px;border:1px solid var(--amtech-line-strong);border-radius:16px;background:#fff;color:var(--amtech-ink);font:inherit;resize:vertical}.fixture-command>button{min-width:170px}.fixture-command>button:disabled{opacity:.45;cursor:not-allowed}.fixture-command>small{grid-column:1/-1;color:var(--amtech-muted);font-size:10px;text-align:center}
  @media(max-width:900px){.fixture-lab-intro,.fixture-heartbeat,.fixture-section>header,.fixture-command{grid-template-columns:1fr}.fixture-heartbeat dl{grid-template-columns:repeat(2,minmax(0,1fr))}.fixture-command{position:relative;bottom:auto}.fixture-command>button{width:100%}}
  @media(max-width:640px){.fixture-lab-header{align-items:flex-start}.fixture-lab-header>div>div small{display:none}.fixture-lab-shell{padding:16px 14px 140px}.fixture-lab-intro{padding:24px 20px}.fixture-lab-intro dl,.fixture-heartbeat dl,.fixture-context dl{grid-template-columns:1fr}.fixture-list article,.fixture-list.changes article,.fixture-list.evidence article{grid-template-columns:1fr}.fixture-list article>div:last-child{text-align:left}.fixture-command{padding:14px;border-radius:18px}}
  @media(prefers-reduced-motion:reduce){.fixture-heartbeat-dot{box-shadow:none}}
`;

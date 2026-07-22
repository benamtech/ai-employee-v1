"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BUILTIN_EMPLOYEE_UI_COMPONENT_SETS,
  BUILTIN_EMPLOYEE_UI_LAYOUTS,
  BUILTIN_EMPLOYEE_UI_THEMES,
  type EmployeeUiAdapterKey,
  type EmployeeUiComponentSetKey,
  type EmployeeUiLayoutKey,
  type EmployeeUiThemeKey,
} from "@amtech/shared";
import { EmployeeUiPortHost, EMPLOYEE_UI_ADAPTERS } from "../../_components/employee-ui/EmployeeUiPort";
import { AgentSurface } from "../../agent/[employeeId]/AgentSurface";
import {
  FIXTURE_SCENARIOS,
  fixtureRuntimeForEmployee,
  planFixtureCommand,
  type FixtureRuntimeFrame,
  type FixtureRuntimeProjection,
  type FixtureScenarioId,
} from "../../agent/[employeeId]/fixture-runtime";

const ADAPTER_KEYS = Object.keys(EMPLOYEE_UI_ADAPTERS) as EmployeeUiAdapterKey[];

/** UI Lab changes fixture timing and presentation selection; production components still render the payload. */
export function ProductionFixtureLabClient({ scenarioId, employeeId }: { scenarioId: FixtureScenarioId; employeeId: string }) {
  const session = useMemo(() => fixtureRuntimeForEmployee(employeeId), [employeeId]);
  const defaults = useMemo(() => scenarioPresentation(scenarioId), [scenarioId]);
  const [payload, setPayload] = useState(session.initial_payload);
  const [projection, setProjection] = useState<FixtureRuntimeProjection>(session.initial_projection);
  const [progress, setProgress] = useState(session.initial_projection.summary);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("Fixture truth; production compiler and components with a selectable UI port adapter and presentation strategy.");
  const [running, setRunning] = useState(false);
  const [adapterKey, setAdapterKey] = useState<EmployeeUiAdapterKey>(defaults.adapterKey);
  const [themeKey, setThemeKey] = useState<EmployeeUiThemeKey>(defaults.themeKey);
  const [layoutKey, setLayoutKey] = useState<EmployeeUiLayoutKey>(defaults.layoutKey);
  const [componentSetKey, setComponentSetKey] = useState<EmployeeUiComponentSetKey>(defaults.componentSetKey);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current = [];
  }, []);
  const scheduleFrames = useCallback((frames: FixtureRuntimeFrame[]) => {
    for (const frame of frames) timers.current.push(window.setTimeout(() => {
      setProjection(frame.projection);
      setProgress(frame.progress ?? frame.projection.summary);
    }, frame.after_ms));
  }, []);

  useEffect(() => {
    setPayload(session.initial_payload);
    setProjection(session.initial_projection);
    setProgress(session.initial_projection.summary);
    setInput("");
    setRunning(false);
    setAdapterKey(defaults.adapterKey);
    setThemeKey(defaults.themeKey);
    setLayoutKey(defaults.layoutKey);
    setComponentSetKey(defaults.componentSetKey);
    clearTimers();
    scheduleFrames(session.frames);
    return clearTimers;
  }, [clearTimers, defaults, scheduleFrames, session]);

  function reset() {
    clearTimers();
    setPayload(session.initial_payload);
    setProjection(session.initial_projection);
    setProgress(session.initial_projection.summary);
    setInput("");
    setRunning(false);
    setAdapterKey(defaults.adapterKey);
    setThemeKey(defaults.themeKey);
    setLayoutKey(defaults.layoutKey);
    setComponentSetKey(defaults.componentSetKey);
    setNotice("Scenario and presentation reset from deterministic defaults. No command was replayed.");
    scheduleFrames(session.frames);
  }
  function gap() {
    clearTimers();
    setProjection((current) => ({ ...current, sequence: current.sequence + 1, observed_at: new Date().toISOString(), phase: "working", health: "active", summary: "Heartbeat intentionally withheld; durable truth is unchanged." }));
    setProgress("Waiting for an owner-safe heartbeat");
    setNotice("The lab cannot resend intent or manufacture success while liveness is unknown.");
    timers.current.push(window.setTimeout(() => {
      setProjection((current) => ({ ...current, sequence: current.sequence + 1, observed_at: new Date().toISOString(), phase: "reconciling", health: "stalled", summary: "Projection stalled; a fresh snapshot is required and replay is forbidden." }));
      setProgress("State reconciliation required");
    }, 1600));
  }
  function recover() {
    clearTimers();
    setProjection((current) => ({ ...current, sequence: current.sequence + 1, observed_at: new Date().toISOString(), phase: "recovering", health: "recovering", summary: "Refreshing fixture truth without repeating the original intent." }));
    setNotice("Recovery changes projection state only.");
    timers.current.push(window.setTimeout(() => {
      setProjection((current) => ({ ...current, sequence: current.sequence + 1, observed_at: new Date().toISOString(), phase: "completed", health: "completed", summary: "Fresh fixture state restored without replay." }));
      setProgress("");
    }, 900));
  }
  function submit() {
    const body = input.trim();
    const operating = payload.operating_state;
    if (!body || running || !operating) return;
    const plan = planFixtureCommand(payload, operating, scenarioId, body);
    clearTimers();
    setPayload(plan.accepted);
    setInput("");
    setRunning(true);
    setNotice("Fixture intent accepted locally. The selected adapter and strategies change presentation only.");
    scheduleFrames(plan.frames);
    timers.current.push(window.setTimeout(() => {
      setPayload(plan.completed);
      setRunning(false);
      setNotice("Projected fixture work completed. No provider, customer, money, publishing, inventory, or runtime effect occurred.");
    }, plan.completion_delay_ms + 40));
  }

  const adapter = EMPLOYEE_UI_ADAPTERS[adapterKey];
  return <main className="production-fixture-lab fixture-lab-root">
    <style>{CSS}</style>
    <header><div><Link href="/ui-lab">AMTECH<span>.</span></Link><strong>UI Lab</strong><small>fixture data · selectable adapter · selectable presentation strategy</small></div><button onClick={reset}>Reset scenario</button></header>
    <nav aria-label="Fixture employee scenarios">{FIXTURE_SCENARIOS.map((scenario) => <Link key={scenario.id} className={scenario.id === scenarioId ? "active" : ""} href={`/ui-lab/${scenario.id}`}>{scenario.shortLabel}</Link>)}</nav>
    <section className="lab-summary"><div><p>Fixture demonstration only</p><h1>{session.scenario.label}</h1><span>{session.scenario.summary}</span></div><dl><div><dt>Evidence</dt><dd>fixture_demonstration</dd></div><div><dt>Adapter</dt><dd>{adapterKey}</dd></div><div><dt>Theme</dt><dd>{themeKey}</dd></div></dl></section>
    <section className="lab-adapters" aria-label="UI adapter and presentation controls">
      <div><p>Port adapter</p><strong>{adapter.label}</strong><span>{adapter.purpose}</span></div>
      <label>Adapter<select value={adapterKey} onChange={(event) => setAdapterKey(event.target.value as EmployeeUiAdapterKey)}>{ADAPTER_KEYS.map((key) => <option key={key} value={key}>{EMPLOYEE_UI_ADAPTERS[key].label}</option>)}</select></label>
      <label>Theme<select value={themeKey} onChange={(event) => setThemeKey(event.target.value as EmployeeUiThemeKey)}>{BUILTIN_EMPLOYEE_UI_THEMES.map((key) => <option key={key} value={key}>{readable(key)}</option>)}</select></label>
      <label>Layout<select value={layoutKey} onChange={(event) => setLayoutKey(event.target.value as EmployeeUiLayoutKey)}>{BUILTIN_EMPLOYEE_UI_LAYOUTS.map((key) => <option key={key} value={key}>{readable(key)}</option>)}</select></label>
      <label>Components<select value={componentSetKey} onChange={(event) => setComponentSetKey(event.target.value as EmployeeUiComponentSetKey)}>{BUILTIN_EMPLOYEE_UI_COMPONENT_SETS.map((key) => <option key={key} value={key}>{readable(key)}</option>)}</select></label>
      <small>The adapter selects the high-level web experience. Theme, layout, component set, and density are strategies inside that adapter.</small>
    </section>
    <section className={`lab-heartbeat ${projection.health}`} aria-live="polite"><div><p>Owner-safe runtime projection</p><h2>{readable(projection.health)} · {readable(projection.phase)}</h2></div><strong>{projection.summary}</strong><span>{progress}</span><div className="actions"><button onClick={gap}>Simulate heartbeat gap</button><button onClick={recover}>Recover without replay</button></div><small>Heartbeat never proves correctness, authority, an external effect, or a durable receipt.</small></section>
    <div className="notice" role="status">{notice}</div>
    <section className="production-projection">
      <EmployeeUiPortHost
        adapterKey={adapterKey}
        payload={payload}
        presentationOverride={{ theme_key: themeKey, layout_key: layoutKey, component_set_key: componentSetKey, source: "ui_lab" }}
      >
        <AgentSurface employeeId={employeeId} fixtureMode fixturePayload={payload} embedded />
      </EmployeeUiPortHost>
    </section>
    <section className="lab-command"><strong>Run a fixture interaction</strong><textarea rows={4} value={input} onChange={(event) => setInput(event.target.value)} aria-label={`Fixture command ${payload.employee?.name ?? "employee"}`} /><button disabled={!input.trim() || running} onClick={submit}>{running ? "Projecting…" : "Run fixture interaction"}</button><small>Nothing here counts as provider, browser/channel, commercial, deployment, or production acceptance.</small></section>
  </main>;
}

function scenarioPresentation(scenarioId: FixtureScenarioId): {
  adapterKey: EmployeeUiAdapterKey;
  themeKey: EmployeeUiThemeKey;
  layoutKey: EmployeeUiLayoutKey;
  componentSetKey: EmployeeUiComponentSetKey;
} {
  if (scenarioId === "website") return { adapterKey: "boundless_website", themeKey: "brand", layoutKey: "boundless", componentSetKey: "editorial" };
  if (scenarioId === "contractor") return { adapterKey: "owner_web", themeKey: "field_notebook", layoutKey: "conversation_workspace", componentSetKey: "standard" };
  if (scenarioId === "clothing-ops") return { adapterKey: "owner_web", themeKey: "studio", layoutKey: "canvas", componentSetKey: "editorial" };
  if (scenarioId === "research") return { adapterKey: "owner_web", themeKey: "editorial", layoutKey: "focus", componentSetKey: "editorial" };
  if (scenarioId === "personal-brain") return { adapterKey: "owner_web", themeKey: "midnight", layoutKey: "focus", componentSetKey: "terminal" };
  return { adapterKey: "owner_web", themeKey: "amtech_light", layoutKey: "conversation_workspace", componentSetKey: "compact" };
}

const readable = (value: string) => value.replace(/[_:-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
const CSS = `.production-fixture-lab{min-height:100vh;background:#f4f7fb;color:#10131a;padding-bottom:48px}.production-fixture-lab>header{position:sticky;top:0;z-index:70;display:flex;justify-content:space-between;gap:16px;padding:12px 4vw;background:rgba(255,255,255,.94);border-bottom:1px solid #dbe2eb}.production-fixture-lab>header>div{display:flex;align-items:center;gap:12px}.production-fixture-lab header a{font-weight:900;color:#111;text-decoration:none}.production-fixture-lab header a span{color:#e11d2a}.production-fixture-lab header small{color:#667085}.production-fixture-lab button,.production-fixture-lab select{min-height:44px;padding:0 15px;border:1px solid #cdd5df;border-radius:999px;background:#fff;font-weight:750}.production-fixture-lab>nav{display:flex;gap:8px;overflow:auto;padding:14px 4vw}.production-fixture-lab>nav a{padding:8px 12px;border:1px solid #d6dde7;border-radius:999px;color:#344054;text-decoration:none;white-space:nowrap}.production-fixture-lab>nav a.active{background:#111;color:#fff}.lab-summary,.lab-adapters,.lab-heartbeat,.notice,.lab-command{width:min(1240px,calc(100% - 32px));margin:16px auto;padding:20px;border:1px solid #dbe2eb;border-radius:20px;background:#fff}.lab-summary{display:flex;justify-content:space-between;gap:24px}.lab-summary h1{font-size:clamp(30px,5vw,54px);margin:6px 0}.lab-summary p,.lab-heartbeat p,.lab-adapters p{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#667085;font-weight:800}.lab-summary dl{display:grid;gap:7px}.lab-summary dl div{padding:8px 10px;border:1px solid #e4e9f0;border-radius:10px}.lab-summary dt{font-size:10px;color:#667085}.lab-summary dd{margin:2px 0 0;font-size:12px;font-weight:700}.lab-adapters{display:grid;grid-template-columns:minmax(240px,1.4fr) repeat(4,minmax(130px,1fr));gap:14px;align-items:end}.lab-adapters>div{display:grid;gap:5px}.lab-adapters>div span{color:#667085;font-size:12px;line-height:1.45}.lab-adapters label{display:grid;gap:6px;font-size:11px;font-weight:800;color:#475467}.lab-adapters select{width:100%;border-radius:11px}.lab-adapters>small{grid-column:1/-1;color:#667085}.lab-heartbeat{display:grid;gap:10px}.lab-heartbeat.stalled{border-color:#fda29b}.lab-heartbeat .actions{display:flex;gap:8px;flex-wrap:wrap}.notice{background:#eef4ff;color:#175cd3;font-size:13px}.production-projection{border-block:1px solid #dbe2eb;background:#f8fafc}.lab-command{display:grid;gap:10px}.lab-command textarea{padding:12px;border:1px solid #cdd5df;border-radius:12px;font:inherit}.lab-command button{justify-self:start;background:#e11d2a;color:#fff;border-color:#e11d2a}@media(max-width:980px){.lab-adapters{grid-template-columns:repeat(2,minmax(0,1fr))}.lab-adapters>div,.lab-adapters>small{grid-column:1/-1}}@media(max-width:720px){.lab-summary{display:grid}.production-fixture-lab>header>div{align-items:flex-start;flex-wrap:wrap}.lab-adapters{grid-template-columns:1fr}}`;

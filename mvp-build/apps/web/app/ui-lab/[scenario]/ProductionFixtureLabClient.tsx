"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type {
  EmployeeUiAdapterKey,
  EmployeeUiBrandTokens,
  EmployeeUiComponentSetKey,
  EmployeeUiLayoutKey,
  EmployeeUiThemeKey,
  UiVariantIntent,
  UiVariantIntentResult,
} from "@amtech/shared";
import { EmployeeUiPortHost, useEmployeeUiPort } from "../../_components/employee-ui/EmployeeUiPort";
import { UiVariantRenderer } from "../../_components/employee-ui/UiVariantRenderer";
import { AgentSurface } from "../../agent/[employeeId]/AgentSurface";
import { CapabilityDrawer } from "../../agent/[employeeId]/components/CapabilityDrawer";
import { LiveEmployeeOperatingShell } from "../../agent/[employeeId]/LiveEmployeeOperatingShell";
import {
  fixtureRuntimeForEmployee,
  planFixtureCommand,
  type FixtureRuntimeFrame,
  type FixtureRuntimeProjection,
  type FixtureScenarioId,
} from "../../agent/[employeeId]/fixture-runtime";

export type UiLabPreviewMode = "full_owner_client" | "workspace_fixture";

export interface UiLabPreviewConfig {
  adapterKey: EmployeeUiAdapterKey;
  themeKey: EmployeeUiThemeKey;
  layoutKey: EmployeeUiLayoutKey;
  componentSetKey: EmployeeUiComponentSetKey;
  density: "calm" | "balanced" | "dense";
  brand: EmployeeUiBrandTokens;
}

interface PreviewCommand {
  type: "amtech.ui-lab.command";
  action: "reset" | "heartbeat-gap" | "recover" | "submit";
  body?: string;
}

export function ProductionFixtureLabClient({
  scenarioId,
  employeeId,
  config,
  mode,
  variantId,
}: {
  scenarioId: FixtureScenarioId;
  employeeId: string;
  config: UiLabPreviewConfig;
  mode: UiLabPreviewMode;
  variantId?: string | null;
}) {
  const session = useMemo(() => fixtureRuntimeForEmployee(employeeId), [employeeId]);
  const [payload, setPayload] = useState(session.initial_payload);
  const [projection, setProjection] = useState<FixtureRuntimeProjection>(session.initial_projection);
  const [progress, setProgress] = useState(session.initial_projection.summary);
  const [notice, setNotice] = useState("Fixture data loaded through production UI components.");
  const [running, setRunning] = useState(false);
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

  const reset = useCallback(() => {
    clearTimers();
    setPayload(session.initial_payload);
    setProjection(session.initial_projection);
    setProgress(session.initial_projection.summary);
    setRunning(false);
    setNotice("Scenario reset from deterministic fixture state. No command was replayed.");
    scheduleFrames(session.frames);
  }, [clearTimers, scheduleFrames, session]);

  const gap = useCallback(() => {
    if (mode !== "workspace_fixture") return;
    clearTimers();
    setProjection((current) => ({ ...current, sequence: current.sequence + 1, observed_at: new Date().toISOString(), phase: "working", health: "active", summary: "Heartbeat intentionally withheld; durable fixture truth is unchanged." }));
    setProgress("Waiting for an owner-safe heartbeat");
    setNotice("Liveness is unknown. UI Lab does not manufacture success or resend intent.");
    timers.current.push(window.setTimeout(() => {
      setProjection((current) => ({ ...current, sequence: current.sequence + 1, observed_at: new Date().toISOString(), phase: "reconciling", health: "stalled", summary: "Projection stalled; a fresh fixture snapshot is required." }));
      setProgress("State reconciliation required");
    }, 1600));
  }, [clearTimers, mode]);

  const recover = useCallback(() => {
    if (mode !== "workspace_fixture") return;
    clearTimers();
    setProjection((current) => ({ ...current, sequence: current.sequence + 1, observed_at: new Date().toISOString(), phase: "recovering", health: "recovering", summary: "Refreshing fixture truth without repeating the original intent." }));
    setNotice("Recovery changes the fixture projection only.");
    timers.current.push(window.setTimeout(() => {
      setProjection((current) => ({ ...current, sequence: current.sequence + 1, observed_at: new Date().toISOString(), phase: "completed", health: "completed", summary: "Fresh fixture state restored without replay." }));
      setProgress("");
    }, 900));
  }, [clearTimers, mode]);

  const submit = useCallback((rawBody: string) => {
    const body = rawBody.trim();
    const operating = payload.operating_state;
    if (!body || running || !operating) return;
    const plan = planFixtureCommand(payload, operating, scenarioId, body);
    clearTimers();
    setPayload(plan.accepted);
    setRunning(true);
    setNotice("Fixture intent accepted locally. No provider or production effect occurred.");
    scheduleFrames(plan.frames);
    timers.current.push(window.setTimeout(() => {
      setPayload(plan.completed);
      setRunning(false);
      setNotice("Projected fixture work completed through the selected renderer.");
    }, plan.completion_delay_ms + 40));
  }, [clearTimers, payload, running, scenarioId, scheduleFrames]);

  const handleIntent = useCallback(async (intent: UiVariantIntent): Promise<UiVariantIntentResult> => {
    if (intent.type === "send_message") {
      submit(intent.body);
      return { accepted: true, code: "fixture_message_accepted" };
    }
    if (intent.type === "refresh") {
      reset();
      return { accepted: true, code: "fixture_refreshed" };
    }
    return { accepted: false, code: "fixture_intent_not_implemented", message: intent.type };
  }, [reset, submit]);

  useEffect(() => { reset(); return clearTimers; }, [clearTimers, reset]);
  useEffect(() => {
    const receive = (event: MessageEvent<PreviewCommand>) => {
      if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== "amtech.ui-lab.command") return;
      if (event.data.action === "reset") reset();
      else if (event.data.action === "heartbeat-gap") gap();
      else if (event.data.action === "recover") recover();
      else if (event.data.action === "submit") submit(event.data.body ?? "");
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [gap, recover, reset, submit]);

  useEffect(() => {
    window.parent.postMessage({ type: "amtech.ui-lab.preview-state", scenario_id: scenarioId, mode, variant_id: variantId ?? null, projection, progress, notice, running }, window.location.origin);
  }, [mode, notice, progress, projection, running, scenarioId, variantId]);

  const webClient = mode === "full_owner_client" ? <><LiveEmployeeOperatingShell employeeId={employeeId} fixtureMode /><CapabilityDrawer employeeId={employeeId} fixtureMode /></> : <AgentSurface employeeId={employeeId} fixtureMode fixturePayload={payload} embedded={false} />;

  return (
    <main className="ui-lab-preview-root" data-ui-lab-preview-mode={mode} data-ui-lab-variant={variantId ?? "production"}>
      <style>{PREVIEW_CSS}</style>
      <EmployeeUiPortHost adapterKey={config.adapterKey} payload={payload} presentationOverride={{ theme_key: config.themeKey, layout_key: config.layoutKey, component_set_key: config.componentSetKey, density: config.density, brand: config.brand, source: "ui_lab" }}>
        <PortResolvedPreview variantId={variantId} payload={payload} scenarioId={scenarioId} projection={projection} running={running} onIntent={handleIntent} webClient={webClient} />
      </EmployeeUiPortHost>
    </main>
  );
}

function PortResolvedPreview({ variantId, payload, scenarioId, projection, running, onIntent, webClient }: { variantId?: string | null; payload: ReturnType<typeof fixtureRuntimeForEmployee>["initial_payload"]; scenarioId: string; projection: FixtureRuntimeProjection; running: boolean; onIntent: (intent: UiVariantIntent) => Promise<UiVariantIntentResult>; webClient: ReactNode }) {
  const port = useEmployeeUiPort();
  if (!variantId) return webClient;
  const health = projection.health === "stalled" ? "degraded" : projection.health === "recovering" ? "degraded" : projection.health === "completed" || projection.health === "active" ? "healthy" : "unknown";
  return <UiVariantRenderer variantId={variantId} payload={payload} port={port} scenarioId={scenarioId} runtime={{ health, phase: projection.phase, summary: projection.summary, observed_at: projection.observed_at, running }} onIntent={onIntent} webClient={webClient} />;
}

const PREVIEW_CSS = `html,body{margin:0;min-height:100%;background:#eef2f7}.ui-lab-preview-root{min-height:100dvh;background:var(--employee-canvas,#eef2f7)}`;

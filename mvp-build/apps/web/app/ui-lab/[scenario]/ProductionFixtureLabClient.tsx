"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  EmployeeUiAdapterKey,
  EmployeeUiBrandTokens,
  EmployeeUiComponentSetKey,
  EmployeeUiLayoutKey,
  EmployeeUiThemeKey,
} from "@amtech/shared";
import { EmployeeUiPortHost } from "../../_components/employee-ui/EmployeeUiPort";
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

/**
 * Same-origin isolated preview used by the UI Lab workbench. It renders the
 * actual owner shell or production AgentSurface while fixture data supplies a
 * deterministic employee/runtime state.
 */
export function ProductionFixtureLabClient({
  scenarioId,
  employeeId,
  config,
  mode,
}: {
  scenarioId: FixtureScenarioId;
  employeeId: string;
  config: UiLabPreviewConfig;
  mode: UiLabPreviewMode;
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
    for (const frame of frames) {
      timers.current.push(window.setTimeout(() => {
        setProjection(frame.projection);
        setProgress(frame.progress ?? frame.projection.summary);
      }, frame.after_ms));
    }
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
    setProjection((current) => ({
      ...current,
      sequence: current.sequence + 1,
      observed_at: new Date().toISOString(),
      phase: "working",
      health: "active",
      summary: "Heartbeat intentionally withheld; durable fixture truth is unchanged.",
    }));
    setProgress("Waiting for an owner-safe heartbeat");
    setNotice("Liveness is unknown. UI Lab does not manufacture success or resend intent.");
    timers.current.push(window.setTimeout(() => {
      setProjection((current) => ({
        ...current,
        sequence: current.sequence + 1,
        observed_at: new Date().toISOString(),
        phase: "reconciling",
        health: "stalled",
        summary: "Projection stalled; a fresh fixture snapshot is required.",
      }));
      setProgress("State reconciliation required");
    }, 1600));
  }, [clearTimers, mode]);

  const recover = useCallback(() => {
    if (mode !== "workspace_fixture") return;
    clearTimers();
    setProjection((current) => ({
      ...current,
      sequence: current.sequence + 1,
      observed_at: new Date().toISOString(),
      phase: "recovering",
      health: "recovering",
      summary: "Refreshing fixture truth without repeating the original intent.",
    }));
    setNotice("Recovery changes the fixture projection only.");
    timers.current.push(window.setTimeout(() => {
      setProjection((current) => ({
        ...current,
        sequence: current.sequence + 1,
        observed_at: new Date().toISOString(),
        phase: "completed",
        health: "completed",
        summary: "Fresh fixture state restored without replay.",
      }));
      setProgress("");
    }, 900));
  }, [clearTimers, mode]);

  const submit = useCallback((rawBody: string) => {
    const body = rawBody.trim();
    const operating = payload.operating_state;
    if (mode !== "workspace_fixture" || !body || running || !operating) return;
    const plan = planFixtureCommand(payload, operating, scenarioId, body);
    clearTimers();
    setPayload(plan.accepted);
    setRunning(true);
    setNotice("Fixture intent accepted locally. No provider or production effect occurred.");
    scheduleFrames(plan.frames);
    timers.current.push(window.setTimeout(() => {
      setPayload(plan.completed);
      setRunning(false);
      setNotice("Projected fixture work completed through the production renderer.");
    }, plan.completion_delay_ms + 40));
  }, [clearTimers, mode, payload, running, scenarioId, scheduleFrames]);

  useEffect(() => {
    reset();
    return clearTimers;
  }, [clearTimers, reset]);

  useEffect(() => {
    const receive = (event: MessageEvent<PreviewCommand>) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type !== "amtech.ui-lab.command") return;
      if (event.data.action === "reset") reset();
      else if (event.data.action === "heartbeat-gap") gap();
      else if (event.data.action === "recover") recover();
      else if (event.data.action === "submit") submit(event.data.body ?? "");
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [gap, recover, reset, submit]);

  useEffect(() => {
    window.parent.postMessage({
      type: "amtech.ui-lab.preview-state",
      scenario_id: scenarioId,
      mode,
      projection,
      progress,
      notice,
      running,
    }, window.location.origin);
  }, [mode, notice, progress, projection, running, scenarioId]);

  return (
    <main className="ui-lab-preview-root" data-ui-lab-preview-mode={mode}>
      <style>{PREVIEW_CSS}</style>
      <EmployeeUiPortHost
        adapterKey={config.adapterKey}
        payload={session.initial_payload}
        presentationOverride={{
          theme_key: config.themeKey,
          layout_key: config.layoutKey,
          component_set_key: config.componentSetKey,
          density: config.density,
          brand: config.brand,
          source: "ui_lab",
        }}
      >
        {mode === "full_owner_client" ? (
          <>
            <LiveEmployeeOperatingShell employeeId={employeeId} fixtureMode />
            <CapabilityDrawer employeeId={employeeId} fixtureMode />
          </>
        ) : (
          <AgentSurface employeeId={employeeId} fixtureMode fixturePayload={payload} embedded={false} />
        )}
      </EmployeeUiPortHost>
    </main>
  );
}

const PREVIEW_CSS = `
  html,body{margin:0;min-height:100%;background:#eef2f7}
  .ui-lab-preview-root{min-height:100dvh;background:var(--employee-canvas,#eef2f7)}
`;

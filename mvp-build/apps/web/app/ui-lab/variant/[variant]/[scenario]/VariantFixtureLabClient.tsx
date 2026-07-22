"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveEmployeeUiPort, type UiVariantIntentRequest, type UiVariantIntentResult } from "@amtech/shared";
import { EmployeeUiPortHost } from "../../../../_components/employee-ui/EmployeeUiPort";
import { UiVariantHost } from "../../../../_components/ui-variant/UiVariantHost";
import { buildEmployeeExperienceModel } from "../../../../_components/ui-variant/buildEmployeeExperienceModel";
import { AgentSurface } from "../../../../agent/[employeeId]/AgentSurface";
import {
  fixtureRuntimeForEmployee,
  planFixtureCommand,
  type FixtureRuntimeFrame,
  type FixtureScenarioId,
} from "../../../../agent/[employeeId]/fixture-runtime";
import type { UiLabPreviewConfig } from "../../../[scenario]/ProductionFixtureLabClient";

export function VariantFixtureLabClient({
  variantId,
  scenarioId,
  employeeId,
  config,
}: {
  variantId: string;
  scenarioId: FixtureScenarioId;
  employeeId: string;
  config: UiLabPreviewConfig;
}) {
  const session = useMemo(() => fixtureRuntimeForEmployee(employeeId), [employeeId]);
  const [payload, setPayload] = useState(session.initial_payload);
  const [projection, setProjection] = useState(session.initial_projection);
  const [progress, setProgress] = useState(session.initial_projection.summary);
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
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
    scheduleFrames(session.frames);
  }, [clearTimers, scheduleFrames, session]);

  const interrupt = useCallback(() => {
    clearTimers();
    setProjection((current) => ({ ...current, sequence: current.sequence + 1, observed_at: new Date().toISOString(), phase: "working", health: "active", summary: "Heartbeat intentionally withheld; durable fixture truth is unchanged." }));
    setProgress("Waiting for an owner-safe heartbeat");
    timers.current.push(window.setTimeout(() => setProjection((current) => ({ ...current, sequence: current.sequence + 1, observed_at: new Date().toISOString(), phase: "reconciling", health: "stalled", summary: "Projection stalled; a fresh fixture snapshot is required." })), 1200));
  }, [clearTimers]);

  const recover = useCallback(() => {
    clearTimers();
    setProjection((current) => ({ ...current, sequence: current.sequence + 1, observed_at: new Date().toISOString(), phase: "recovering", health: "recovering", summary: "Refreshing fixture truth without repeating the original intent." }));
    timers.current.push(window.setTimeout(() => {
      setProjection((current) => ({ ...current, sequence: current.sequence + 1, observed_at: new Date().toISOString(), phase: "completed", health: "completed", summary: "Fresh fixture state restored without replay." }));
      setProgress("");
    }, 850));
  }, [clearTimers]);

  const submit = useCallback((body: string): UiVariantIntentResult => {
    const value = body.trim();
    const operating = payload.operating_state;
    if (!value || running || !operating) return { accepted: false, code: "fixture_not_ready", message: "The deterministic fixture cannot accept that instruction right now." };
    const plan = planFixtureCommand(payload, operating, scenarioId, value);
    clearTimers();
    setPayload(plan.accepted);
    setRunning(true);
    scheduleFrames(plan.frames);
    timers.current.push(window.setTimeout(() => { setPayload(plan.completed); setRunning(false); }, plan.completion_delay_ms + 40));
    return { accepted: true, code: "fixture_intent_accepted", message: "Fixture intent accepted locally; no production effect occurred." };
  }, [clearTimers, payload, running, scenarioId, scheduleFrames]);

  useEffect(() => { reset(); return clearTimers; }, [clearTimers, reset]);

  const port = useMemo(() => resolveEmployeeUiPort({
    adapter_key: config.adapterKey,
    business_kind: payload.operating_state?.context.business_kind,
    profile_key: payload.operating_state?.context.profile_key,
    dominant_domains: payload.operating_state?.context.dominant_domains,
    signals: payload.operating_state?.context.signals,
    explicit: { theme_key: config.themeKey, layout_key: config.layoutKey, component_set_key: config.componentSetKey, density: config.density, brand: config.brand, source: "ui_lab" },
  }), [config, payload]);

  const model = useMemo(() => buildEmployeeExperienceModel({ payload, port, scenarioId, projection: { ...projection, progress, running } }), [payload, port, progress, projection, running, scenarioId]);

  const dispatchIntent = useCallback(async (request: UiVariantIntentRequest): Promise<UiVariantIntentResult> => {
    if (request.intent_id === "fixture-reset") { reset(); return { accepted: true, code: "fixture_reset", message: "Fixture reset." }; }
    if (request.intent_id === "fixture-gap") { interrupt(); return { accepted: true, code: "fixture_interrupted", message: "Heartbeat gap started." }; }
    if (request.intent_id === "fixture-recover") { recover(); return { accepted: true, code: "fixture_recovering", message: "Fixture recovery started." }; }
    if (request.intent_id === "send-message" && typeof request.value === "string") return submit(request.value);
    return { accepted: false, code: "reference_client_required", message: "This intent is available through the production reference client slot." };
  }, [interrupt, recover, reset, submit]);

  const referenceClient = (
    <EmployeeUiPortHost adapterKey={config.adapterKey} payload={payload} presentationOverride={{ theme_key: config.themeKey, layout_key: config.layoutKey, component_set_key: config.componentSetKey, density: config.density, brand: config.brand, source: "ui_lab" }}>
      <AgentSurface employeeId={employeeId} fixtureMode fixturePayload={payload} embedded={false} />
    </EmployeeUiPortHost>
  );

  return <UiVariantHost variantId={variantId} model={model} referenceClient={referenceClient} dispatchIntent={dispatchIntent} />;
}

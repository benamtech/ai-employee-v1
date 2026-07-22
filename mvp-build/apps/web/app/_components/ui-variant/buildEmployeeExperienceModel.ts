import type {
  EmployeeExperienceIntent,
  EmployeeExperienceModelV1,
  EmployeeUiPortContract,
  ResourcePayload,
} from "@amtech/shared";

export interface EmployeeExperienceProjection {
  status?: string | null;
  health?: string | null;
  phase?: string | null;
  summary?: string | null;
  progress?: string | null;
  running?: boolean;
  observed_at?: string | null;
  sequence?: number | null;
}

export function buildEmployeeExperienceModel(input: {
  payload: ResourcePayload;
  port: EmployeeUiPortContract;
  projection?: EmployeeExperienceProjection | null;
  scenarioId?: string | null;
  evidenceLevel?: EmployeeExperienceModelV1["metadata"]["evidence_level"];
}): EmployeeExperienceModelV1 {
  const { payload, port, projection } = input;
  const operating = payload.operating_state;
  const context = operating?.context;
  const employeeId = payload.employee_id ?? payload.employee?.id ?? context?.employee_id ?? "unknown-employee";
  const runtimeStatus = normalizeRuntimeStatus(projection?.status ?? projection?.health ?? operating?.guidance?.mode ?? payload.runtime_health?.status);
  const intents = buildIntents(payload, Boolean(input.scenarioId));

  return {
    version: 1,
    adapter_key: port.adapter_key,
    presentation: port.presentation,
    identity: {
      account_id: payload.account_id,
      assignment_id: payload.assignment_id ?? context?.assignment_id ?? null,
      employee_id: employeeId,
      employee_name: payload.employee?.name ?? context?.employee_name ?? "AI Employee",
      employee_status: payload.employee?.status ?? null,
      business_name: context?.business_name ?? null,
      business_kind: context?.business_kind ?? null,
      profile_key: context?.profile_key ?? null,
      profile_version: context?.profile_version ?? null,
    },
    context: {
      dominant_domains: context?.dominant_domains ?? [],
      owner_experience: context?.owner_experience ?? null,
      preferred_density: context?.preferred_density ?? null,
      signals: (context?.signals ?? []).filter((signal) => signal.owner_safe).map((signal) => ({
        id: signal.id,
        source: signal.source,
        key: signal.key,
        label: signal.label,
        value: signal.value,
        confidence: signal.confidence,
        freshness: signal.freshness,
      })),
    },
    runtime: {
      status: runtimeStatus,
      health: projection?.health ?? payload.runtime_health?.status ?? null,
      phase: projection?.phase ?? null,
      summary: projection?.summary ?? operating?.guidance?.summary ?? payload.runtime_health?.message ?? "Runtime state is not yet available.",
      progress: projection?.progress ?? null,
      running: projection?.running ?? runtimeStatus === "active" || runtimeStatus === "recovering",
      observed_at: projection?.observed_at ?? payload.runtime_health?.checked_at ?? null,
      sequence: projection?.sequence ?? null,
    },
    conversation: payload.messages,
    work: {
      guidance: operating?.guidance ?? null,
      loops: operating?.loops ?? [],
      tasks: payload.tasks ?? [],
      delegated: operating?.delegated_work ?? [],
    },
    attention: {
      decisions: operating?.decisions ?? [],
      approvals: payload.approvals,
      resurface_items: payload.resurface_items ?? [],
    },
    waiting: operating?.active_saves ?? [],
    changes: operating?.changes ?? [],
    connections: payload.connection_surfaces ?? [],
    abilities: payload.abilities ?? [],
    capabilities: payload.capabilities ?? [],
    evidence: operating?.evidence ?? [],
    outputs: payload.outputs ?? [],
    intents,
    metadata: {
      generated_at: new Date().toISOString(),
      evidence_level: input.evidenceLevel ?? (input.scenarioId ? "fixture_demonstration" : "source_wired"),
      fixture: Boolean(input.scenarioId),
      scenario_id: input.scenarioId ?? null,
      contract_fingerprint: `employee-experience-v1:${employeeId}:${port.adapter_key}`,
    },
  };
}

function buildIntents(payload: ResourcePayload, fixture: boolean): EmployeeExperienceIntent[] {
  const intents: EmployeeExperienceIntent[] = [
    { id: "send-message", kind: "send_message", label: "Send message", description: "Send owner input through the host-provided interaction bridge.", availability: "reference_client", risk: "low", input: { kind: "text", placeholder: "Tell your employee what to do" } },
  ];
  for (const approval of payload.approvals) {
    intents.push({ id: `approve:${approval.id}`, kind: "approve", label: "Review approval", description: approval.summary, availability: "reference_client", risk: approval.risk_level === "high" ? "high" : "medium", target: { kind: "approval", id: approval.id }, input: { kind: "confirmation" } });
  }
  if (fixture) {
    intents.push(
      { id: "fixture-reset", kind: "reset_fixture", label: "Reset fixture", description: "Restore deterministic fixture state.", availability: "direct", risk: "none", input: { kind: "none" } },
      { id: "fixture-gap", kind: "interrupt_fixture", label: "Interrupt heartbeat", description: "Demonstrate a liveness gap without changing durable truth.", availability: "direct", risk: "none", input: { kind: "none" } },
      { id: "fixture-recover", kind: "recover_fixture", label: "Recover fixture", description: "Refresh deterministic fixture state without replaying intent.", availability: "direct", risk: "none", input: { kind: "none" } },
    );
  }
  return intents;
}

function normalizeRuntimeStatus(value: unknown): EmployeeExperienceModelV1["runtime"]["status"] {
  const text = String(value ?? "").toLowerCase();
  if (/recover|repair/.test(text)) return "recovering";
  if (/stall|block|fail|unhealthy/.test(text)) return "stalled";
  if (/degrad/.test(text)) return "degraded";
  if (/complete|done|success/.test(text)) return "completed";
  if (/wait|need/.test(text)) return "waiting";
  if (/active|work|healthy/.test(text)) return "active";
  if (/initial|form/.test(text)) return "initial";
  return "unknown";
}

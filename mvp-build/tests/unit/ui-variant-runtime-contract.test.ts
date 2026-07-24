import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  UI_VARIANT_CAPABILITIES,
  UiVariantManifest,
  admitUiVariantForRuntime,
  projectExperienceModelForVariant,
  resolveUiVariantIntent,
  type EmployeeExperienceModelV1,
  type UiVariantAdmission,
  type UiVariantCapability,
} from "@amtech/shared";

const manifest = (slug: string): UiVariantManifest =>
  UiVariantManifest.parse(JSON.parse(readFileSync(resolve(`apps/web/ui-variants/${slug}/variant.json`), "utf8")));

const REFERENCE_CLIENT = manifest("reference-client");
const EDITORIAL_STUDIO = manifest("editorial-studio");
const RADICAL_CANVAS = manifest("radical-canvas");

function liveAdmission(input: {
  manifest: UiVariantManifest;
  operatorAcknowledged?: boolean;
}): UiVariantAdmission {
  return admitUiVariantForRuntime({
    manifest: input.manifest,
    surface: "live_owner_workbench",
    adapterKey: "owner_web",
    operatorAcknowledged: input.operatorAcknowledged ?? false,
  });
}

function model(overrides: Partial<EmployeeExperienceModelV1> = {}): EmployeeExperienceModelV1 {
  return {
    version: 1,
    adapter_key: "owner_web",
    presentation: {
      version: 1,
      theme_key: "brand",
      layout_key: "conversation_workspace",
      component_set_key: "standard",
      density: "balanced",
      brand: { primary: "#112233" },
      source: "onboarding_brand",
    },
    identity: {
      account_id: "acct_live",
      assignment_id: "asg_live",
      employee_id: "emp_live",
      employee_name: "Nova",
      employee_status: "active",
      business_name: "Palaskas Painting",
      business_kind: "painting",
      profile_key: "painter",
      profile_version: "3",
    },
    context: {
      dominant_domains: ["estimates"],
      owner_experience: "standard",
      preferred_density: "balanced",
      signals: [{ id: "s1", source: "profile", key: "trade", label: "Trade", value: "painting", confidence: "high", freshness: "current" }],
    },
    runtime: {
      status: "active",
      health: "live",
      phase: null,
      summary: "Working the estimate queue.",
      progress: null,
      running: true,
      observed_at: "2026-07-23T20:00:00.000Z",
      sequence: 7,
    },
    conversation: [
      { id: "m1", direction: "inbound", body: "Where is the Riverside estimate?", status: "delivered", created_at: "2026-07-23T19:00:00.000Z" },
    ] as EmployeeExperienceModelV1["conversation"],
    work: {
      guidance: { headline: "Finish the estimate", summary: "One estimate is waiting on measurements.", mode: "working", suggested_prompt: null },
      loops: [{ id: "loop1", title: "Riverside estimate", state: "active" }] as EmployeeExperienceModelV1["work"]["loops"],
      tasks: [{ id: "task1" }] as EmployeeExperienceModelV1["work"]["tasks"],
      delegated: [{ id: "d1" }] as EmployeeExperienceModelV1["work"]["delegated"],
    },
    attention: {
      decisions: [{ id: "dec1" }] as EmployeeExperienceModelV1["attention"]["decisions"],
      approvals: [{ id: "ap1", summary: "Send the Riverside estimate", risk_level: "high" }] as EmployeeExperienceModelV1["attention"]["approvals"],
      resurface_items: [{ id: "r1" }] as EmployeeExperienceModelV1["attention"]["resurface_items"],
    },
    waiting: [{ id: "save1" }] as EmployeeExperienceModelV1["waiting"],
    changes: [{ id: "chg1" }] as EmployeeExperienceModelV1["changes"],
    connections: [{ id: "conn1" }] as EmployeeExperienceModelV1["connections"],
    abilities: [{ id: "ab1" }] as EmployeeExperienceModelV1["abilities"],
    capabilities: [{ id: "cap1" }] as EmployeeExperienceModelV1["capabilities"],
    evidence: [{ id: "ev1" }] as EmployeeExperienceModelV1["evidence"],
    outputs: [{ id: "out1", title: "Riverside estimate", href: "/agent/emp_live/output/out1" }] as EmployeeExperienceModelV1["outputs"],
    intents: [
      { id: "send-message", kind: "send_message", label: "Send message", description: "Send owner input.", availability: "reference_client", risk: "low", input: { kind: "text" } },
      { id: "approve:ap1", kind: "approve", label: "Review approval", description: "Send the Riverside estimate", availability: "reference_client", risk: "high", target: { kind: "approval", id: "ap1" }, input: { kind: "confirmation" } },
      { id: "open:out1", kind: "open_resource", label: "Open Riverside estimate", description: "Open an owner-safe resource.", availability: "direct", risk: "low", target: { kind: "document", id: "out1" }, input: { kind: "none" } },
      { id: "retired", kind: "submit_command", label: "Retired", description: "Not offered.", availability: "unavailable", risk: "low", input: { kind: "none" } },
      { id: "fixture-reset", kind: "reset_fixture", label: "Reset fixture", description: "Restore fixture state.", availability: "direct", risk: "none", input: { kind: "none" } },
    ],
    metadata: {
      generated_at: "2026-07-23T20:00:00.000Z",
      evidence_level: "live",
      fixture: false,
      scenario_id: null,
      contract_fingerprint: "employee-experience-v1:emp_live:owner_web",
    },
    ...overrides,
  };
}

function withCapabilities(base: UiVariantManifest, capabilities: {
  required?: UiVariantCapability[];
  optional?: UiVariantCapability[];
  intentionally_omitted?: UiVariantCapability[];
}): UiVariantManifest {
  return {
    ...base,
    capabilities: {
      required: capabilities.required ?? [],
      optional: capabilities.optional ?? [],
      intentionally_omitted: capabilities.intentionally_omitted ?? [],
    },
  };
}

describe("Phase 2 generated experience runtime admission policy", () => {
  it("admits the approved reference client on the live owner workbench without acknowledgement", () => {
    const admission = liveAdmission({ manifest: REFERENCE_CLIENT });
    expect(admission.admitted).toBe(true);
    expect(admission.tier).toBe("approved");
    expect(admission.reason_code).toBe("admitted_approved");
    expect(admission.requires_banner).toBe(false);
    expect(admission.requires_reference_client).toBe(true);
  });

  it("refuses a candidate variant live employee data until an operator acknowledges lab review", () => {
    const denied = liveAdmission({ manifest: EDITORIAL_STUDIO });
    expect(denied.admitted).toBe(false);
    expect(denied.tier).toBe("refused");
    expect(denied.reason_code).toBe("candidate_requires_operator_acknowledgement");

    const acknowledged = liveAdmission({ manifest: EDITORIAL_STUDIO, operatorAcknowledged: true });
    expect(acknowledged.admitted).toBe(true);
    expect(acknowledged.tier).toBe("candidate_lab_review");
    expect(acknowledged.reason_code).toBe("admitted_candidate_lab_review");
    expect(acknowledged.requires_banner).toBe(true);
  });

  it("never admits an experiment or lab-only variant to live employee data, acknowledged or not", () => {
    for (const operatorAcknowledged of [false, true]) {
      const admission = liveAdmission({ manifest: RADICAL_CANVAS, operatorAcknowledged });
      expect(admission.admitted).toBe(false);
      expect(admission.tier).toBe("refused");
      expect(admission.reason_code).toBe("experiment_denied_on_live");
    }
    const labOnlyCandidate = liveAdmission({
      manifest: { ...RADICAL_CANVAS, status: "candidate" },
      operatorAcknowledged: true,
    });
    expect(labOnlyCandidate.admitted).toBe(false);
    expect(labOnlyCandidate.reason_code).toBe("lab_only_denied_on_live");
  });

  it("refuses deprecated variants and unsupported adapters on every surface", () => {
    const deprecated = admitUiVariantForRuntime({
      manifest: { ...REFERENCE_CLIENT, status: "deprecated" },
      surface: "fixture_lab",
      adapterKey: "owner_web",
      operatorAcknowledged: true,
    });
    expect(deprecated.admitted).toBe(false);
    expect(deprecated.reason_code).toBe("variant_deprecated");

    const wrongAdapter = admitUiVariantForRuntime({
      manifest: EDITORIAL_STUDIO,
      surface: "fixture_lab",
      adapterKey: "public_form",
      operatorAcknowledged: true,
    });
    expect(wrongAdapter.admitted).toBe(false);
    expect(wrongAdapter.reason_code).toBe("adapter_unsupported");
  });

  it("admits lab-only and experiment variants on the explicit fixture surface", () => {
    const admission = admitUiVariantForRuntime({
      manifest: RADICAL_CANVAS,
      surface: "fixture_lab",
      adapterKey: "owner_web",
    });
    expect(admission.admitted).toBe(true);
    expect(admission.reason_code).toBe("admitted_fixture_lab");
    expect(admission.requires_banner).toBe(true);
  });

  it("fails closed on an unrecognized status or eligibility rather than defaulting to admitted", () => {
    const admission = liveAdmission({
      manifest: { ...REFERENCE_CLIENT, production: { ...REFERENCE_CLIENT.production, eligibility: "unknown_tier" as never } },
      operatorAcknowledged: true,
    });
    expect(admission.admitted).toBe(false);
    expect(admission.reason_code).toBe("variant_policy_unrecognized");
  });

  it("never leaks a raw manifest field or employee identifier into the owner-facing refusal message", () => {
    const denied = liveAdmission({ manifest: RADICAL_CANVAS });
    expect(denied.owner_message.length).toBeGreaterThan(12);
    expect(denied.owner_message).not.toMatch(/lab_only|experiment|eligibility|manifest/i);
  });
});

describe("Phase 2 capability-scoped model projection", () => {
  it("passes through every capability the current registry manifests declare", () => {
    for (const item of [REFERENCE_CLIENT, EDITORIAL_STUDIO]) {
      const projection = projectExperienceModelForVariant(model(), item);
      expect(projection.withheld).toEqual([]);
      expect(projection.model.identity.employee_name).toBe("Nova");
      expect(projection.model.attention.approvals).toHaveLength(1);
    }
  });

  it("withholds a capability the manifest never declared, keeping the shape but emptying the content", () => {
    const projection = projectExperienceModelForVariant(model(), RADICAL_CANVAS);
    expect(projection.withheld).toContain("presentation");
    expect(projection.granted).not.toContain("presentation");
    expect(projection.model.presentation.brand).toEqual({});
    expect(projection.model.presentation.source).toBe("adapter_default");
    expect(projection.model.work.loops).toHaveLength(1);
  });

  it("empties conversation, attention, outputs, and connections for a variant that omits them", () => {
    const narrow = withCapabilities(EDITORIAL_STUDIO, { required: ["identity", "runtime"], optional: ["work"] });
    const projection = projectExperienceModelForVariant(model(), narrow);
    expect(projection.model.conversation).toEqual([]);
    expect(projection.model.attention.approvals).toEqual([]);
    expect(projection.model.attention.decisions).toEqual([]);
    expect(projection.model.attention.resurface_items).toEqual([]);
    expect(projection.model.outputs).toEqual([]);
    expect(projection.model.connections).toEqual([]);
    expect(projection.model.evidence).toEqual([]);
    expect(projection.model.waiting).toEqual([]);
    expect(projection.model.changes).toEqual([]);
    expect(projection.model.context.signals).toEqual([]);
    expect(projection.model.work.loops).toHaveLength(1);
  });

  it("treats an intentionally omitted capability as withheld even when it also appears as optional", () => {
    const conflicted = withCapabilities(EDITORIAL_STUDIO, {
      required: ["identity", "runtime"],
      optional: ["conversation"],
      intentionally_omitted: ["conversation"],
    });
    const projection = projectExperienceModelForVariant(model(), conflicted);
    expect(projection.withheld).toContain("conversation");
    expect(projection.model.conversation).toEqual([]);
  });

  it("withholds identity content when a manifest does not declare identity", () => {
    const anonymous = withCapabilities(EDITORIAL_STUDIO, { required: ["runtime"] });
    const projection = projectExperienceModelForVariant(model(), anonymous);
    expect(projection.model.identity.employee_name).toBe("");
    expect(projection.model.identity.account_id).toBe("");
    expect(projection.model.identity.business_name).toBeNull();
    expect(projection.model.runtime.summary).toBe("Working the estimate queue.");
  });

  it("withholds abilities alongside capabilities and clears fixture metadata without forging provenance", () => {
    const narrow = withCapabilities(EDITORIAL_STUDIO, { required: ["identity", "runtime"] });
    const projection = projectExperienceModelForVariant(
      model({ metadata: { ...model().metadata, fixture: true, scenario_id: "scenario-a" } }),
      narrow,
    );
    expect(projection.model.abilities).toEqual([]);
    expect(projection.model.capabilities).toEqual([]);
    expect(projection.model.metadata.fixture).toBe(false);
    expect(projection.model.metadata.scenario_id).toBeNull();
    expect(projection.model.metadata.evidence_level).toBe("live");
    expect(projection.model.metadata.contract_fingerprint).toBe("employee-experience-v1:emp_live:owner_web");
  });

  it("covers every declared capability in the registry enum so a new capability cannot silently pass through", () => {
    const projection = projectExperienceModelForVariant(model(), withCapabilities(EDITORIAL_STUDIO, {}));
    expect([...projection.withheld].sort()).toEqual([...UI_VARIANT_CAPABILITIES].sort());
    expect(projection.granted).toEqual([]);
  });
});

describe("Phase 2 bounded intent bridge", () => {
  const approved = liveAdmission({ manifest: REFERENCE_CLIENT });
  const labReview = liveAdmission({ manifest: EDITORIAL_STUDIO, operatorAcknowledged: true });

  it("maps a declared owner message intent onto the send_owner_message host method", () => {
    const resolution = resolveUiVariantIntent({
      request: { intent_id: "send-message", value: "Send the Riverside estimate today" },
      model: model(),
      admission: approved,
    });
    expect(resolution.allowed).toBe(true);
    expect(resolution.host_method).toBe("send_owner_message");
    expect(resolution.code).toBe("intent_allowed");
    expect(resolution.audit.decision).toBe("allowed");
  });

  it("maps approval and resource intents onto their host methods for an approved variant", () => {
    expect(resolveUiVariantIntent({ request: { intent_id: "approve:ap1" }, model: model(), admission: approved }).host_method)
      .toBe("resolve_approval");
    expect(resolveUiVariantIntent({ request: { intent_id: "open:out1" }, model: model(), admission: approved }).host_method)
      .toBe("open_owner_resource");
  });

  it("rejects an intent the projected model does not declare", () => {
    const withheld = projectExperienceModelForVariant(model(), withCapabilities(EDITORIAL_STUDIO, { required: ["identity", "runtime"] }));
    const resolution = resolveUiVariantIntent({
      request: { intent_id: "send-message", value: "hello" },
      model: withheld.model,
      admission: labReview,
    });
    expect(resolution.allowed).toBe(false);
    expect(resolution.host_method).toBeNull();
    expect(resolution.code).toBe("intent_undeclared");
  });

  it("rejects an intent the model marks unavailable", () => {
    const resolution = resolveUiVariantIntent({ request: { intent_id: "retired" }, model: model(), admission: approved });
    expect(resolution.allowed).toBe(false);
    expect(resolution.code).toBe("intent_unavailable");
  });

  it("rejects every dispatch from a variant that was not admitted", () => {
    const refused = liveAdmission({ manifest: RADICAL_CANVAS });
    const resolution = resolveUiVariantIntent({ request: { intent_id: "send-message", value: "hello" }, model: model(), admission: refused });
    expect(resolution.allowed).toBe(false);
    expect(resolution.code).toBe("variant_not_admitted");
  });

  it("denies fixture intents on the live surface and live intents on the fixture surface", () => {
    const live = resolveUiVariantIntent({ request: { intent_id: "fixture-reset" }, model: model(), admission: approved });
    expect(live.allowed).toBe(false);
    expect(live.code).toBe("fixture_intent_denied_on_live");

    const fixtureAdmission = admitUiVariantForRuntime({ manifest: REFERENCE_CLIENT, surface: "fixture_lab", adapterKey: "owner_web" });
    const fixture = resolveUiVariantIntent({ request: { intent_id: "send-message", value: "hello" }, model: model(), admission: fixtureAdmission });
    expect(fixture.allowed).toBe(false);
    expect(fixture.code).toBe("live_intent_denied_on_fixture");

    const fixtureReset = resolveUiVariantIntent({ request: { intent_id: "fixture-reset" }, model: model(), admission: fixtureAdmission });
    expect(fixtureReset.allowed).toBe(true);
    expect(fixtureReset.host_method).toBe("reset_fixture_state");
  });

  it("denies a high-risk intent to a candidate variant under lab review", () => {
    const resolution = resolveUiVariantIntent({ request: { intent_id: "approve:ap1" }, model: model(), admission: labReview });
    expect(resolution.allowed).toBe(false);
    expect(resolution.code).toBe("intent_risk_denied_for_candidate_variant");
  });

  it("rejects an unsupported intent kind instead of falling through to a host method", () => {
    const custom = model({
      intents: [{ id: "custom-1", kind: "custom", label: "Custom", description: "Anything", availability: "direct", risk: "low", input: { kind: "none" } }],
    });
    const resolution = resolveUiVariantIntent({ request: { intent_id: "custom-1" }, model: custom, admission: approved });
    expect(resolution.allowed).toBe(false);
    expect(resolution.code).toBe("intent_kind_unsupported");
  });

  it("emits a bounded redacted audit record that carries no owner payload or credential material", () => {
    const resolution = resolveUiVariantIntent({
      request: { intent_id: "send-message", value: "Route the invoice to sk_live_secret@example.com" },
      model: model(),
      admission: approved,
    });
    const serialized = JSON.stringify(resolution.audit);
    expect(serialized).not.toContain("sk_live_secret");
    expect(serialized).not.toContain("Route the invoice");
    expect(Object.keys(resolution.audit).sort()).toEqual([
      "code",
      "decision",
      "employee_id",
      "host_method",
      "intent_id",
      "intent_kind",
      "surface",
      "variant_id",
    ]);
  });
});

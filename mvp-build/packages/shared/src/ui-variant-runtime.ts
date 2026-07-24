import type { EmployeeUiAdapterKey, EmployeeUiPresentationProfile } from "./employee-ui-presentation.js";
import {
  UI_VARIANT_CAPABILITIES,
  type EmployeeExperienceIntent,
  type EmployeeExperienceModelV1,
  type UiVariantCapability,
  type UiVariantHostMethod,
  type UiVariantIntentAudit,
  type UiVariantIntentRequest,
  type UiVariantManifest,
} from "./ui-variant.js";

/**
 * Phase 2 generated experience runtime.
 *
 * Manager owns authority. This module is the whole boundary between an approved UI variant and
 * the live owner projection: which variants may see live employee state, which slice of
 * EmployeeExperienceModelV1 each one receives, and which bounded host action an intent may reach.
 * It is deliberately pure so the policy is provable without a browser.
 */

export type UiVariantRuntimeSurface = "live_owner_workbench" | "fixture_lab";
export type UiVariantAdmissionTier = "approved" | "candidate_lab_review" | "refused";

export interface UiVariantAdmission {
  admitted: boolean;
  variant_id: string;
  surface: UiVariantRuntimeSurface;
  tier: UiVariantAdmissionTier;
  reason_code: string;
  owner_message: string;
  requires_reference_client: boolean;
  requires_banner: boolean;
}

export interface UiVariantModelProjection {
  model: EmployeeExperienceModelV1;
  granted: UiVariantCapability[];
  withheld: UiVariantCapability[];
}

export interface UiVariantIntentResolution {
  allowed: boolean;
  host_method: UiVariantHostMethod | null;
  intent: EmployeeExperienceIntent | null;
  code: string;
  message: string;
  audit: UiVariantIntentAudit;
}

const KNOWN_STATUS = new Set(["experiment", "candidate", "approved", "deprecated"]);
const KNOWN_ELIGIBILITY = new Set(["lab_only", "candidate", "approved"]);
const FIXTURE_INTENT_KINDS = new Set(["reset_fixture", "interrupt_fixture", "recover_fixture"]);

const HOST_METHOD_BY_INTENT_KIND: Record<string, UiVariantHostMethod> = {
  send_message: "send_owner_message",
  submit_command: "send_owner_message",
  respond: "send_owner_message",
  approve: "resolve_approval",
  open_resource: "open_owner_resource",
  reset_fixture: "reset_fixture_state",
  interrupt_fixture: "reset_fixture_state",
  recover_fixture: "reset_fixture_state",
};

function refusal(input: {
  manifest: UiVariantManifest;
  surface: UiVariantRuntimeSurface;
  reason_code: string;
  owner_message: string;
}): UiVariantAdmission {
  return {
    admitted: false,
    variant_id: input.manifest.id,
    surface: input.surface,
    tier: "refused",
    reason_code: input.reason_code,
    owner_message: input.owner_message,
    requires_reference_client: Boolean(input.manifest.production?.requires_reference_client),
    requires_banner: false,
  };
}

/**
 * Decide whether one variant may render for one surface. Live employee state is the protected
 * resource: only an approved variant reaches it unconditionally, a candidate reaches it only when
 * an operator has explicitly acknowledged lab review, and an experiment or lab-only variant never
 * does. Unrecognized policy values fail closed rather than defaulting to admitted.
 */
export function admitUiVariantForRuntime(input: {
  manifest: UiVariantManifest;
  surface: UiVariantRuntimeSurface;
  adapterKey: EmployeeUiAdapterKey;
  operatorAcknowledged?: boolean;
}): UiVariantAdmission {
  const { manifest, surface, adapterKey } = input;
  const live = surface === "live_owner_workbench";
  const status = String(manifest.status ?? "");
  const eligibility = String(manifest.production?.eligibility ?? "");
  const requiresReferenceClient = Boolean(manifest.production?.requires_reference_client);

  if (status === "deprecated") {
    return refusal({ manifest, surface, reason_code: "variant_deprecated", owner_message: "This employee experience has been retired and is no longer available." });
  }
  if (!(manifest.supported_adapters ?? []).includes(adapterKey as never)) {
    return refusal({ manifest, surface, reason_code: "adapter_unsupported", owner_message: "This employee experience was not built for this surface." });
  }
  if (!KNOWN_STATUS.has(status) || !KNOWN_ELIGIBILITY.has(eligibility)) {
    return refusal({ manifest, surface, reason_code: "variant_policy_unrecognized", owner_message: "AMTECH could not confirm this experience is cleared for use, so it was not opened." });
  }

  if (live) {
    if (status === "experiment") {
      return refusal({ manifest, surface, reason_code: "experiment_denied_on_live", owner_message: "This design is still an in-progress study, so AMTECH did not open it over your real employee." });
    }
    if (eligibility === "lab_only") {
      return refusal({ manifest, surface, reason_code: "lab_only_denied_on_live", owner_message: "This design is restricted to sample data, so AMTECH did not open it over your real employee." });
    }
    // A candidate on either axis is treated as a candidate: the most restrictive declaration wins.
    if (status === "candidate" || eligibility === "candidate") {
      if (!input.operatorAcknowledged) {
        return refusal({ manifest, surface, reason_code: "candidate_requires_operator_acknowledgement", owner_message: "This design has not finished review, so AMTECH did not open it over your real employee." });
      }
      return {
        admitted: true,
        variant_id: manifest.id,
        surface,
        tier: "candidate_lab_review",
        reason_code: "admitted_candidate_lab_review",
        owner_message: "Opened for review only. This design is not the production experience.",
        requires_reference_client: requiresReferenceClient,
        requires_banner: true,
      };
    }
    return {
      admitted: true,
      variant_id: manifest.id,
      surface,
      tier: "approved",
      reason_code: "admitted_approved",
      owner_message: "Approved employee experience.",
      requires_reference_client: requiresReferenceClient,
      requires_banner: false,
    };
  }

  return {
    admitted: true,
    variant_id: manifest.id,
    surface,
    tier: eligibility === "approved" ? "approved" : "candidate_lab_review",
    reason_code: "admitted_fixture_lab",
    owner_message: "Opened against explicit sample data. No real employee state is shown.",
    requires_reference_client: requiresReferenceClient,
    requires_banner: eligibility !== "approved",
  };
}

function declaredCapabilities(manifest: UiVariantManifest): Set<UiVariantCapability> {
  const omitted = new Set(manifest.capabilities?.intentionally_omitted ?? []);
  const declared = new Set<UiVariantCapability>();
  for (const capability of [...(manifest.capabilities?.required ?? []), ...(manifest.capabilities?.optional ?? [])]) {
    // An intentionally omitted capability stays withheld even when it also appears as optional.
    if (!omitted.has(capability)) declared.add(capability);
  }
  return declared;
}

function neutralPresentation(presentation: EmployeeUiPresentationProfile): EmployeeUiPresentationProfile {
  return {
    version: 1,
    theme_key: "amtech_light",
    layout_key: "conversation_workspace",
    component_set_key: "standard",
    density: "balanced",
    brand: {},
    source: "adapter_default",
  } satisfies EmployeeUiPresentationProfile as typeof presentation;
}

/**
 * Narrow the model to what the manifest actually declares. A variant that never declared a
 * capability receives its neutral empty shape rather than live owner content, so a manifest is a
 * runtime boundary instead of documentation.
 */
export function projectExperienceModelForVariant(
  model: EmployeeExperienceModelV1,
  manifest: UiVariantManifest,
): UiVariantModelProjection {
  const declared = declaredCapabilities(manifest);
  const has = (capability: UiVariantCapability) => declared.has(capability);
  const granted: UiVariantCapability[] = [];
  const withheld: UiVariantCapability[] = [];
  for (const capability of UI_VARIANT_CAPABILITIES) (has(capability) ? granted : withheld).push(capability);

  const projected: EmployeeExperienceModelV1 = {
    version: model.version,
    adapter_key: model.adapter_key,
    presentation: has("presentation") ? model.presentation : neutralPresentation(model.presentation),
    identity: has("identity")
      ? model.identity
      : {
          account_id: "",
          assignment_id: null,
          employee_id: "",
          employee_name: "",
          employee_status: null,
          business_name: null,
          business_kind: null,
          profile_key: null,
          profile_version: null,
        },
    context: has("context")
      ? model.context
      : { dominant_domains: [], owner_experience: null, preferred_density: null, signals: [] },
    runtime: has("runtime")
      ? model.runtime
      : {
          status: "unknown",
          health: null,
          phase: null,
          summary: "",
          progress: null,
          running: false,
          observed_at: null,
          sequence: null,
        },
    conversation: has("conversation") ? model.conversation : [],
    work: has("work") ? model.work : { guidance: null, loops: [], tasks: [], delegated: [] },
    attention: has("attention") ? model.attention : { decisions: [], approvals: [], resurface_items: [] },
    waiting: has("waiting") ? model.waiting : [],
    changes: has("changes") ? model.changes : [],
    connections: has("connections") ? model.connections : [],
    // Abilities are the owner-facing view of the same capability surface and share its declaration.
    abilities: has("capabilities") ? model.abilities : [],
    capabilities: has("capabilities") ? model.capabilities : [],
    evidence: has("evidence") ? model.evidence : [],
    outputs: has("outputs") ? model.outputs : [],
    intents: has("intents") ? model.intents : [],
    metadata: {
      generated_at: model.metadata.generated_at,
      evidence_level: model.metadata.evidence_level,
      fixture: has("fixture_metadata") ? model.metadata.fixture : false,
      scenario_id: has("fixture_metadata") ? model.metadata.scenario_id ?? null : null,
      contract_fingerprint: model.metadata.contract_fingerprint,
    },
  };

  return { model: projected, granted, withheld };
}

function rejection(input: {
  admission: UiVariantAdmission;
  request: UiVariantIntentRequest;
  intent: EmployeeExperienceIntent | null;
  employeeId: string;
  code: string;
  message: string;
}): UiVariantIntentResolution {
  return {
    allowed: false,
    host_method: null,
    intent: input.intent,
    code: input.code,
    message: input.message,
    audit: {
      variant_id: input.admission.variant_id,
      surface: input.admission.surface,
      intent_id: input.request.intent_id,
      intent_kind: input.intent?.kind ?? null,
      host_method: null,
      decision: "rejected",
      code: input.code,
      employee_id: input.employeeId,
    },
  };
}

/**
 * Resolve one dispatched intent against the projected model and the admission decision. The
 * variant never names a host action directly: it names an intent the model already published, and
 * this resolver decides which bounded host method — if any — that intent may reach.
 */
export function resolveUiVariantIntent(input: {
  request: UiVariantIntentRequest;
  model: EmployeeExperienceModelV1;
  admission: UiVariantAdmission;
}): UiVariantIntentResolution {
  const { request, model, admission } = input;
  const employeeId = model.identity.employee_id;
  const live = admission.surface === "live_owner_workbench";
  const deny = (code: string, message: string, intent: EmployeeExperienceIntent | null) =>
    rejection({ admission, request, intent, employeeId, code, message });

  if (!admission.admitted) {
    return deny("variant_not_admitted", "This experience is not cleared to act on your employee.", null);
  }
  const intent = model.intents.find((candidate) => candidate.id === request.intent_id) ?? null;
  if (!intent) {
    return deny("intent_undeclared", "That action is not part of this experience.", null);
  }
  if (intent.availability === "unavailable") {
    return deny("intent_unavailable", "That action is not available right now.", intent);
  }
  const fixtureIntent = FIXTURE_INTENT_KINDS.has(intent.kind);
  if (live && fixtureIntent) {
    return deny("fixture_intent_denied_on_live", "Sample-data controls do not apply to your real employee.", intent);
  }
  if (!live && !fixtureIntent) {
    return deny("live_intent_denied_on_fixture", "This is sample data, so AMTECH did not send that action to your employee.", intent);
  }
  if (live && admission.tier === "candidate_lab_review" && intent.risk === "high") {
    return deny(
      "intent_risk_denied_for_candidate_variant",
      "This design is under review, so consequential actions stay in the production client.",
      intent,
    );
  }
  const host_method = HOST_METHOD_BY_INTENT_KIND[intent.kind];
  if (!host_method) {
    return deny("intent_kind_unsupported", "AMTECH does not have a governed action for that request.", intent);
  }

  return {
    allowed: true,
    host_method,
    intent,
    code: "intent_allowed",
    message: "Accepted for the governed host action.",
    audit: {
      variant_id: admission.variant_id,
      surface: admission.surface,
      intent_id: intent.id,
      intent_kind: intent.kind,
      host_method,
      decision: "allowed",
      code: "intent_allowed",
      employee_id: employeeId,
    },
  };
}

import type { CapabilityCategory } from "./materialization.js";
import type { ConnectorCustody } from "./connector-registry.js";
import {
  resolveManagedSetupForCapability,
  resolveOwnerManagedConnectorSetup,
} from "./connector-setup.js";

export type ConnectorAdapterKind =
  | "native_oauth"
  | "native_provider_onboarding"
  | "native_webhook"
  | "remote_mcp"
  | "managed_credentials"
  | "operator_managed";

export type ConnectorSetupExperience =
  | "amtech_managed_oauth"
  | "amtech_managed_provider_onboarding"
  | "guided_business_credentials"
  | "guided_webhook_subscription"
  | "guided_remote_mcp"
  | "amtech_managed_service";

export type ConnectorLifecycleState =
  | "available"
  | "setup_required"
  | "authorizing"
  | "connected"
  | "degraded"
  | "expired"
  | "revoked";

export type ConnectorEffectClass =
  | "read"
  | "internal_write"
  | "customer_facing"
  | "money_movement";

/**
 * Interaction grammar, not authentication. SMS, web, and voice render the same
 * approval decision. A verified owner SMS session does not re-authenticate on
 * every turn; Hermes interprets natural language against one exact work object.
 */
export type ApprovalInteraction =
  | "none"
  | "conversational"
  | "explicit"
  | "typed_confirmation";

export interface ConnectorCapabilityManifest {
  key: string;
  label: string;
  summary: string;
  category: CapabilityCategory;
  effect_class: ConnectorEffectClass;
  event_driven: boolean;
  actions: string[];
  triggers: string[];
}

export interface ConnectorRuntimeManifest {
  revision: "connector-runtime-v1";
  key: string;
  aliases: string[];
  label: string;
  adapter_kind: ConnectorAdapterKind;
  setup_experience: ConnectorSetupExperience;
  custody: ConnectorCustody;
  self_service_setup: boolean;
  supports_webhooks: boolean;
  supports_polling: boolean;
  supports_remote_mcp: boolean;
  vertical_hints: string[];
  workflow_hints: string[];
  capabilities: ConnectorCapabilityManifest[];
}

export interface AdaptiveConnectorPlanInput {
  business_kind?: string | null;
  business_description?: string | null;
  tools_mentioned?: readonly string[];
  top_workflows?: readonly string[];
  connected_connector_keys?: readonly string[];
}

export type AdaptiveRecommendationClass =
  | "activate_now"
  | "high_gain"
  | "use_if_needed"
  | "already_active";

export interface AdaptiveConnectorRecommendation {
  connector_key: string;
  label: string;
  recommendation_class: AdaptiveRecommendationClass;
  reasons: string[];
  self_service_setup: boolean;
  setup_experience: ConnectorSetupExperience;
  event_driven: boolean;
  custody: ConnectorCustody;
  next_steps: Array<
    | "connect"
    | "discover_capabilities"
    | "prove_read"
    | "enable_events"
    | "configure_approval_policy"
    | "activate_automation"
  >;
  highest_effect_class: ConnectorEffectClass;
}

export interface AdaptiveConnectorPlan {
  schema: "amtech.adaptive-connector-plan.v1";
  runtime_posture: {
    reasoning_and_discovery: "broad_by_default";
    consequential_effects: "fresh_manager_authority";
    owner_interaction: "natural_language_across_surfaces";
    unknown_connector_risk: "manager_custody_default_deny";
  };
  recommendations: AdaptiveConnectorRecommendation[];
}

export interface ConnectorSetupAction {
  key: string;
  label: string;
  setup_experience: ConnectorSetupExperience;
  self_service: boolean;
}

const MANIFESTS: readonly ConnectorRuntimeManifest[] = [
  {
    revision: "connector-runtime-v1",
    key: "gmail",
    aliases: ["gmail", "email", "google workspace", "google-workspace"],
    label: "Gmail",
    adapter_kind: "native_oauth",
    setup_experience: "amtech_managed_oauth",
    custody: "manager_mediated",
    self_service_setup: true,
    supports_webhooks: true,
    supports_polling: true,
    supports_remote_mcp: false,
    vertical_hints: ["service", "contractor", "agency", "professional", "commerce", "store"],
    workflow_hints: ["email", "inbox", "follow up", "customer reply", "estimate", "lead"],
    capabilities: [
      {
        key: "gmail.read_threads",
        label: "Read assigned email threads",
        summary: "Read and summarize assignment-scoped business email threads.",
        category: "communication",
        effect_class: "read",
        event_driven: true,
        actions: ["read", "summarize", "classify", "search"],
        triggers: ["message_received", "thread_updated"],
      },
      {
        key: "gmail.prepare_draft",
        label: "Prepare email drafts",
        summary: "Prepare customer or internal email drafts without sending them.",
        category: "communication",
        effect_class: "internal_write",
        event_driven: false,
        actions: ["draft"],
        triggers: [],
      },
      {
        key: "gmail.send_approved",
        label: "Send approved email",
        summary: "Send only the immutable draft covered by the owner’s current conversational approval.",
        category: "communication",
        effect_class: "customer_facing",
        event_driven: false,
        actions: ["send"],
        triggers: [],
      },
    ],
  },
  {
    revision: "connector-runtime-v1",
    key: "google_calendar",
    aliases: ["google calendar", "calendar", "gcal", "schedule"],
    label: "Google Calendar",
    adapter_kind: "native_oauth",
    setup_experience: "amtech_managed_oauth",
    custody: "manager_mediated",
    self_service_setup: false,
    supports_webhooks: true,
    supports_polling: true,
    supports_remote_mcp: true,
    vertical_hints: ["service", "contractor", "agency", "professional", "clinic", "appointment"],
    workflow_hints: ["calendar", "schedule", "appointment", "site visit", "meeting", "booking"],
    capabilities: [
      {
        key: "calendar.read_schedule",
        label: "Read business schedule",
        summary: "Read assignment-scoped availability and scheduled work.",
        category: "office",
        effect_class: "read",
        event_driven: true,
        actions: ["read", "find_availability"],
        triggers: ["event_created", "event_updated", "event_cancelled"],
      },
      {
        key: "calendar.manage_appointment",
        label: "Manage approved appointments",
        summary: "Create, update, or cancel customer-visible appointments through the normal approval grammar.",
        category: "office",
        effect_class: "customer_facing",
        event_driven: false,
        actions: ["create", "update", "cancel"],
        triggers: [],
      },
    ],
  },
  {
    revision: "connector-runtime-v1",
    key: "quickbooks",
    aliases: ["quickbooks", "qbo", "intuit", "accounting", "bookkeeping"],
    label: "QuickBooks",
    adapter_kind: "native_oauth",
    setup_experience: "amtech_managed_oauth",
    custody: "manager_mediated",
    self_service_setup: true,
    supports_webhooks: true,
    supports_polling: true,
    supports_remote_mcp: false,
    vertical_hints: ["contractor", "service", "bookkeeper", "accounting", "commerce", "store"],
    workflow_hints: ["invoice", "expense", "bill", "payment", "reconcile", "bookkeeping", "profit and loss"],
    capabilities: [
      {
        key: "quickbooks.read_books",
        label: "Read accounting records",
        summary: "Query bounded records and owner-safe accounting reports.",
        category: "accounting",
        effect_class: "read",
        event_driven: true,
        actions: ["query", "report", "summarize"],
        triggers: ["entity_created", "entity_updated"],
      },
      {
        key: "quickbooks.prepare_write",
        label: "Prepare accounting writes",
        summary: "Prepare an immutable expense, bill, invoice, payment, deposit, or journal entry.",
        category: "accounting",
        effect_class: "internal_write",
        event_driven: false,
        actions: ["prepare"],
        triggers: [],
      },
      {
        key: "quickbooks.commit_financial_write",
        label: "Commit approved financial writes",
        summary: "Commit only the stored write covered by its exact owner decision and effect identity.",
        category: "money",
        effect_class: "money_movement",
        event_driven: false,
        actions: ["commit"],
        triggers: [],
      },
    ],
  },
  {
    revision: "connector-runtime-v1",
    key: "stripe",
    aliases: ["stripe", "payments", "payment processing", "deposit"],
    label: "Stripe",
    adapter_kind: "native_provider_onboarding",
    setup_experience: "amtech_managed_provider_onboarding",
    custody: "manager_mediated",
    self_service_setup: true,
    supports_webhooks: true,
    supports_polling: true,
    supports_remote_mcp: false,
    vertical_hints: ["service", "contractor", "agency", "commerce", "store", "subscription"],
    workflow_hints: ["payment", "deposit", "invoice", "refund", "subscription", "payout"],
    capabilities: [
      {
        key: "stripe.read_payment_state",
        label: "Read payment state",
        summary: "Read payment, invoice, payout, and connected-account state.",
        category: "money",
        effect_class: "read",
        event_driven: true,
        actions: ["read", "reconcile", "follow_up"],
        triggers: ["invoice_updated", "payment_updated", "account_updated"],
      },
      {
        key: "stripe.send_approved_invoice",
        label: "Send approved invoices",
        summary: "Create and send only the invoice the owner approved in the normal conversation.",
        category: "money",
        effect_class: "customer_facing",
        event_driven: false,
        actions: ["send_invoice"],
        triggers: [],
      },
      {
        key: "stripe.money_movement",
        label: "Perform approved money movement",
        summary: "Perform a bounded money effect only after the explicit confirmation required by policy.",
        category: "money",
        effect_class: "money_movement",
        event_driven: false,
        actions: ["charge", "refund", "transfer"],
        triggers: [],
      },
    ],
  },
  {
    revision: "connector-runtime-v1",
    key: "shopify",
    aliases: ["shopify", "online store", "ecommerce", "e-commerce", "storefront"],
    label: "Shopify",
    adapter_kind: "native_webhook",
    setup_experience: "guided_webhook_subscription",
    custody: "manager_mediated",
    self_service_setup: false,
    supports_webhooks: true,
    supports_polling: true,
    supports_remote_mcp: true,
    vertical_hints: ["commerce", "store", "brand", "clothing", "apparel", "retail", "production"],
    workflow_hints: ["order", "inventory", "fulfillment", "customer", "refund", "product", "store"],
    capabilities: [
      {
        key: "shopify.read_store",
        label: "Read store operations",
        summary: "Read orders, inventory, products, customers, and fulfillment state.",
        category: "office",
        effect_class: "read",
        event_driven: true,
        actions: ["read", "summarize", "detect_exception"],
        triggers: ["order_created", "order_updated", "inventory_updated", "fulfillment_updated"],
      },
      {
        key: "shopify.manage_customer_order",
        label: "Manage approved order actions",
        summary: "Perform customer-visible order or fulfillment changes through the same approval grammar as every other tool.",
        category: "automation",
        effect_class: "customer_facing",
        event_driven: true,
        actions: ["update_order", "fulfill", "notify"],
        triggers: ["order_exception"],
      },
      {
        key: "shopify.refund",
        label: "Issue approved refunds",
        summary: "Issue a bounded refund only after the explicit confirmation selected by money policy.",
        category: "money",
        effect_class: "money_movement",
        event_driven: false,
        actions: ["refund"],
        triggers: [],
      },
    ],
  },
  {
    revision: "connector-runtime-v1",
    key: "twilio_sms",
    aliases: ["twilio", "sms", "text message", "texting"],
    label: "SMS",
    adapter_kind: "native_webhook",
    setup_experience: "amtech_managed_service",
    custody: "manager_mediated",
    self_service_setup: false,
    supports_webhooks: true,
    supports_polling: false,
    supports_remote_mcp: false,
    vertical_hints: ["owner", "service", "contractor", "commerce", "store", "field"],
    workflow_hints: ["sms", "text", "urgent", "approval", "customer update"],
    capabilities: [
      {
        key: "sms.owner_session",
        label: "Use SMS as an owner session",
        summary: "Continue the normal assignment-bound employee conversation by text without repeated authentication challenges.",
        category: "communication",
        effect_class: "read",
        event_driven: true,
        actions: ["receive", "reply", "continue_session"],
        triggers: ["message_received", "delivery_status"],
      },
      {
        key: "sms.owner_decisions",
        label: "Carry natural-language owner decisions",
        summary: "Resolve approve, edit, reject, and respond decisions against the exact work object currently being discussed.",
        category: "system",
        effect_class: "internal_write",
        event_driven: true,
        actions: ["approve", "edit", "reject", "respond"],
        triggers: ["owner_reply"],
      },
      {
        key: "sms.customer_message",
        label: "Send approved customer SMS",
        summary: "Send a customer-facing text only through current approval and durable effect custody.",
        category: "communication",
        effect_class: "customer_facing",
        event_driven: false,
        actions: ["send"],
        triggers: [],
      },
    ],
  },
  {
    revision: "connector-runtime-v1",
    key: "telegram",
    aliases: ["telegram", "telegram bot"],
    label: "Telegram",
    adapter_kind: "native_webhook",
    setup_experience: "guided_webhook_subscription",
    custody: "manager_mediated",
    self_service_setup: false,
    supports_webhooks: true,
    supports_polling: true,
    supports_remote_mcp: true,
    vertical_hints: ["owner", "operator", "commerce", "store", "technical"],
    workflow_hints: ["telegram", "bot", "notification", "store update", "owner alert"],
    capabilities: [
      {
        key: "telegram.owner_session",
        label: "Use Telegram as an owner session",
        summary: "Route verified owner messages and proactive business alerts through an assignment-bound bot.",
        category: "communication",
        effect_class: "read",
        event_driven: true,
        actions: ["receive", "reply", "notify"],
        triggers: ["message_received", "business_alert"],
      },
    ],
  },
  {
    revision: "connector-runtime-v1",
    key: "remote_mcp",
    aliases: ["mcp", "remote mcp", "custom integration", "custom connector"],
    label: "Custom business system",
    adapter_kind: "remote_mcp",
    setup_experience: "guided_remote_mcp",
    custody: "manager_mediated",
    self_service_setup: false,
    supports_webhooks: false,
    supports_polling: true,
    supports_remote_mcp: true,
    vertical_hints: [],
    workflow_hints: ["custom", "internal system", "api", "mcp"],
    capabilities: [],
  },
] as const;

const EFFECT_ORDER: Record<ConnectorEffectClass, number> = {
  read: 0,
  internal_write: 1,
  customer_facing: 2,
  money_movement: 3,
};

const RECOMMENDATION_ORDER: Record<AdaptiveRecommendationClass, number> = {
  already_active: 0,
  activate_now: 1,
  high_gain: 2,
  use_if_needed: 3,
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function containsHint(text: string, hint: string): boolean {
  const normalizedHint = normalize(hint);
  return Boolean(normalizedHint) && text.includes(normalizedHint);
}

function humanLabel(value: string): string {
  const normalized = value.replace(/[_:-]+/g, " ").trim();
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase()) || "Business system";
}

function cloneCapability(value: ConnectorCapabilityManifest): ConnectorCapabilityManifest {
  return { ...value, actions: [...value.actions], triggers: [...value.triggers] };
}

function cloneManifest(value: ConnectorRuntimeManifest): ConnectorRuntimeManifest {
  return {
    ...value,
    aliases: [...value.aliases],
    vertical_hints: [...value.vertical_hints],
    workflow_hints: [...value.workflow_hints],
    capabilities: value.capabilities.map(cloneCapability),
  };
}

export function connectorRuntimeManifests(): ConnectorRuntimeManifest[] {
  return MANIFESTS.map(cloneManifest);
}

export function resolveConnectorRuntimeManifest(value: string | null | undefined): ConnectorRuntimeManifest | null {
  const needle = normalize(String(value ?? ""));
  if (!needle) return null;
  const match = MANIFESTS.find((manifest) =>
    normalize(manifest.key) === needle
    || manifest.aliases.some((alias) => normalize(alias) === needle)
    || manifest.aliases.some((alias) => containsHint(needle, alias)),
  );
  return match ? cloneManifest(match) : null;
}

/** Unknown systems remain connectable through one guided, fail-closed experience. */
export function genericConnectorRuntimeManifest(value: string): ConnectorRuntimeManifest {
  const key = normalize(value).replace(/\s+/g, "_") || "custom_business_system";
  return {
    revision: "connector-runtime-v1",
    key,
    aliases: [value],
    label: humanLabel(value),
    adapter_kind: "operator_managed",
    setup_experience: "guided_business_credentials",
    custody: "manager_mediated",
    self_service_setup: false,
    supports_webhooks: false,
    supports_polling: false,
    supports_remote_mcp: true,
    vertical_hints: [],
    workflow_hints: [],
    capabilities: [],
  };
}

export function approvalInteractionForEffect(effectClass: ConnectorEffectClass): ApprovalInteraction {
  if (effectClass === "money_movement") return "explicit";
  if (effectClass === "customer_facing") return "conversational";
  return "none";
}

export function effectClassForActionKey(actionKey: string): ConnectorEffectClass {
  const action = normalize(actionKey);
  if (/(refund|transfer|charge|payment|payout|bill pay|money movement)/.test(action)) return "money_movement";
  if (/(send|publish|notify|appointment|cancel|fulfill|customer)/.test(action)) return "customer_facing";
  if (/(create|update|commit|write|draft|categorize|reconcile)/.test(action)) return "internal_write";
  return "read";
}

export function resolveConnectorSetupActionForCapability(input: {
  connector_id?: string | null;
  server_id?: string | null;
  tool_name?: string | null;
  category?: string | null;
  server_label?: string | null;
}): ConnectorSetupAction | null {
  const managed = resolveManagedSetupForCapability({
    connector_id: input.connector_id ?? null,
    server_id: input.server_id ?? "",
    tool_name: input.tool_name ?? "",
    category: input.category ?? "system",
  });
  if (managed) {
    const manifest = resolveConnectorRuntimeManifest(managed.key);
    return {
      key: managed.key,
      label: managed.label,
      setup_experience: manifest?.setup_experience ?? "amtech_managed_oauth",
      self_service: true,
    };
  }

  const candidate = input.connector_id || (input.server_id && input.server_id !== "amtech-manager" ? input.server_id : null);
  if (!candidate) return null;
  const manifest = resolveConnectorRuntimeManifest(candidate) ?? genericConnectorRuntimeManifest(input.server_label || candidate);
  return {
    key: manifest.key,
    label: manifest.label,
    setup_experience: manifest.setup_experience,
    self_service: false,
  };
}

function highestEffectClass(manifest: ConnectorRuntimeManifest): ConnectorEffectClass {
  return manifest.capabilities.reduce<ConnectorEffectClass>((highest, capability) =>
    EFFECT_ORDER[capability.effect_class] > EFFECT_ORDER[highest] ? capability.effect_class : highest,
  "read");
}

function recommendationForManifest(
  manifest: ConnectorRuntimeManifest,
  normalizedBusiness: string,
  normalizedWork: string,
  normalizedTools: string,
  connected: Set<string>,
): AdaptiveConnectorRecommendation {
  const aliases = [manifest.key, ...manifest.aliases];
  const explicitToolMatch = aliases.some((alias) => containsHint(normalizedTools, alias));
  const workflowMatches = manifest.workflow_hints.filter((hint) => containsHint(normalizedWork, hint));
  const verticalMatches = manifest.vertical_hints.filter((hint) => containsHint(normalizedBusiness, hint));
  const alreadyConnected = connected.has(manifest.key)
    || [...connected].some((key) => aliases.some((alias) => containsHint(normalize(key), alias)));
  const reasons: string[] = [];
  if (explicitToolMatch) reasons.push("Named during onboarding");
  if (workflowMatches.length) reasons.push(`Matches repeat work: ${workflowMatches.slice(0, 3).join(", ")}`);
  if (verticalMatches.length) reasons.push(`Fits this business: ${verticalMatches.slice(0, 3).join(", ")}`);
  if (manifest.supports_webhooks) reasons.push("Can wake the employee from verified business events");

  let recommendationClass: AdaptiveRecommendationClass = "use_if_needed";
  if (alreadyConnected) recommendationClass = "already_active";
  else if (explicitToolMatch) recommendationClass = "activate_now";
  else if (workflowMatches.length > 0 && (verticalMatches.length > 0 || manifest.supports_webhooks)) recommendationClass = "high_gain";

  const highest = highestEffectClass(manifest);
  const nextSteps: AdaptiveConnectorRecommendation["next_steps"] = [];
  if (!alreadyConnected) nextSteps.push("connect");
  nextSteps.push("discover_capabilities", "prove_read");
  if (manifest.supports_webhooks) nextSteps.push("enable_events");
  if (highest === "customer_facing" || highest === "money_movement") nextSteps.push("configure_approval_policy");
  if (manifest.supports_webhooks || manifest.supports_polling) nextSteps.push("activate_automation");

  return {
    connector_key: manifest.key,
    label: manifest.label,
    recommendation_class: recommendationClass,
    reasons: reasons.length ? reasons : ["Available when this system becomes relevant"],
    self_service_setup: Boolean(resolveOwnerManagedConnectorSetup(manifest.key)) && manifest.self_service_setup,
    setup_experience: manifest.setup_experience,
    event_driven: manifest.supports_webhooks,
    custody: manifest.custody,
    next_steps: [...new Set(nextSteps)],
    highest_effect_class: highest,
  };
}

/**
 * Deterministic first-use activation plan. Exact named tools dominate, followed
 * by observed workflow/vertical matches and event-capable systems. It broadens
 * discovery without relaxing the final Manager effect boundary.
 */
export function compileAdaptiveConnectorPlan(input: AdaptiveConnectorPlanInput): AdaptiveConnectorPlan {
  const normalizedBusiness = normalize([input.business_kind, input.business_description].filter(Boolean).join(" "));
  const normalizedWork = normalize((input.top_workflows ?? []).join(" "));
  const normalizedTools = normalize((input.tools_mentioned ?? []).join(" "));
  const connected = new Set((input.connected_connector_keys ?? []).map((value) => normalize(value).replace(/ /g, "_")));

  const recommendations = MANIFESTS
    .map((manifest) => recommendationForManifest(manifest, normalizedBusiness, normalizedWork, normalizedTools, connected))
    .sort((a, b) => {
      const classDelta = RECOMMENDATION_ORDER[a.recommendation_class] - RECOMMENDATION_ORDER[b.recommendation_class];
      if (classDelta !== 0) return classDelta;
      const eventDelta = Number(b.event_driven) - Number(a.event_driven);
      if (eventDelta !== 0) return eventDelta;
      return a.label.localeCompare(b.label);
    });

  return {
    schema: "amtech.adaptive-connector-plan.v1",
    runtime_posture: {
      reasoning_and_discovery: "broad_by_default",
      consequential_effects: "fresh_manager_authority",
      owner_interaction: "natural_language_across_surfaces",
      unknown_connector_risk: "manager_custody_default_deny",
    },
    recommendations,
  };
}

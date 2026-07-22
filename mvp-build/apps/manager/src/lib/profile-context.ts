import type { OnboardingManifest, ProfileContext, ProfileContextFact, ProfileContextSlot } from "@amtech/shared";

const DEFAULT_MEMORY_LIMITS = { memory_chars: 2200, user_chars: 1375 } as const;

const MANAGER_RESOURCES = [
  "amtech://manager/business-brain",
  "amtech://manager/business-facts",
  "amtech://manager/connector-status",
  "amtech://manager/work-queue",
  "amtech://manager/artifacts",
  "amtech://manager/approvals",
  "amtech://manager/capability-registry",
] as const;

function fact(key: string, value: unknown, extra: Partial<ProfileContextFact> = {}): ProfileContextFact | null {
  if (value === undefined || value === null) return null;
  const text = Array.isArray(value)
    ? value.map((v) => String(v).trim()).filter(Boolean).join(", ")
    : String(value).trim();
  if (!text) return null;
  return { key, value: text, source: "manifest", ...extra };
}

function facts(values: Array<ProfileContextFact | null>): ProfileContextFact[] {
  return values.filter((v): v is ProfileContextFact => Boolean(v));
}

function sourcedFacts(
  category: string,
  items: OnboardingManifest["pricing_facts"],
): ProfileContextFact[] {
  return items.map((item) => ({
    key: `${category}.${item.key}`,
    value: item.value,
    confidence: item.confidence,
    source: "onboarding",
  }));
}

function slot(key: string, title: string, priority: number, slotFacts: ProfileContextFact[]): ProfileContextSlot {
  return { key, title, priority, facts: slotFacts };
}

function serializedPresentation(manifest: OnboardingManifest): string | undefined {
  return manifest.ui_presentation ? JSON.stringify(manifest.ui_presentation) : undefined;
}

function contractorEstimatorContext(packageKey: string, manifest: OnboardingManifest): ProfileContext {
  const answers = manifest.seven_question_answers ?? {};
  return {
    package_key: packageKey,
    generated_from: "onboarding_manifest",
    memory_limits: DEFAULT_MEMORY_LIMITS,
    resource_pointers: [...MANAGER_RESOURCES],
    ui_presentation: manifest.ui_presentation,
    slots: [
      slot("business_identity", "Business identity", 10, facts([
        fact("business_name", manifest.business_display_name),
        fact("business_kind", manifest.business_kind),
        fact("timezone", manifest.timezone),
        fact("business_answer", answers.business),
      ])),
      slot("owner_identity", "Owner identity", 20, facts([
        fact("owner_name", manifest.owner_name),
        fact("owner_phone", manifest.verified_phone_e164),
        fact("owner_email", manifest.owner_email),
      ])),
      slot("workflows", "Workflows", 30, facts([
        fact("top_workflows", manifest.top_workflows),
        fact("repeat_computer_work", answers.repeat_computer_work),
        fact("team_shape", answers.team),
      ])),
      slot("tools", "Tools", 40, facts([
        fact("tools_mentioned", manifest.tools_mentioned),
        fact("tools_answer", answers.tools_in_use),
        fact("seed_skills", manifest.seed_skills),
      ])),
      slot("durable_facts", "Durable facts", 50, [
        ...sourcedFacts("pricing", manifest.pricing_facts),
        ...sourcedFacts("branding", manifest.branding_facts),
        ...sourcedFacts("customer", manifest.customer_job_facts),
        ...facts([
          fact("money_shape", answers.money_shape),
          fact("ideal_customer", answers.ideal_customer),
          fact("friction_customer", answers.friction_customer),
        ]),
      ]),
      slot("standing_preferences", "Standing preferences", 60, facts([
        fact("profile_prompt", manifest.profile_prompt),
        fact("ui_presentation", serializedPresentation(manifest)),
      ])),
      slot("live_state_pointers", "Live state pointers", 70, MANAGER_RESOURCES.map((uri) => ({
        key: uri.replace("amtech://manager/", ""),
        value: uri,
        source: "manifest",
      }))),
    ],
  };
}

function genericPackageContext(packageKey: string, manifest: OnboardingManifest): ProfileContext {
  return {
    package_key: packageKey,
    generated_from: "onboarding_manifest",
    memory_limits: DEFAULT_MEMORY_LIMITS,
    resource_pointers: [...MANAGER_RESOURCES],
    ui_presentation: manifest.ui_presentation,
    slots: [
      slot("business_identity", "Business identity", 10, facts([
        fact("business_name", manifest.business_display_name),
        fact("business_kind", manifest.business_kind),
        fact("timezone", manifest.timezone),
      ])),
      slot("owner_identity", "Owner identity", 20, facts([
        fact("owner_name", manifest.owner_name),
        fact("owner_phone", manifest.verified_phone_e164),
      ])),
      slot("workflows", "Workflows", 30, facts([
        fact("top_workflows", manifest.top_workflows),
        fact("tools_mentioned", manifest.tools_mentioned),
        fact("seed_skills", manifest.seed_skills),
      ])),
      slot("durable_facts", "Durable facts", 50, [
        ...sourcedFacts("pricing", manifest.pricing_facts),
        ...sourcedFacts("branding", manifest.branding_facts),
        ...sourcedFacts("customer", manifest.customer_job_facts),
      ]),
      slot("standing_preferences", "Standing preferences", 60, facts([
        fact("ui_presentation", serializedPresentation(manifest)),
      ])),
      slot("live_state_pointers", "Live state pointers", 70, MANAGER_RESOURCES.map((uri) => ({
        key: uri.replace("amtech://manager/", ""),
        value: uri,
        source: "manifest",
      }))),
    ],
  };
}

export function buildProfileContext(input: {
  packageKey: string;
  manifest: OnboardingManifest;
}): ProfileContext {
  if (input.packageKey === "contractor_estimator") {
    return contractorEstimatorContext(input.packageKey, input.manifest);
  }
  return genericPackageContext(input.packageKey, input.manifest);
}

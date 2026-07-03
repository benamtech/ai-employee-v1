/**
 * Onboarding manifest — the structured summary the front-door orchestrator
 * produces and `provision_employee` consumes.
 *
 * Spec: ../../../wiki/MVP/old-build-plan/05-front-door-orchestrator.md ("Manifest Output")
 * and wiki/product-ai-employee-context.md ("The seven-question contract").
 *
 * The raw transcript is preserved verbatim (transcript_ref) and seeds the brain;
 * this structured manifest is the deterministic intake. Pricing/branding facts
 * are first-class so the employee never re-asks what onboarding already supplied.
 */

import { z } from "zod";

/** How phone ownership was proven (clean A2P/TCPA record). */
export const VerificationMethod = z.enum(["twilio_verify", "sms_inbound"]);
export type VerificationMethod = z.infer<typeof VerificationMethod>;

export const ConsentChannel = z.enum(["web", "sms"]);
export type ConsentChannel = z.infer<typeof ConsentChannel>;

/** A durable fact captured during onboarding, with its source snippet. */
export const SourcedFact = z.object({
  key: z.string(),
  value: z.string(),
  /** Verbatim snippet from the conversation this was derived from. */
  source_snippet: z.string().optional(),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
});
export type SourcedFact = z.infer<typeof SourcedFact>;

/**
 * The seven-question contract (each question captures more than one fact).
 * Stored verbatim AND mapped to manifest fields by the deterministic intake.
 */
export const SevenQuestionAnswers = z.object({
  business: z.string().describe("name + what it does + how long"),
  team: z.string().describe("headcount + roles"),
  repeat_computer_work: z.string().describe("the repeat work that wastes the most time"),
  tools_in_use: z.string(),
  money_shape: z.string().describe("revenue band + typical job size"),
  ideal_customer: z.string(),
  friction_customer: z.string(),
});
export type SevenQuestionAnswers = z.infer<typeof SevenQuestionAnswers>;

export const OnboardingManifest = z.object({
  // package selection
  employee_type: z.string().min(1).default("contractor_estimator"),
  profile_package_key: z.string().min(1).default("contractor_estimator"),
  profile_prompt: z.string().optional(),

  // business identity
  business_display_name: z.string().min(1),
  business_kind: z.string().min(1).describe("e.g. painting, landscaping"),
  timezone: z.string().min(1).describe("IANA tz, e.g. America/New_York"),

  // owner identity
  owner_name: z.string().min(1),
  owner_email: z.string().email().optional(),
  /** E.164. The verified phone IS the employee's allowlisted owner number. */
  verified_phone_e164: z.string().regex(/^\+[1-9]\d{6,14}$/),
  verification_method: VerificationMethod,
  consent_channel: ConsentChannel,

  // employee
  employee_name: z.string().min(1).describe("what the owner wants to call the agent"),

  // work shape
  top_workflows: z.array(z.string()).default([]),
  tools_mentioned: z.array(z.string()).default([]),
  seed_skills: z.array(z.string()).default([]),

  // first-class brain seeds (so the employee never re-asks)
  pricing_facts: z.array(SourcedFact).default([]),
  branding_facts: z.array(SourcedFact).default([]),
  customer_job_facts: z.array(SourcedFact).default([]),

  // raw contract + provenance
  seven_question_answers: SevenQuestionAnswers.partial().optional(),
  /** Reference to the stored raw transcript (seeds the brain verbatim). */
  transcript_ref: z.string().optional(),

  // set after account creation
  account_id: z.string().optional(),
});
export type OnboardingManifest = z.infer<typeof OnboardingManifest>;

/** The front-door state machine (05-front-door-orchestrator.md). */
export const OnboardingState = z.enum([
  "anonymous_chat",
  "business_context_collected",
  "manifest_summary_confirmed",
  "phone_verified",
  "amtech_account_created",
  "employee_claimed",
  "provision_requested",
  "employee_live",
]);
export type OnboardingState = z.infer<typeof OnboardingState>;

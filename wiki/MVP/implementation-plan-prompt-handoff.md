# Implementation-Plan Prompt Handoff

Status: complete

## Purpose

This handoff is for an agent whose job is **not** to implement AMTECH AI Employee directly. Its job is to write the best possible **Plan Mode prompt** for another agentic LLM so that the next agent creates a decision-complete implementation plan for a narrow phase slice, such as Phase 0+1 or Phase 1+2, while preserving the whole-product MVP architecture.

The output of that prompt should be an implementation plan, not code. The implementation plan should be small enough to execute carefully, with pass/fail criteria for every included capability and explicit awareness of how the slice fits the full MVP.

## Codegraph Orientation

```text
identity.md
  -> CODEGRAPH.md
  -> wiki/README.md
  -> wiki/MVP/prompting-guide.md
  -> wiki/product-ai-employee-context.md
  -> wiki/product-agent-platform-architecture.md
  -> wiki/MVP/old-build-plan/README.md
       -> 00-source-of-truth-and-rules.md
       -> 01-mvp-scope-and-milestones.md
       -> 02-system-architecture.md
       -> 03-data-model.md
       -> 04-manager-tools.md
       -> 05-front-door-orchestrator.md
       -> 06-interaction-wrapper.md
       -> 07-provisioning-runtime.md
       -> 08-connectors-email-v1.md
       -> 09-event-mesh-v1.md
       -> 10-security-ops-observability.md
       -> 11-agent-team-workstreams.md
       -> 12-tests-demo-acceptance.md
       -> 13-backlog-non-goals.md
  -> wiki/ai-employee-mvp-build-plan-handoff.md
  -> wiki/offers/estimator-whole-product.md
```

Primary truth packet:

```json
{
  "mvp_bar": "real whole-product loop",
  "must_work_end_to_end": [
    "signup_or_claim_or_sms_onboarding",
    "live_employee_over_sms_and_web",
    "walkthrough_to_estimate_conversation",
    "pdf_estimate_signed_link",
    "approved_gmail_send_with_pdf",
    "real_gmail_reply_event",
    "approved_stripe_connect_test_mode_deposit_invoice",
    "stripe_webhook_trace",
    "internal_job_reminder"
  ],
  "not_accepted": [
    "payment_gate_before_employee_creation",
    "raw_hermes_dashboard_as_customer_ui",
    "manual_provider_result_in_place_of_gmail_or_stripe",
    "connector_oauth_without_test_and_report",
    "external_send_or_money_action_without_approval"
  ],
  "default_policy": {
    "stripe_mode": "provider_test_mode_for_mvp",
    "email_provider": "gmail_first",
    "notification_channel": "sms_default",
    "calendar": "internal_reminder_required_google_calendar_fast_follow",
    "entitlements": "default_allow"
  },
  "model_routing": {
    "default_planning_model": "GPT-5.5",
    "heavy_implementation_model": "Claude Opus 4.8",
    "planning_effort": "high/deep reasoning",
    "implementation_effort": "high or xhigh for broad multi-file work",
    "final_output_rule": "do not ask for hidden chain-of-thought; require concise rationale, source memory, self-checks, and pass/fail criteria"
  }
}
```

## Phase Mapping For Prompt Writers

Use this phase map when asking a Plan Mode agent to plan only part of the build:

| Phase | Build-plan source | Scope | Required proof |
|---|---|---|---|
| **Phase 0** | `00-source-of-truth-and-rules.md`, `02-system-architecture.md`, `03-data-model.md`, `04-manager-tools.md`, `10-security-ops-observability.md` | Project grounding, repo inspection, architecture decisions, data model/migrations, Manager tool contracts, provider setup inventory, test harness strategy | Decision-complete implementation plan with no product ambiguity and no direct implementation |
| **Phase 1** | `05-front-door-orchestrator.md`, `07-provisioning-runtime.md`, account sections of `03-data-model.md` | signup/claim/SMS onboarding, phone verification, AMTECH account creation, employee claim, provisioning job, first live SMS/web route | Account id, verified phone proof, employee id, first live SMS proof, runtime route health |
| **Phase 2** | `06-interaction-wrapper.md`, estimate/artifact sections of `03-data-model.md`, artifact tools in `04-manager-tools.md` | live employee SMS/web interaction, business brain lookup, pricing discovery, estimate artifact, PDF, signed output link, approval primitive | estimate artifact id, PDF link, approval id, brain facts stored |
| **Phase 3** | `08-connectors-email-v1.md`, Gmail tools in `04-manager-tools.md`, event mesh portions of `09-event-mesh-v1.md` | Gmail OAuth, connector test, approved estimate email with PDF, Gmail watch/PubSub/history sync, real customer reply event, employee SMS notification | Gmail connector id, watch/history id, sent message/thread id, reply message id, outbound SMS id |
| **Phase 4** | Stripe portions of `03-data-model.md`, `04-manager-tools.md`, `09-event-mesh-v1.md` | Stripe Connect test-mode onboarding, deposit invoice from approved estimate, send/payment URL, signed webhook processing | Stripe connected account id, invoice id, hosted invoice URL, Stripe webhook event id |
| **Phase 5** | reminder portions of `03-data-model.md`, `06-interaction-wrapper.md`, `12-tests-demo-acceptance.md` | internal job commitment/reminder, SMS reminder policy, Google Calendar offer but no calendar write requirement | reminder id, scheduled state, SMS reminder proof |
| **Phase 6** | `10-security-ops-observability.md`, `12-tests-demo-acceptance.md` | hardening, repair commands, observability, forged-provider tests, pilot containment | runbook, failing forged webhook tests, connector repair proofs |

Do not let a phase slice erase later constraints. For example, a Phase 1 plan must not build account/provisioning in a way that blocks Phase 3 Gmail thread ownership or Phase 4 Stripe account ownership.

## Prompt-Writing Protocol

The prompt-writing agent should require the Plan Mode agent to:

1. Read the required files before asking questions.
2. Apply `wiki/MVP/prompting-guide.md`: GPT-5.5-class high/deep reasoning for planning, Opus 4.8-class high/xhigh effort for heavy implementation handoff assumptions.
3. Treat discoverable facts as repo truth and inspect them, not ask about them.
4. Ask only high-impact preference questions.
5. Produce a phase-limited implementation plan that is decision-complete.
6. Include pass/fail acceptance for each capability in the phase.
7. Include integration seams for later phases.
8. Include test strategy and provider-proof expectations.
9. Explicitly state what is out of scope for the selected phase.
10. Preserve the whole-product MVP bar even when planning a narrow phase.

## Pass/Fail Model

Every phase plan should include:

```json
{
  "phase_slice": "phase_0_and_1",
  "done_means": [
    "all included capabilities have observable proof",
    "later phase dependencies are not blocked",
    "security boundaries are named",
    "provider proof ids are specified where provider work exists",
    "wiki/codegraph update points are named"
  ],
  "fail_if": [
    "plan requires payment before employee creation",
    "plan depends on a manually injected provider result for MVP acceptance",
    "plan exposes raw Hermes as customer UI",
    "plan omits approval gates for external or money actions",
    "plan leaves implementers to choose major schemas/routes/tools"
  ]
}
```

## Handoff Protocol For The Future Implementation Planner

The final implementation plan produced by the next Plan Mode agent should include:

- **Source memory:** files read, product facts locked, open assumptions.
- **Phase scope:** exact phase numbers and included capabilities.
- **Architecture slice:** components, routes, data objects, Manager tools, runtime/provider seams.
- **Execution sequence:** ordered implementation blocks with dependencies.
- **Pass/fail checks:** proof required for each block.
- **Tests:** unit, integration, provider test-mode, manual demo checks.
- **Wiki/codegraph updates:** docs to update after implementation.
- **Carry-forward notes:** what the next phase must inherit.

## Prompt To Give An Unaware Plan Mode Agent

Use this prompt to ask another agent to design the best prompt for phased implementation planning:

```text
You are in Plan Mode. Your task is not to implement code. Your task is to write the best possible prompt for a future agentic LLM that will create a decision-complete implementation plan for the first implementation slice of the AMTECH AI Employee MVP.

First, ground yourself by reading these files in this order:

1. identity.md
2. CODEGRAPH.md
3. wiki/README.md
4. wiki/MVP/prompting-guide.md
5. wiki/product-ai-employee-context.md
6. wiki/product-agent-platform-architecture.md
7. wiki/MVP/old-build-plan/README.md
8. wiki/MVP/old-build-plan/00-source-of-truth-and-rules.md
9. wiki/MVP/old-build-plan/01-mvp-scope-and-milestones.md
10. wiki/MVP/old-build-plan/02-system-architecture.md
11. wiki/MVP/old-build-plan/03-data-model.md
12. wiki/MVP/old-build-plan/04-manager-tools.md
13. wiki/MVP/old-build-plan/10-security-ops-observability.md
14. wiki/MVP/old-build-plan/12-tests-demo-acceptance.md
15. wiki/MVP/implementation-plan-prompt-handoff.md

Then inspect the local project structure enough to understand where implementation would likely happen, but do not edit files. Treat the current wiki as product truth.

Use GPT-5.5-class high/deep reasoning for this planning-prompt task. The future implementation plan may be handed to Claude Opus 4.8 for heavy implementation, so the prompt should preserve enough concrete detail for a high/xhigh-effort implementation agent to execute without re-litigating product decisions.

The future implementation-plan prompt you write should kick off planning for the whole AMTECH AI Employee MVP, but the plan it asks for should only implement Phase 0 and Phase 1 first. It must keep the full MVP in mind:

- signup/claim/SMS onboarding
- live employee over SMS and web
- walkthrough-to-estimate conversation
- PDF estimate signed link
- approved Gmail send
- real Gmail reply event
- approved Stripe Connect test-mode deposit invoice/payment link
- internal reminder

For this first slice, use this phase mapping:

- Phase 0: source grounding, architecture decisions, data model/migration plan, Manager tool contracts, provider setup inventory, test harness strategy.
- Phase 1: web claim/create-ai-employee/SMS onboarding, phone verification, AMTECH account creation, employee claim, provisioning job, first live SMS, owner web route.

Your output must be a single copy-ready prompt for the future implementation-planning agent. That prompt must require the future agent to:

- read the same source files before asking questions;
- inspect repo facts instead of asking about discoverable details;
- ask only high-impact product or implementation questions;
- produce a decision-complete implementation plan for Phase 0 and Phase 1 only;
- include pass/fail criteria for every Phase 0/1 feature;
- name the integration seams that Phase 2+ must inherit;
- preserve the no-payment-gate rule;
- preserve the real-provider MVP bar even though Gmail/Stripe are later phases;
- include test strategy, security boundaries, observability, and wiki/codegraph update points;
- output its final plan in a <proposed_plan> block.
- avoid asking for hidden chain-of-thought in final output; require concise rationale, source memory, self-checks, and pass/fail evidence instead.

Do not let the future agent implement anything. It should plan only. The prompt you write should be precise enough that a strong coding agent can use it to produce a build-ready implementation plan without re-litigating the product.
```

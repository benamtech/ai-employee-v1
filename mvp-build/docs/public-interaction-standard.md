# AMTECH Public Interaction Standard

Status: active product standard

Every public AMTECH interaction should feel like a first encounter with a capable AI employee, not a form, wizard, or SaaS workflow.

## The Standard

- Conversation captures intent. Secure controls collect secrets, identity, payments, provider credentials, and approvals.
- The user experiences one relationship. Do not split public flows into disconnected chatbot, form, status panel, and dashboard products.
- Quick consecutive messages should be treated as one evolving owner intent where possible.
- The interface may stream progress, but public users see business movement only: reading, preparing, needs your say, ready, blocked, done.
- Chat is not storage. Meaningful work becomes a typed object, preview, approval, receipt, or proof record.
- Risky actions show exact consequences and fixed approval controls. Generated UI may vary; safety grammar does not.

## Secure-Control Rule

Phone numbers, verification codes, passwords, payment data, provider credentials, account identifiers, and session tokens do not go to the onboarding LLM. They stay in deterministic controls and server-side tools.

Secure controls should:

- appear inline when needed;
- show pending, done, and error states;
- collapse after success;
- avoid fake chat bubbles such as "I entered my phone number";
- return clear owner-facing errors.

## Agentic API Rule

Public conversational APIs should prefer session-level turns over request-level replies.

Minimum behavior:

- coalesce rapid owner messages before calling the model;
- show a living response state while the agent works;
- keep model-bound context structured and redacted;
- use a larger context budget for business understanding, not raw transcript bloat.

The internal planning format may use compact metaprogramming-style forms for intents, slots, missing facts, next affordance, and manifest patches. Browser contracts remain normal JSON and owner-safe.

## Public Surface Checklist

Applies to create employee, estimator, claim/login, signed reviews, customer estimate/payment pages, and future public employee links.

- Starts with a natural business prompt.
- Uses secure controls for private/risky data.
- Does not expose internal provider/tool/runtime language.
- Provides specific recovery messages.
- Saves proof when work completes.
- Works on mobile first.

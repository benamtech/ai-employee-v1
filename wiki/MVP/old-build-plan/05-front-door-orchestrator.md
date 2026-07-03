# Front-Door Orchestrator

Status: complete

## Purpose

The front door is an LLM-only onboarding agent that lets a prospect talk naturally before account creation, then turns verified account setup into a real employee. Server code persists state and validates tool inputs; the conversational manifest extraction is model-driven.

## Model/API Boundary

Research note, 2026-06-29: keep the onboarding agent on an OpenAI-compatible API boundary, with strict structured output as the default. This matches the current provider reality:

- xAI/Grok documents OpenAI SDK usage by setting `base_url`/`baseURL` to `https://api.x.ai/v1`, and its quickstart shows Grok calls through OpenAI-compatible clients: <https://docs.x.ai/developers/quickstart>.
- xAI structured-output docs show `chat.completions.create` with `response_format: { type: "json_schema", json_schema: { strict: true, ... } }`: <https://docs.x.ai/developers/model-capabilities/text/structured-outputs>.
- OpenAI docs recommend Structured Outputs over JSON mode when possible because JSON mode only guarantees valid JSON, while Structured Outputs are intended to adhere to a schema: <https://developers.openai.com/api/docs/guides/structured-outputs>.

Implementation rule: the front-door orchestrator must not be hardwired to one model vendor. It should call an OpenAI-compatible chat-completions adapter configured by:

```text
ORCHESTRATOR_API_BASE_URL
ORCHESTRATOR_API_KEY / XAI_API_KEY / OPENAI_API_KEY
ORCHESTRATOR_MODEL
ORCHESTRATOR_RESPONSE_FORMAT=json_schema|json_object|none
```

Default to `json_schema` for the onboarding response contract. Use `json_object` or `none` only as a provider fallback if a chosen OpenAI-compatible model rejects schema-constrained output. The server still owns validation, state transitions, account creation, phone verification, provisioning, and tool calls; the model only returns the next assistant message plus a manifest patch.

Scope clarification, 2026-06-29: this compatibility layer is for onboarding portability and implementation simplicity only. AMTECH's durable product surface is Hermes profiles/capabilities plus Manager/MCP tools, artifacts, approvals, connector events, and business-brain resources.

## Entry Points

- `amtechai.com/create-ai-employee`
- `amtechai.com/claim`
- AMTECH-owned Twilio number via keyword or natural opener

All entry points converge on the same state machine.

Channel rule: web and SMS share the same orchestrator route, session store, manifest draft, and transcript shape. The channel changes transport and identity proof only; it must not create a second onboarding logic path.

## State Machine

```text
anonymous_chat
  -> business_context_collected
  -> manifest_summary_confirmed
  -> phone_verified
  -> amtech_account_created
  -> employee_claimed
  -> provision_requested
  -> employee_live
```

Before `phone_verified`, the agent can collect context and answer product questions. It cannot provision, connect providers, send external messages, or perform business operations.

## Conversation Contract

The onboarding agent gathers:

- what kind of business this is;
- what work the owner wants handled;
- current tools;
- pricing/rates/materials if naturally supplied;
- logo/template/brand hints if supplied;
- customer/job shape;
- owner phone, email, name, timezone;
- employee name preference.

It should not force a questionnaire if the owner already gave the information in prose. The raw transcript is preserved and the structured summary seeds the employee brain.

## Manifest Output

The manifest includes:

- employee type and selected `profile_package_key`;
- business identity;
- owner identity;
- verified phone;
- account id after creation;
- employee name;
- timezone;
- top workflows;
- tools mentioned;
- seed skills;
- pricing facts with source snippets;
- branding facts with source snippets;
- raw transcript ref.

Default package selection is `contractor_estimator` for the beachhead, but the manifest must be able to represent other employee packages.

## Account Handoff

The agent tells the owner what will happen:

```text
I can set that up. First I need to verify this phone, then you will create your AMTECH account so the employee belongs to you.
```

No payment step appears.

The smooth path should feel like one conversation:

1. Owner opens web chat or texts the front-door number.
2. Agent gathers business context conversationally and writes structured manifest patches.
3. Agent asks for phone verification when it has enough business context to explain what is being created.
4. Web flow uses Twilio Verify; SMS flow uses the signed inbound SMS plus single-use claim link.
5. Owner creates email/password account.
6. The same manifest/transcript are passed to `provision_employee`.
7. The claimed employee sends the first live SMS and appears at the owner web route.

## Post-Provision Handoff

When provisioning succeeds, the new employee sends the first live SMS. The onboarding surface can show:

- employee name;
- SMS number;
- web route;
- next suggested prompt: "Text me the job you just walked."

## Acceptance

- A test owner can start on web or SMS.
- Phone verification and account creation are required before provisioning.
- Business context collected before account creation is not lost.
- Employee brain contains onboarding facts and does not re-ask facts already supplied.
- The onboarding model call succeeds with an OpenAI-compatible provider using strict `json_schema` output.
- A Grok configuration (`ORCHESTRATOR_API_BASE_URL=https://api.x.ai/v1`, `ORCHESTRATOR_MODEL=grok-4.3`, `XAI_API_KEY`) can complete the same manifest extraction path, or fails clearly with documented fallback to `json_object`.

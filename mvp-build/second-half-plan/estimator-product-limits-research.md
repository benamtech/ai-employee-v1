# Estimator Product-Limits Research: Conversational Website Materialization

Status: research / plan-only
Date: 2026-07-12

## Scenario

The probe is deliberately simple: someone has a website and wants an AMTECH employee to be the estimator
inside a web chat. The "form" is the conversation. A visitor gives contact info, job details, optional
photos, and either uses seeded company data or supplies contractor-mode rates and assumptions in the chat.
The employee's job is to ask only what is missing and return an estimate as on-page HTML plus a downloadable
PDF path if the existing materialization layer supports it.

This is not a business-case exercise. It is a way to understand what the current AMTECH software is: a
profile factory, managed Hermes runtime, Manager control plane, and materialization layer that may be
re-renderable into shapes beyond the current owner Work Surface.

## What an AMTECH employee is in code

An employee today is generated from a profile package and `ProfileBuildParams`. The provisioner renders the
profile, activates routing, optionally configures SMS, starts the runtime, and returns runtime/API session
coordinates (`api_base_url`, `api_session_id`, `public_web_route`) from `/provision`
([provisioner.ts](../apps/manager/src/provisioner.ts), [profile-renderer.ts](../apps/manager/src/lib/profile-renderer.ts)).

The first package is `contractor_estimator`, but the package format is not only a prompt. It includes
`SOUL.md`, `config.yaml`, workspace brain files, skills, resource pointers, and memory limits
([distribution.yaml](../packages/agent-template/distribution.yaml)). CE-1/CE-2/CE-3 make that employee more
like a living business brain: native memory is seeded, Manager supplies a once-per-session primer, Hermes
compression is a safety net, and Manager rotates transcripts before compaction
([agent-context.ts](../apps/manager/src/lib/agent-context.ts), [session-rotation.ts](../apps/manager/src/lib/session-rotation.ts)).

The estimator skill already describes the work loop: gather scope, use business brain/rates, build line
items, create an estimate artifact, render/store a PDF, and create a signed link
([SKILL.md](../packages/agent-template/skills/estimate/SKILL.md)). For this probe, "company-data mode"
means use that seeded memory/business-brain path. "Contractor mode" means do not preload main company data;
the visitor supplies rates, surcharge, fee notes, and assumptions as session context for this estimate.

## How a local website can talk to it

There are two relevant runtime surfaces today:

- Manager-to-Hermes: `resolveRuntimeApi` loads a runtime endpoint and its bearer, then `executeHermesTurn`
  uses Hermes Runs first or Sessions chat fallback, preserving `session_id` and `X-Hermes-Session-Key`
  when supported ([hermes-client.ts](../apps/manager/src/lib/hermes-client.ts)).
- AMTECH web/SMS owner chat: the web route posts a message to Manager, Manager requires an owner session,
  writes `employee_messages`, stamps web presence, and calls `deliverOwnerTurnToRuntime`
  ([route.ts](../apps/web/app/api/employee/[employeeId]/message/route.ts),
  [server.ts](../apps/manager/src/server.ts), [runtime.ts](../apps/manager/src/lib/runtime.ts)).

For the local website estimator, the smallest useful adapter is a local API that accepts visitor messages
from a basic multimodal chat UI and forwards them to the employee. If the chosen UI can speak the Hermes
runtime chat/session surface directly, the local API can be thin. If not, Manager should proxy it, because
Manager already owns identity checks, message persistence, turn serialization, artifacts, and signed links
([server.ts](../apps/manager/src/server.ts), [turn-queue.ts](../apps/manager/src/lib/turn-queue.ts)).

The existing OpenAI-compatible adapter is for the front-door onboarding model, not for serving a generated
employee to public visitors. It proves the codebase already has an OpenAI-compatible request/response
boundary, but its schema is onboarding-specific (`assistant_message`, `manifest_patch`, onboarding state)
([orchestrator-model.ts](../apps/manager/src/lib/orchestrator-model.ts)).

## Session isolation finding

The key product limit is not "can a chat box send messages." It is isolation. Current owner turns are
serialized per employee through `employee_turn_jobs` and a per-employee lock
([turn-queue.ts](../apps/manager/src/lib/turn-queue.ts)). CE-3 tracks one active transcript per employee in
`employee_sessions` and repoints `runtime_endpoints.api_session_id` when rotating
([0030_employee_sessions.sql](../packages/db/migrations/0030_employee_sessions.sql),
[session-rotation.ts](../apps/manager/src/lib/session-rotation.ts)). Channel routing is owner-centric:
web presence wins over SMS fallback for the same employee/account relationship
([channel-router.ts](../apps/manager/src/lib/channel-router.ts)).

For a website estimator, each visitor should be a separate conversation. Mapping all visitors onto the same
employee and same `runtime_endpoints.api_session_id` would mix context and serialize unrelated visitors.
The likely local-probe shape is therefore:

- one generated estimator employee/profile/runtime;
- many visitor sessions mapped to distinct Hermes transcript ids;
- one stable memory/session key only if the visitor should share company memory, not visitor memory;
- Manager/local API carries a `visitor_session_id` and chooses the runtime `session_id` per visitor.

That is a new isolation primitive around today's owner-session model, but it is a small one for a local
probe. It is not the same as provisioning one employee per visitor.

## Multimodal ingress finding

The shared work descriptor vocabulary already has `media_asset` and generic tool result `media` types
([work-events.ts](../packages/shared/src/work-events.ts)). Artifact storage can upload private files and
mint short-lived signed storage URLs ([artifacts.ts](../apps/manager/src/lib/artifacts.ts)).

The current Twilio owner path does not ingest MMS media. The webhook reads form params, uses `Body`, writes
an `employee_messages` text row, and calls `deliverOwnerTurnToRuntime`; it does not process `NumMedia` or
`MediaUrl*` ([twilio.ts](../apps/manager/src/webhooks/twilio.ts)). So pictures in the website estimator
should enter through the local web/API path, either as direct multimodal message parts if Hermes accepts
the UI's payload, or as uploaded artifacts with signed/reference URLs passed to the employee.

For the research probe, the cleanest design is: local page uploads images to the local API; the API stores
or registers them as artifacts; the chat turn includes references, not image bytes. That matches the
project doctrine and the existing artifact/materialization boundary.

## Estimate materialization finding

The current estimate output path is already close to the desired materialization:

- `create_estimate_artifact` stores a structured estimate payload as an `artifacts` row
  ([estimate.stub.ts](../apps/manager/src/tools/estimate.stub.ts)).
- If no stored file exists, `renderArtifactHtml` turns any structured artifact payload into escaped,
  self-contained HTML with generic tables/sections ([artifact-view.ts](../apps/manager/src/lib/artifact-view.ts)).
- The web output route either returns that safe HTML or redirects to a signed storage URL for stored files
  ([output/[artifactId]/route.ts](../apps/web/app/agent/[employeeId]/output/[artifactId]/route.ts),
  [server.ts](../apps/manager/src/server.ts)).
- `render_estimate_pdf` accepts a base64 PDF, validates it, stores it in Supabase Storage, and updates the
  artifact `storage_ref`; `create_signed_artifact_link` mints a scoped artifact token
  ([estimate.stub.ts](../apps/manager/src/tools/estimate.stub.ts), [signed-links.ts](../apps/manager/src/lib/signed-links.ts)).
- Signed preview links already show the token-only public pattern for mobile review actions
  ([preview-links.ts](../apps/manager/src/lib/preview-links.ts), [preview-render.ts](../apps/manager/src/lib/preview-render.ts)).

The important limit: Manager does not currently render styled HTML into a PDF by itself. The existing PDF
tool stores PDF bytes supplied by the employee/tool caller. For a local estimator probe, HTML is available
immediately through the artifact fallback; PDF requires either the employee/runtime to produce a PDF file
and call `render_estimate_pdf`, or a small deterministic local HTML-to-PDF helper.

## Profile generation fit

The current onboarding manifest expects an owner/business setup, including verified phone, owner identity,
business kind, workflows, tools, pricing/branding/customer facts, and the seven-question contract
([manifest.ts](../packages/shared/src/manifest.ts)). That is correct for creating a back-office employee,
but it should not be forced onto a public website visitor.

For this probe, generate the employee with direct local setup inputs:

- company-data mode: seed business identity, owner identity, pricing facts, and estimator skill context
  into the profile package as normal;
- contractor mode: create a sparse estimator employee and let the visitor supply the estimating facts in
  conversation.

The `SOUL.md` and estimate skill both fit the interaction pattern, with one caveat: their current language
assumes the operator is the owner/supervisor ([SOUL.md](../packages/agent-template/SOUL.md),
[SKILL.md](../packages/agent-template/skills/estimate/SKILL.md)). The local estimator materialization needs
session framing that says: the website visitor is the estimate requester; company/customer-facing send
actions are not needed unless explicitly added; produce the estimate in-page.

## CE-1 through CE-4 mapping

- CE-1 native memory is useful for company-data mode: standing company facts live in `MEMORY.md`/`USER.md`
  and Manager resources, while the visitor conversation supplies transient job data
  ([agent-context.ts](../apps/manager/src/lib/agent-context.ts)).
- CE-2 hygiene/delegation helps keep image/tool/result references compact and prevents trivial events from
  waking the employee unnecessarily; the local estimator should still pass references rather than payloads.
- CE-3 rotation matters less for short visitor sessions, but its distinction between stable memory key and
  rotating transcript id is exactly the concept needed for many visitor conversations on one employee
  ([session-rotation.ts](../apps/manager/src/lib/session-rotation.ts)).
- CE-4 makes this less contractor-hardcoded: connector metadata and custody can describe read-only company
  data sources as direct MCP, while write/money/customer-facing systems remain Manager-mediated
  ([connector-registry.ts](../packages/shared/src/connector-registry.ts),
  [capability-registry.ts](../apps/manager/src/lib/capability-registry.ts),
  [profile-renderer.ts](../apps/manager/src/lib/profile-renderer.ts)).

## Verdict

The current software is capable of this as a local research materialization with a small adapter. The core
pieces exist: profile/package generation, managed Hermes runtime startup, Manager-mediated tools, native
memory/context priming, structured estimate artifacts, safe HTML rendering, signed output links, and a PDF
storage path.

The missing primitive is visitor-session isolation. Today's product is organized around one owner talking
to one employee through web/SMS, with per-employee serialized turns and owner-session auth. A website
estimator wants many anonymous visitor conversations against one estimator employee. That does not require
throwing away the architecture; it requires a visitor-session adapter that maps each visitor to a distinct
Hermes transcript and keeps artifacts/messages scoped to that visitor.

The deeper product lesson is that AMTECH is not only a contractor back-office UI. It is a managed Hermes
employee factory plus a materialization layer. The same employee brain can be materialized as owner SMS,
owner Work Surface, signed review link, admin inspector, or a conversational website estimator. The current
system proves the pattern, but the visitor-session primitive and deterministic PDF materializer are the two
clearest next seams exposed by this probe.

# Phase 4 - Tool-Agnostic Capability And Renderer Layer

Status: planned

Goal: make every Hermes skill/tool, Manager tool, MCP server tool, artifact, and deliverable materialize without writing a bespoke connector UI.

## Summary

The platform cannot scale if every connector gets custom product code. AMTECH should have a generic capability and rendering layer:

- discover and summarize what the employee can do;
- translate capability into owner language;
- let the employee call tools natively;
- render inputs, progress, outputs, approvals, and receipts generically;
- reserve bespoke UI only for trust-critical categories.

## Key Changes

- Create a capability registry/cache that merges:
  - Hermes `/v1/capabilities`;
  - Hermes `/v1/skills`;
  - Hermes `/v1/toolsets`;
  - Manager MCP `tools/list`;
  - Manager resources/status;
  - connector status;
  - account entitlements and safety policy.
- Add owner-facing capability metadata:
  - label;
  - category;
  - plain-English description;
  - setup requirement;
  - trust level;
  - can-run-now status;
  - preview/gate policy.
- Add Manager MCP resources for readable state:
  - business brain summary;
  - connector status;
  - artifact metadata;
  - approval status;
  - work queue;
  - runtime health;
  - capability registry.
- Add `SurfaceEnvelope`, `WorkResource`, and `WorkAction` shared contracts so every surface renders the same materialized employee state.
- Add an `EmployeeEventStream` projection that merges Hermes events, Manager tool events, artifacts, approvals, connector events, scheduler events, and provider events into owner-safe surface envelopes.
- Add output schemas for high-value Manager tools where practical.
- Wire `artifact-view.ts` or equivalent generic structured artifact rendering into artifact resolve.
- Expand `ToolActivityDescriptor` so tool results can carry safe structured previews, proof refs, and next actions.
- Add a generic run/task object for long-running work, connected to Work Surface and SMS previews.

## Renderer Tiers

Use deterministic precedence:

1. Trust-critical native cards: outbound messages, money movement, credential/connector changes, destructive actions, customer-facing sends.
2. MCP-UI resource: rich sandboxed interactive views compiled by Manager from safe data.
3. Schema-derived form/table/diff/schedule views from JSON Schema and structured payloads.
4. Generic artifact HTML from structured payload.
5. Safe text summary plus signed download/open link.

No renderer tier may relax approval requirements.

## Connector Strategy

- Provider-critical actions stay mediated by Manager for tenancy, secrets, audit, idempotency, approval, and proof.
- External MCP/provider tools can be added as employee capabilities only after permissioning and owner-language rendering exist.
- The owner sees "Connect email" or "Collect deposit", not "install Gmail MCP" or "call Stripe API".
- New connector setup should become a capability state transition: not connected -> pending consent -> connected -> tested -> needs reauth/degraded.

## Acceptance

- Adding a new schema-defined Manager tool produces:
  - MCP tools/list visibility;
  - capability registry entry;
  - generic input renderer;
  - generic result preview;
  - correct approval routing when gated;
  - SMS preview link if owner action is needed.
- A Hermes skill appears in capabilities and can be described to the owner without hardcoding it in React.
- A generic structured artifact with no PDF renders safely as HTML.
- A failed tool result appears as a repairable coworker message, not a raw exception.
- The same `WorkResource` can render as a web preview, SMS preview link, and admin/debug view.

## Tests

- Capability merge/cache tests.
- JSON Schema renderer tests for common schema shapes.
- Artifact HTML escaping tests.
- Approval-gate invariant tests across renderer tiers.
- Browser test for a generic tool_activity card and preview.
- SMS preview test for a generic task.

## Assumptions

- Tool availability should reflect the employee's rendered profile, Hermes runtime discovery, Manager tools, connector status, and policy together.
- It is acceptable to start with a small owner-language mapping table and grow it as capabilities appear.
- Manager resources should be read-only and safe by default.

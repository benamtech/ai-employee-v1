# Phase CE-4 — Connector-agnostic capabilities + operator modes

Status: source-wired (2026-07-12; live direct-MCP connector proof pending)

Goal: make the brain projection cover **any MCP connector** end-to-end (Jobber, ServiceTitan, Housecall
Pro, or any MCP tool), and let context policy vary by **business type** and **operator mode** — without
weakening the money/customer-facing safety boundary.

## Why

The founder's definition of the brain is a stream of events from **none/any/many** connectors. Hermes
natively supports this: an `mcp_servers` entry (stdio or HTTP, with `tools.include/exclude`, `resources`,
`prompts`, timeouts) is auto-discovered and its tools registered like built-ins; runtime tool changes
arrive via `notifications/tools/list_changed`. AMTECH's event ingress is already generic (`source: string`
adapter contract). But two things are not yet connector-agnostic:

1. **Capability routing is hardcoded per tool.** `capability-registry.ts` (`statusForTool`,
   `MANAGER_TOOL_META`) enumerates Gmail/Stripe/QBO by name; a new connector needs tool + meta + adapter,
   not just data. `deriveConnectionSurfaces` already has a generic "custom" path — the capability graph
   should follow.
2. **Safety boundary.** A third-party MCP connector wired directly into the employee's `config.yaml`
   bypasses the Manager approval gate + egress default-deny. So: **read-only** connectors may be direct
   MCP; **money/customer-facing/write** connectors must stay **Manager-mediated** (credential custody,
   approval gate, audit) — the same posture as QuickBooks today.

## Scope

- **Connector-agnostic capability model:** derive capability nodes + connection surfaces from connector
  metadata (category, read/write, connected state) rather than per-tool literals, so a new MCP connector
  appears in the brain projection, Connected surface, and resurfacing with zero bespoke UI.
- **Custody policy per connector:** a declarative rule that decides direct-MCP (read-only) vs
  Manager-mediated (write/money/customer-facing), enforced at provision/render time and in the primer's
  "what you can do" framing.
- **Operator-mode + business-type context policy:** express the CE-1 primer emphasis, CE-2 compression
  defaults, and CE-3 rotation thresholds as policy keyed by business type (contractor vs bookkeeper vs …)
  and operator mode ("solo owner" vs "owner + secretary" — which interacts with the deferred roles /
  delegated-permissions design; do not build roles here, only leave the seam).
- **Optional:** external memory provider (Mem0/Supermemory-class) for richer cross-session modeling; a
  full background-work orchestration (delegation/Jobs) if CE-2's seam proves insufficient.

## Files / seams

- `apps/manager/src/lib/capability-registry.ts` (generalize routing), `lib/employee-stream.ts`
  (`deriveConnectionSurfaces` already generic), `lib/agent-context.ts` (policy-driven emphasis),
  `profile-renderer.ts` (per-connector custody + `mcp_servers` rendering for read-only connectors),
  `packages/shared/src` (connector metadata + operator-mode/business-type policy types).

## Acceptance gates

- A read-only MCP connector appears in the capability graph and Connected surface with no per-tool code.
- A write/money/customer-facing connector is refused a direct-MCP path and routed through Manager mediation.
- Primer and rotation vary correctly by a fixture business-type + operator-mode policy seam; roles are not
  built here.

## Note

This phase is intentionally light. The source-wired implementation adds the metadata/custody seams without
claiming a live direct-MCP connector proof.

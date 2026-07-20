# 17 — Hermes Upstream Review Protocol

Status: active contributor and runtime-integration protocol  
Upstream: `NousResearch/hermes-agent`  
Production baseline: `nousresearch/hermes-agent:v2026.7.1` plus the release-recorded immutable OCI digest

## Boundary

Hermes is AMTECH's managed employee reasoning/runtime substrate. Manager remains the authority, connector-custody, durable-effect, commercial-attribution, repair, and proof plane.

**Hermes upstream is intelligence, not authority.** AMTECH does not auto-track upstream `main`, auto-merge upstream changes, or replace exact-image release acceptance with repository freshness.

## Required upstream review

Run before changing any of these boundaries:

- Hermes image or launcher;
- profiles, plugins, skills, memory, sessions, or workspaces;
- Manager↔Hermes gateway/client contracts;
- runtime-native and MCP tool discovery;
- run/session lifecycle, delegation, recovery, or checkpoint behavior;
- Hermes-derived Web or operator behavior.

```bash
cd mvp-build
npm run hermes:upstream:check
```

The check records:

- current official `main` SHA;
- watched source SHAs under `hermes_cli/` and `web/src/App.tsx`;
- the 20 most recently updated active pull requests;
- drift from `validation/hermes-upstream-baseline.json`;
- the production runtime pin, which is not changed by the check.

Runtime-related PRs and pushes run the check with enforcement. Scheduled runs capture drift and PR themes as an artifact for review.

## Review method

1. Inspect the current official head and watched paths.
2. Review recent merged commits for runtime, tool, session, recovery, security, and UI contract changes.
3. Explore active pull requests for unique failure modes and design insights, not only changes likely to merge.
4. Classify each relevant insight as `adopt`, `adapt`, `reject`, or `defer`.
5. Add a failing AMTECH compatibility contract before adopting behavior.
6. Update the baseline only after review, focused tests, and an explicit rationale.
7. Upgrade the production image only through the exact-image, filesystem, profile, network, capability, recovery, and release-evidence gates.

## Current reviewed themes

The July 20, 2026 review found several useful upstream themes:

- API-requested toolsets should be intersected with server configuration; an empty list must remain authoritative deny-all.
- Recovery operations must clear all stale claim metadata atomically.
- Background delegates need session ownership that survives transient UI/session switches without cross-session routing.
- UI tests should wait for the actual post-setup state rather than an earlier asynchronously rendered marker.
- Cloned profile credentials can drift after rotation and need health/repair diagnostics.
- Large live UI trees benefit from targeted invalidation and bounded rendering rather than whole-tree work.

These are research inputs. They do not establish that AMTECH has implemented or accepted the corresponding behavior.

## Baseline update record

A baseline update records:

- reviewer or agent task ID;
- previous and current upstream SHA;
- watched-path changes;
- relevant merged commits and active pull requests;
- adopted/rejected/deferred conclusions;
- AMTECH tests added or rerun;
- whether the production image pin changed;
- exact AMTECH commit and CI evidence.

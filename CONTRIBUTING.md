# Contributing to AMTECH AI Employee

Status: active contributor and coding-agent entrypoint  
Repository: `benamtech/ai-employee-v1`

AMTECH builds governed persistent AI labor. Contributions preserve the labor, authority, effect, proof, recovery, streaming, and connector contracts in `mvp-build/STANDARD.md`.

## Fifteen-minute start

```bash
git fetch origin
git switch -c task/<task-id> origin/main
cd mvp-build
npm ci
npm run hooks:install
npm run repo:verify:quick
```

Read progressively: root/scoped agent rules and CODEGRAPH, ratified Standard, single active program, newest indexed handoff, then only relevant source, migrations, tests, workflows, and proof.

Current production work starts from current `main`. PR `#31` contains the hardened WS-02 source/CI boundary and guarded WS-03 preparation.

## Required task contract

Before editing, validate a JSON task contract:

```bash
npm run repo:rubric -- ./task-contract.json
```

It declares task ID, repository, branch, objective, success criteria, allowed/forbidden files, tests, blockers, maximum commits, and rubric scores.

## Six-point rubric

Each dimension is in `[-1,1]`; scores below `0.5` require mitigation:

- authority — identity, assignment, policy, approval, effect, and custody;
- completeness — full claimed behavior and failure boundary;
- agility — understandable, replaceable, changeable;
- isolation — account, assignment, employee, credential, runtime, and network separation;
- provability — deterministic tests and exact evidence;
- moat — reusable labor/connector protocols rather than provider-specific seams.

## TDD execution contract

```text
specify one behavior
→ write or identify the failing contract
→ implement the smallest coherent change
→ rerun the focused test
→ refactor without weakening the invariant
→ run applicable external verification
→ commit with the task ID
→ verify the exact pushed SHA
```

Pure policy/state/parsing logic is not mocked. Live proof validates release boundaries; it does not replace regression tests.

## Verification tiers

```bash
npm run repo:verify:quick
npm run repo:verify:full
npm run test:unit
npm run test:integration
npm run build
```

`Main Integration Gates` is the canonical merge gate. Broad, curated, build, archaeology, browser, database, provider, and live evidence are independently reported.

`test:repo-governance` validates durable structure and cross-file invariants. It must not pin transient workflow run IDs, test counts, implementation SHAs, or status prose. Current evidence values belong in the active program's machine-readable resolution ledger.

## Non-bypassable invariants

- Manager owns assignment authority, connector/token custody, approval, effects, commercial attribution, repair, and proof.
- Hermes may reason and discover broadly but cannot choose assignment, payer, policy, authority version, provider, endpoint, scope, token, or credentials.
- Harmless text/activity streams immediately; consequential execution re-enters Manager.
- `tools/list` is discovery. `tools/call` is authorized again using current effective capability evidence.
- Remote MCP authorization servers derive from protected-resource metadata; exact resource, redirect, scopes, PKCE, and state are bound.
- MCP Apps use negotiated `ui://` resources, opaque-origin sandboxing, content hashes, bounded host methods, and current WorkAction intersection.
- AG-UI state/events are ordered projection, never durable authority.
- Unknown or stale connector evidence fails closed. Ambiguous provider outcomes reconcile before retry.
- Applied migrations are immutable; corrections are forward migrations.

## Hermes upstream review

Production remains pinned. Before changing Hermes integration or derived UI, run `npm run hermes:upstream:check`. Upstream is intelligence, not authority.

## Pull requests

Use `.github/pull_request_template.md`. Distinguish `source-wired`, `ci-accepted`, `runtime-accepted`, `provider-accepted`, `browser/channel-accepted`, `live-accepted`, and `production-ready`.

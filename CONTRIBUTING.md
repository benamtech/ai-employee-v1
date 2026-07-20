# Contributing to AMTECH AI Employee

Status: active contributor and coding-agent entrypoint  
Repository: `benamtech/ai-employee-v1`

AMTECH builds governed persistent AI labor for owner-operated businesses. Contributions must preserve the ratified labor, authority, effect, proof, and recovery contracts in `mvp-build/STANDARD.md`.

## Fifteen-minute start

```bash
git fetch origin
git switch -c task/<task-id> origin/main
cd mvp-build
npm ci
npm run hooks:install
npm run repo:verify:quick
```

Then read progressively, stopping when the task is clear:

1. root `AGENTS.md` or `CLAUDE.md`, `CONTRIBUTING.md`, and `CODEGRAPH.md`;
2. scoped `mvp-build/AGENTS.md` or `CLAUDE.md` and `CODEGRAPH.md`;
3. `mvp-build/STANDARD.md`;
4. `mvp-build/second-half-plan/README.md` and its single active program;
5. the newest relevant entry in `mvp-build/memory/MEMORY.md`;
6. only the source, migration, test, workflow, runbook, or proof files needed for the task.

PR `#29` merged the post-cutover roadmap into `main`. New production work starts on reviewed task branches from current `main`; the cutover and `research` branches are historical context.

Do not concatenate historical plans or handoffs into working context. Current source, applied migrations, exact-SHA evidence, the ratified Standard, and the active program outrank older prose.

## Required task contract

Before editing, create a small JSON task contract and validate it:

```bash
npm run repo:rubric -- ./task-contract.json
```

The contract declares task ID, repository, branch, objective, success criteria, allowed and forbidden files, required tests, known blockers, maximum commits, six rubric scores, and mitigations.

### Six-point rubric

Rubric dimensions are each in `[-1, 1]`:

- `authority` — preserves identity, assignment, policy, approval, effect, and custody boundaries;
- `completeness` — covers the full behavior and failure boundary claimed;
- `agility` — remains understandable, replaceable, and easy to change;
- `isolation` — preserves account, assignment, employee, credential, runtime, and network separation;
- `provability` — produces deterministic tests and exact evidence;
- `moat` — strengthens reusable AMTECH labor and connector protocols rather than one-off provider seams.

Any score below `0.5` requires an explicit mitigation naming that dimension.

## TDD execution contract

```text
specify one behavior
→ write or identify the failing contract
→ implement the smallest coherent change
→ rerun the focused test
→ refactor without weakening the invariant
→ run the applicable external verification
→ commit with the task ID
→ verify the exact pushed SHA
```

External providers, databases, Docker, and hosts may be mocked or dry-run when access is absent. Pure policy, state, parsing, and deterministic logic are not mocked. Live proof validates a release boundary; it does not replace regression tests.

New or materially changed pure/business logic should maintain at least 80% focused coverage where the package has coverage instrumentation. Do not invent a misleading repository-wide percentage before a stable baseline exists.

## Verification tiers

```bash
npm run repo:verify:quick   # Standard, plan, connector, onboarding, and governance contracts
npm run repo:verify:full    # quick gate + dependency-ordered typecheck + lint
npm run test:unit           # complete broad unit/source regression; builds shared/db first
npm run test:integration    # PostgreSQL/environment-gated behavior when applicable
npm run build               # production build boundary
```

`Main Integration Gates` is the canonical merge-readiness gate for pull requests into `main`. It independently runs repository/source contracts, the broad unit aggregate, production build, archaeology, and compiled Chromium fixture regression, then fails the summary when any component is not successful.

WS-01 normalized the broad aggregate on implementation head `1460960`: **106 files and 613 tests passed**, with no excluded or quarantined files. Obsolete pre-assignment/account-owned/direct-provider suites were deleted only where current replacement contracts covered the surviving invariant. Broad and curated results remain separate evidence lines.

The installed pre-commit hook runs the quick gate. The pre-push hook runs the full gate. CI remains authoritative because hooks can be skipped locally.

## Non-bypassable invariants

- Manager owns assignment authority, connector and credential custody, approval, durable effects, commercial attribution, repair, and proof.
- Hermes owns employee reasoning/runtime behavior but cannot choose account, assignment, payer, policy, approval, provider identity, endpoint, upstream model, or provider credentials.
- Runtime model requests use only the stable AMTECH model alias; Manager resolves registered provider routing.
- Caller-supplied provider, profile, endpoint, headers, tokens, or credentials fail before dispatch.
- Unknown or stale connector/capability evidence fails closed.
- Broad categories never select a provider, scope, tool, credential mode, account row, or authorization host.
- Consequential success requires a matching durable accepted receipt; ambiguous provider outcomes reconcile before retry.
- Browser, MCP Apps, AG-UI, Web, SMS, and signed Review are role-safe projections, not authority planes.
- Applied migrations are immutable; corrections are forward migrations.
- Tests are contracts. Do not weaken expectations merely to obtain green.

## Hermes upstream review

Production remains pinned to an approved Hermes image and immutable digest. Upstream `main` is research input, not an automatic dependency upgrade.

Before changing Hermes integration, profiles, runtime launch, tool discovery, sessions, gateway behavior, or Hermes-derived UI:

```bash
npm run hermes:upstream:check
```

Review the official repository, `hermes_cli/`, `web/src/App.tsx`, recent merged commits, and active pull requests. Record adopted, rejected, and deferred insights in the task or PR. Update `validation/hermes-upstream-baseline.json` only after source review and focused AMTECH compatibility tests.

Do not run upstream research merely because a session started. Use the scheduled/path-triggered system unless repository policy, watched-path drift, a baseline mismatch, or the workstream makes the Hermes boundary material.

## Pull requests

Use `.github/pull_request_template.md`. A PR must include the task contract, rubric, Standard clauses, verification, evidence state, and any material Hermes upstream review. `source-wired`, `ci-accepted`, `runtime-accepted`, `provider-accepted`, and `production-ready` are distinct claims.

`Main Integration Gates` is the canonical required check for pull requests into `main`; subsystem workflows remain diagnostic and release-evidence companions. New production work integrates from reviewed branches based on current `main`.

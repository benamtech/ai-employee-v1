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

1. root `AGENTS.md` or `CLAUDE.md` and `CODEGRAPH.md`;
2. scoped `mvp-build/AGENTS.md` or `CLAUDE.md` and `CODEGRAPH.md`;
3. `mvp-build/STANDARD.md`;
4. `mvp-build/second-half-plan/README.md` and its single active program;
5. the newest relevant entry in `mvp-build/memory/MEMORY.md`;
6. only the source, migration, test, workflow, runbook, or proof files needed for the task.

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
npm run test:unit           # broad historical aggregate; run for touched areas and normalization work
npm run test:integration    # PostgreSQL/environment-gated behavior when applicable
npm run build               # production build boundary
```

`Main Integration Gates` executes the named ratified authority, onboarding, production-boundary, UI-contract, build, archaeology, and compiled-browser suites. The broader historical `test:unit` aggregate currently contains stale pre-ratification fixtures and remains explicit P0 normalization work; no green curated suite may be reported as proof that this aggregate is green.

The installed pre-commit hook runs the quick gate. The pre-push hook runs the full gate. CI remains authoritative because hooks can be skipped locally.

## Non-bypassable invariants

- Manager owns assignment authority, connector and credential custody, approval, durable effects, commercial attribution, repair, and proof.
- Hermes owns employee reasoning/runtime behavior but cannot choose account, assignment, payer, policy, approval, or provider credentials.
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

## Pull requests

Use `.github/pull_request_template.md`. A PR must include the task contract, rubric, Standard clauses, verification, evidence state, and any Hermes upstream review. `source-wired`, `ci-accepted`, `runtime-accepted`, `provider-accepted`, and `production-ready` are distinct claims.

`Main Integration Gates` is the canonical required check for pull requests into `main`; subsystem workflows remain diagnostic and release-evidence companions.

PR #23 is the integration/cutover PR from `employee-production-tuesday` to `main`. New production work continues on reviewed branches from the post-cutover `main`; the historical `research` branch is not an authority layer.

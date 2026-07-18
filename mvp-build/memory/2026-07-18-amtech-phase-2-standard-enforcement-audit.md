# 2026-07-18 — AMTECH Phase 2 Standard Enforcement Audit

## Branch and audited source

- Repository: `benamtech/ai-employee-v1`
- Branch: `employee-work`
- Base: `research`
- Audited implementation head: `d963efcaff9285cdf8ebc6c069213a2cda7d110d`
- Standard: `mvp-build/STANDARD.md`, AMTECH STANDARD v0.1 Draft 2, blob `21a4d3c0e155e91592b60747252ede48efe6f97a`
- Human approval: explicitly supplied by the operator on 2026-07-18 before enforcement began.
- `main` was not edited. `STANDARD.md` was not edited. No remediation code was implemented.

## Files changed

- Added `mvp-build/GAPS.md`.
- Added `mvp-build/REMEDIATION.md`.
- Added this handoff.
- Updated `mvp-build/memory/MEMORY.md` newest-first after this handoff.

Audit document commits before this handoff:

- `b687305fe13fd7319896eebcddeaf3d7d4f00d5e` — `GAPS.md`
- `e80eb8309594ae072cf633f7c54d4e4eb60b7e8b` — `REMEDIATION.md`

## Status

**Phase 2 enforcement completed as an evidence-only document audit. Implementation is non-conforming and launch-blocked under the approved standard.**

Finding totals:

- P0: 4
- P1: 13
- P2: 6
- P3: 4
- P4: 2
- Total: 29

The architecture-level diagnosis is a singleton account/employee ontology. Assignment, access, authority, memory scope, connector custody, payer, beneficiary, employer/manager, and billing attribution are not separate durable relationships. Account membership is used as broad employee/resource authorization. Approval is not principal/assignment/policy-bound and its terminal paths are replay-raceable. The production boundary remains source-wired and narrowly CI-accepted, not production-, provider-, runtime-, commercial-, or live-accepted.

## Validation performed

- Resolved PR `#19`, base `research`, and exact source head `d963efcaff9285cdf8ebc6c069213a2cda7d110d` before audit writes.
- Read `identity.md`, scoped `CLAUDE.md`, `AGENTS.md`, scoped and root `CODEGRAPH.md`, the full standard, six newest memory summaries, and the two newest relevant full handoffs.
- Inventoried active implementation by branch/base comparison, the 55-file PR delta, workspace manifests, import/registration graphs, migration ledger, workflow, proof manifest, and scoped codegraph. Explicit exclusions were recorded.
- Traced identity, owner sessions, Manager HTTP and MCP transports, approvals, signed links, turn queue, web/SMS ingress, provider adapters, ambient inbox/effect receipts, model gateway, provisioning reconciler, admin/support, entitlement/metering, web surfaces, deployment workflow, and proof manifest.
- Inspected current GitHub Actions run `29632149822`. Its single `boundary` job completed successfully for shared/database/Manager builds, CI PostgreSQL migrations and worker checks, focused production-boundary tests, acceptance-script syntax, and Manager image inclusion. Artifacts were present for migration verification, Manager typecheck, and focused tests.
- Created REVP-8 theory, implementation, validation, deployment, and market vectors for every P0/P1 finding.

## Validation not performed

- No local clone/build/test rerun because the execution environment could not resolve GitHub and had no `gh` binary.
- No destructive production or provider tests.
- No live Supabase migration application.
- No deployed browser, SMS, Gmail, Stripe, QuickBooks, model-provider, Caddy, Docker-host, DNS, backup/restore, or VPS execution.
- No customer data or secrets were read.
- CI PostgreSQL was not treated as live Supabase acceptance.
- Fixtures, dev login, manually injected events, historical proof, and the public estimator were not treated as canonical launch proof.

## Primary launch blockers

1. No canonical organization/account/user/employee/assignment/access/authority/custody/payer/beneficiary graph.
2. Account membership grants unrelated employee/resource visibility and SMS authority.
3. Approval resolution is not bound to an authorized current human principal, assignment, role, policy, and immutable action snapshot.
4. Approval and signed-link terminal paths are not atomically claimed before effect.
5. Global internal Manager bearer permits caller-selected account/employee context and can label approval resolution as owner.
6. Owner sessions do not recheck current membership, role, assignment, principal status, or revocation.
7. Account/phone/claim creation is a non-transactional cross-system saga with check-then-write races.
8. Model-gateway rate limits and spend controls are not durable; usage audit is best-effort; provider retries lack complete idempotency semantics.
9. Context primer explicitly fails open.
10. Web turn ingress generates a fresh idempotency key per request.
11. Provider/connector bindings are account/employee scoped rather than assignment/resource-custody scoped.
12. Production Supabase remains at migration `0031` while source requires `0032`–`0038`.
13. Required live relationship, provider, runtime, browser, recovery, and commercial proof is absent.
14. Current CI is a narrow backend boundary, not a product-wide release gate; ESLint ignores TypeScript.
15. Consequential protocol versioning is incomplete.
16. Platform admin identity is a caller-selected header behind a shared internal bearer.
17. Payer, beneficiary, provider cost, labor outcome, entitlement, and invoice attribution are absent or conflated.

## Scope decision

Do not pivot to the public estimator, a model wrapper, or a conventional account-scoped assistant. The first conforming launch should instead be reduced to one organization/account, multiple users, multiple employees, explicit assignments, web and SMS, one provider-backed work-object slice, principal-bound approvals, durable model/provider accounting, and manual commercial invoicing until labor-native billing passes.

Cross-organization sharing, marketplace access, voice, and cross-employee delegation should remain disabled for the initial tier. This reduction does not waive any P0/P1 boundary.

## Unresolved risks

- The standard approval is explicit in operator instruction, but `STANDARD.md` section 13 and the previous memory entry still say unapproved. The standard was not changed because enforcement prohibited altering it. Record this in a controlled future standard revision.
- Production schema drift remains active until real Supabase migrations and verifiers run.
- No audit finding has been remediated; only documents were created.
- Audit completeness is source/accountability completeness, not live behavioral completeness. Missing deployed proof remains unknown or failed as stated, never pass.

## Next concrete move

Human reviews `GAPS.md` and `REMEDIATION.md`. After approval of the remediation sequence, begin with failing relationship-matrix and approval-concurrency tests, then add the canonical assignment/labor relationship schema as an additive migration. Do not begin gateway, UI, connector, or billing patches before the assignment execution context is defined.

# Verification and Handoff Matrix

Status: **active evidence checklist; post-cutover coordinates reconciled**  
Current integration baseline: `main@5e5b8d7c7a5e20490d58855ffb4450b13b53cd03`  
Final cutover evidence head: `d131dd09e216fc9dcf0444afd1eb1494194f52eb`  
Task families: `AMTECH-P0-GOV-001`, `AMTECH-P0-DOC-002`, `AMTECH-P0-ONB-001`, `AMTECH-P0-PLAN-003`

## Gate matrix

| Gate | Required verification | Accepted evidence | Current state |
|---|---|---|---|
| Ratified Standard, plan, and governance | `npm run repo:verify:quick` / ratification workflow | `29717830698` on `d131dd09` | accepted for final cutover source/document scope |
| Ordered typecheck/lint/source hygiene | `npm run repo:verify:full` | Main Integration Gates `29717830737` on `d131dd09` | accepted for final cutover source scope |
| Current authority/source contracts | named onboarding, assignment, release, production, and UI suites | Main Integration Gates `29717830737` | accepted for named suites only |
| Production build | workspace build | Main Integration Gates `29717830737` | accepted for compilability only |
| Repository archaeology | exact-head archaeology artifacts | Main Integration Gates `29717830737` | accepted on final cutover head |
| Compiled browser regression | production-compiled Chromium fixture matrices | Main Integration Gates `29717830737` | accepted as fixture regression, not fixture-free acceptance |
| Hermes upstream intelligence | scheduled/path-aware pinned-baseline review | `29717830703` on `d131dd09` | accepted for cutover review; production pin unchanged |
| Broad unit regression | `npm run test:unit` | PR `#23` failure report | **failed/open:** 30 files and 112 tests on final cutover head; Phase 1.1 normalization |
| Database platform release | full PostgreSQL matrix plus triggered disposable Supabase proof | migration/advisor/behavior packet | open |
| Target-host runtime | five-service and two-employee isolation/lifecycle harness | exact host/image/network packet | open |
| Connector/protocol | remote MCP, MCP Apps, effective capability, authorization/health/revocation | protocol/provider/browser packet | open |
| Fixture-free owner/channels | real identity/assignment, Web/SMS/Review parity and failure matrix | exact session/work/proof IDs | open |
| Golden work | provider-backed approval/effect/receipt/parity/refinding/replay | provider/effect/accounting/proof IDs | open |
| Commercial controls | budget reservation, shared rate, ambiguity, payer/beneficiary/invoice reconciliation | concurrency/provider/billing packet | open |
| Recovery/rollback | crash injection, repair, backup/restore, exact rollback | recovery packet | open |
| Human surface | supported browsers, WCAG 2.2 AA, visual and recovery UX | exact candidate reports | open |
| Capacity/pilot | declared 1/10/100/250/500/700 envelopes and pilot packet | load, cost, fairness, incident evidence | open |
| Signed release/deployment | SBOM, in-toto/SLSA provenance, digests, migration/config hashes, verifier | signed exact-candidate manifest | open |

## Final cutover evidence

PR `#23` merged on 2026-07-20. The final reviewed branch head `d131dd09e216fc9dcf0444afd1eb1494194f52eb` passed:

- Ratified Standard and Production Plan Integrity — `29717830698` — success;
- Hermes Upstream Review — `29717830703` — success;
- Main Integration Gates — `29717830737` — success.

Merge commit `5e5b8d7` is the current `main` coordinate. It does not manufacture a broader test or live acceptance state. Evidence remains bound to the candidate and boundary actually exercised.

## Test evidence rules

The canonical classification is [`10-test-suite-disposition.md`](10-test-suite-disposition.md).

- A curated green suite is proof only for its named contracts.
- The broad `test:unit` failure remains visible until Phase 1.1 closes it.
- Fixture browser proof is not fixture-free provider/channel proof.
- Local PostgreSQL proof is not managed-platform proof when a Standard trigger applies.
- Environment-gated checks state `skipped` or `blocked`; neither becomes pass.
- Intentional duplicate tests across workflows do not create additive unique pass counts.
- A metadata commit after an evidence run does not inherit exact-head acceptance.

## Required source/planning command set

From `mvp-build/`:

```bash
npm ci
npm run repo:rubric -- second-half-plan/2026-07-19-ratified-standard-production-program/11-task-contract.json
npm run repo:verify:quick
npm run repo:verify:full
npm run test:lane10-evidence
npm run build
```

Phase 1.1 additionally requires `npm run test:unit` to become trustworthy and green before downstream completion claims.

## Release-candidate command/evidence families

The exact candidate additionally runs all applicable:

```text
test:integration and migration matrices
prod:boundary:migrations
prod:boundary:isolation
prod:boundary:capabilities
prod:boundary:onboarding
prod:boundary:work-object
prod:boundary:gateway
prod:boundary:rotation
prod:boundary:recovery
prod:boundary:ambient
acceptance:golden:website
acceptance:golden:contractor
acceptance:golden:bookkeeping
deploy:smoke
deploy:rollback
backup/restore
supported-browser/accessibility/visual matrices
capacity and pilot evidence
signed release-manifest verification
```

Missing credentials, database, host, provider, signing service, browser, or pilot environment are explicit blockers.

## Handoff content

A dated handoff records:

1. repository, branch/base/PR, date, and exact candidate SHA;
2. primary role and interacting subsystems;
3. issue/workstream IDs and Standard clauses;
4. exact files/migrations/systems changed;
5. behavior before and after;
6. tests, workflows, artifacts, proof IDs, failures, skips, and blockers;
7. test-suite disposition changes;
8. failed attempts and diagnostics;
9. unresolved P0/P1/P2 risks and dependency order;
10. Hermes review decision and materiality;
11. roadmap/CODEGRAPH/architecture/memory/PR synchronization;
12. evidence state using Standard vocabulary.

## Completion rules

- Gate 0 remains resolved only for ratification, contributor enforcement, source/document contracts, and the final cutover CI scope.
- Phase 1.1 is the next non-waivable dependency: post-merge truth and broad regression normalization.
- No downstream phase is complete while its prerequisite gate is red or bound to another candidate.
- Production-ready requires every non-waivable gate on one exact signed deployed release.

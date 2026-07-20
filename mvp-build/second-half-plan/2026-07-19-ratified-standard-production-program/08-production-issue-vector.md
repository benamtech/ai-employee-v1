# Production Issue Vector

Status: **active machine-backed issue register**  
Baseline: `main@5e5b8d7c7a5e20490d58855ffb4450b13b53cd03`  
Cutover evidence head: `d131dd09e216fc9dcf0444afd1eb1494194f52eb`  
Machine source: [`08-production-issue-vector.json`](08-production-issue-vector.json)

## Interpretation

Each issue is scored across:

- priority class;
- production-blocking severity;
- evidence confidence;
- user impact;
- authority/safety risk;
- dependency centrality;
- blast radius;
- reversibility risk;
- maintainability drag;
- production-readiness gap;
- affected boundaries and evidence coordinates.

Scores are not an averaging mechanism. A failed hard gate remains blocking even when another dimension is low. The JSON file is canonical for exact values; this document is the human routing view.

## Post-merge evidence correction

PR `#23` merged into `main` on 2026-07-20 at merge SHA `5e5b8d7`. Its final reviewed head was `d131dd09`, where the Ratified Standard workflow, Hermes upstream review, and Main Integration Gates passed. Current authority documents on `main` still described the branch as an active draft cutover and several matrices still cited ancestor Gate 0 head `4be092f`. That contradiction is `ISS-001`/`ISS-002` and is the first plan transaction.

The merge did **not** make the product production-ready. PR `#23` explicitly retained the broad `npm run test:unit` failure: 30 files and 112 tests were failing from pre-ratification assignment, principal, fake-RPC, and environment fixtures. The curated green main gate does not prove that aggregate passes.

## Issue register

| ID | WS | Pri | Block | Conf | Central | Title |
|---|---|---:|---:|---:|---:|---|
| ISS-001 | WS-01 | P0 | .95 | 1.00 | 1.00 | Merged PR still described as active draft cutover |
| ISS-002 | WS-01 | P0 | .91 | 1.00 | .98 | Evidence matrices bind ancestor rather than final cutover/main coordinates |
| ISS-003 | WS-01 | P0 | .96 | .99 | 1.00 | Broad unit aggregate remains red |
| ISS-004 | WS-01 | P0 | .90 | .99 | .97 | Curated green gate cannot be reported as broad-suite proof |
| ISS-005 | WS-01 | P1 | .62 | .94 | .82 | No canonical test-suite disposition map |
| ISS-006 | WS-01 | P1 | .57 | 1.00 | .75 | Architecture register contains stale migration/current-state metadata |
| ISS-007 | WS-02 | P0 | .94 | .96 | .93 | Remote protected MCP authorization absent |
| ISS-008 | WS-02 | P0 | .92 | .97 | .89 | Official MCP Apps host contract absent |
| ISS-009 | WS-02 | P1 | .68 | .94 | .66 | Versioned AG-UI projection/replay adapter absent |
| ISS-010 | WS-02 | P0 | .86 | .92 | .92 | Effective capability graph not persisted/reconciled |
| ISS-011 | WS-02 | P0 | .90 | .98 | .90 | Live connector health/revocation/failure proof absent |
| ISS-012 | WS-03 | P0 | .98 | .99 | .99 | Approved database not release-proven through migration 0072 |
| ISS-013 | WS-03 | P0 | .95 | .98 | .96 | RLS/grant/backfill/concurrency/rollback matrices incomplete |
| ISS-014 | WS-03 | P0 | .82 | .97 | .79 | Managed Supabase trigger proof absent |
| ISS-015 | WS-04 | P0 | .96 | .98 | .95 | Managed secret custody/rotation proof absent |
| ISS-016 | WS-04 | P0 | .97 | .99 | .96 | Five-service/two-employee target-host proof absent |
| ISS-017 | WS-04 | P0 | .89 | .96 | .88 | Runtime lifecycle and neighbor-safe repair proof incomplete |
| ISS-018 | WS-04 | P1 | .71 | .99 | .79 | Resolved Hermes digest not bound to release evidence |
| ISS-019 | WS-05 | P0 | .96 | .99 | .93 | Fixture-free canonical owner activation absent |
| ISS-020 | WS-05 | P0 | .90 | .97 | .84 | Web/SMS/signed-Review parity absent |
| ISS-021 | WS-05 | P1 | .64 | .93 | .63 | Connector setup/repair UX grammar inconsistent |
| ISS-022 | WS-06 | P0 | .95 | .99 | .91 | Provider-backed work-object journey absent |
| ISS-023 | WS-06 | P1 | .66 | .92 | .73 | Approved-preview/delivered-output parity unproven |
| ISS-024 | WS-06 | P1 | .58 | .90 | .64 | Proof refinding is immature |
| ISS-025 | WS-07 | P0 | .99 | 1.00 | .98 | Cumulative Model Gateway spend unenforced |
| ISS-026 | WS-07 | P0 | .97 | 1.00 | .96 | Model Gateway rate limit is process-local |
| ISS-027 | WS-07 | P0 | .99 | 1.00 | .97 | Provider transport errors blindly retry instead of becoming ambiguous |
| ISS-028 | WS-07 | P0 | .88 | .96 | .89 | Commercial and invoice reconciliation not accepted |
| ISS-029 | WS-08 | P0 | .94 | .97 | .91 | Crash compensation and deterministic repair incomplete |
| ISS-030 | WS-08 | P0 | .95 | .99 | .92 | Rollback unproven across release boundaries |
| ISS-031 | WS-08 | P0 | .92 | .98 | .91 | Signed deployment manifest/SBOM/provenance absent |
| ISS-032 | WS-08 | P1 | .62 | .88 | .74 | End-to-end observability/incident lineage incomplete |
| ISS-033 | WS-09 | P1 | .60 | .94 | .55 | Cross-surface UI alignment incomplete |
| ISS-034 | WS-09 | P1 | .72 | .97 | .72 | Accessibility and supported-browser acceptance incomplete |
| ISS-035 | WS-09 | P1 | .59 | .90 | .61 | Durable progress/interruption semantics unproven |
| ISS-036 | WS-09 | P2 | .42 | .92 | .61 | Fleet admission/fairness/noisy-neighbor controls unproven |
| ISS-037 | WS-09 | P1 | .67 | .96 | .69 | Controlled-pilot entry/exit and incident criteria not operationalized |
| ISS-038 | WS-09 | P2 | .25 | .86 | .36 | Shared/fractional, governed egress, and richer operator capabilities deferred |

## Highest-leverage conclusions

1. **Repository truth is the first dependency.** Later implementation cannot be declared complete while the current plan route is stale and the broad regression suite is known red.
2. **The largest executable commercial defects are concentrated in Model Gateway.** `apps/manager/src/lib/model-gateway.ts` stores rate buckets in a process-local `Map` and only checks whether `spend_limit_cents` is positive. `model-gateway-http.ts` retries timeout/transport exceptions without a provider idempotency contract and records terminal exhaustion as failed rather than ambiguous.
3. **The architecture is source-rich but acceptance-poor.** Database, target host, provider, channel, commercial, recovery, browser, and deployment states remain open by the Standard's evidence vocabulary.
4. **Protocol adapters must not jump the authority queue.** Remote MCP authorization, MCP Apps, and AG-UI work is blocked from production acceptance until assignment, custody, capability freshness, and effect boundaries remain fail-closed.
5. **Pilot readiness is a release program, not a marketing toggle.** Start Free or $400 Managed pilots require an exact candidate, bounded entitlements, operator runbooks, recovery/rollback, customer exit, and retained proof.

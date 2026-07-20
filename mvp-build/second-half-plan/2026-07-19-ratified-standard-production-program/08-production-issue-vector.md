# Production Issue Vector

Status: **immutable scored baseline; current state in resolution ledger**  
Baseline: `main@5e5b8d7c7a5e20490d58855ffb4450b13b53cd03`  
Machine baseline: [`08-production-issue-vector.json`](08-production-issue-vector.json)  
Current resolutions: [`13-resolution-ledger.json`](13-resolution-ledger.json)

## Interpretation

The baseline vector scores each issue across priority, production blocking, evidence confidence, user impact, authority/safety risk, dependency centrality, blast radius, reversibility, maintainability drag, and production-readiness gap.

Scores are not an averaging mechanism. The JSON remains immutable evidence of the post-cutover diagnosis. Current closure state is appended in the resolution ledger rather than rewriting historical scores.

## Current resolution summary

On implementation evidence head `1460960f415fafc20582313b1dd2117b781a63f7`:

- `ISS-001` through `ISS-006` are `source_ci_resolved`;
- broad unit passes 106 files / 613 tests under the canonical Main Integration gate;
- the Manager-only provider-authority control is `source_ci_accepted`;
- that control does **not** resolve `ISS-007` through `ISS-011` because remote MCP, MCP Apps, AG-UI, persisted effective capabilities, and live connector lifecycle remain open;
- `ISS-012` through `ISS-038` remain open;
- `production_ready` remains false.

## Baseline issue register

| ID | WS | Pri | Block | Conf | Central | Baseline title | Current state |
|---|---|---:|---:|---:|---:|---|---|
| ISS-001 | WS-01 | P0 | .95 | 1.00 | 1.00 | Merged PR still described as active draft cutover | source/CI resolved |
| ISS-002 | WS-01 | P0 | .91 | 1.00 | .98 | Evidence matrices bind ancestor rather than final cutover/main coordinates | source/CI resolved |
| ISS-003 | WS-01 | P0 | .96 | .99 | 1.00 | Broad unit aggregate remains red | source/CI resolved |
| ISS-004 | WS-01 | P0 | .90 | .99 | .97 | Curated green gate cannot be reported as broad-suite proof | source/CI resolved |
| ISS-005 | WS-01 | P1 | .62 | .94 | .82 | No canonical test-suite disposition map | source/CI resolved |
| ISS-006 | WS-01 | P1 | .57 | 1.00 | .75 | Architecture register contains stale migration/current-state metadata | source/CI resolved |
| ISS-007 | WS-02 | P0 | .94 | .96 | .93 | Remote protected MCP authorization absent | open |
| ISS-008 | WS-02 | P0 | .92 | .97 | .89 | Official MCP Apps host contract absent | open |
| ISS-009 | WS-02 | P1 | .68 | .94 | .66 | Versioned AG-UI projection/replay adapter absent | open |
| ISS-010 | WS-02 | P0 | .86 | .92 | .92 | Effective capability graph not persisted/reconciled | open |
| ISS-011 | WS-02 | P0 | .90 | .98 | .90 | Live connector health/revocation/failure proof absent | open |
| ISS-012 | WS-03 | P0 | .98 | .99 | .99 | Approved database not release-proven through migration 0072 | open |
| ISS-013 | WS-03 | P0 | .95 | .98 | .96 | RLS/grant/backfill/concurrency/rollback matrices incomplete | open |
| ISS-014 | WS-03 | P0 | .82 | .97 | .79 | Managed Supabase trigger proof absent | open |
| ISS-015 | WS-04 | P0 | .96 | .98 | .95 | Managed secret custody/rotation proof absent | open |
| ISS-016 | WS-04 | P0 | .97 | .99 | .96 | Five-service/two-employee target-host proof absent | open |
| ISS-017 | WS-04 | P0 | .89 | .96 | .88 | Runtime lifecycle and neighbor-safe repair proof incomplete | open |
| ISS-018 | WS-04 | P1 | .71 | .99 | .79 | Resolved Hermes digest not bound to release evidence | open |
| ISS-019 | WS-05 | P0 | .96 | .99 | .93 | Fixture-free canonical owner activation absent | open |
| ISS-020 | WS-05 | P0 | .90 | .97 | .84 | Web/SMS/signed-Review parity absent | open |
| ISS-021 | WS-05 | P1 | .64 | .93 | .63 | Connector setup/repair UX grammar inconsistent | open |
| ISS-022 | WS-06 | P0 | .95 | .99 | .91 | Provider-backed work-object journey absent | open |
| ISS-023 | WS-06 | P1 | .66 | .92 | .73 | Approved-preview/delivered-output parity unproven | open |
| ISS-024 | WS-06 | P1 | .58 | .90 | .64 | Proof refinding is immature | open |
| ISS-025 | WS-07 | P0 | .99 | 1.00 | .98 | Cumulative Model Gateway spend unenforced | open |
| ISS-026 | WS-07 | P0 | .97 | 1.00 | .96 | Model Gateway rate limit is process-local | open |
| ISS-027 | WS-07 | P0 | .99 | 1.00 | .97 | Provider transport errors blindly retry instead of becoming ambiguous | open |
| ISS-028 | WS-07 | P0 | .88 | .96 | .89 | Commercial and invoice reconciliation not accepted | open |
| ISS-029 | WS-08 | P0 | .94 | .97 | .91 | Crash compensation and deterministic repair incomplete | open |
| ISS-030 | WS-08 | P0 | .95 | .99 | .92 | Rollback unproven across release boundaries | open |
| ISS-031 | WS-08 | P0 | .92 | .98 | .91 | Signed deployment manifest/SBOM/provenance absent | open |
| ISS-032 | WS-08 | P1 | .62 | .88 | .74 | End-to-end observability/incident lineage incomplete | open |
| ISS-033 | WS-09 | P1 | .60 | .94 | .55 | Cross-surface UI alignment incomplete | open |
| ISS-034 | WS-09 | P1 | .72 | .97 | .72 | Accessibility and supported-browser acceptance incomplete | open |
| ISS-035 | WS-09 | P1 | .59 | .90 | .61 | Durable progress/interruption semantics unproven | open |
| ISS-036 | WS-09 | P2 | .42 | .92 | .61 | Fleet admission/fairness/noisy-neighbor controls unproven | open |
| ISS-037 | WS-09 | P1 | .67 | .96 | .69 | Controlled-pilot entry/exit and incident criteria not operationalized | open |
| ISS-038 | WS-09 | P2 | .25 | .86 | .36 | Shared/fractional, governed egress, and richer operator capabilities deferred | open |

## Highest-leverage current conclusions

1. **Repository and test truth is now stable.** Preserve the independent broad merge gate and exact-head evidence discipline.
2. **Provider authority is locked, but commercial correctness is not.** Cumulative budgets, shared rates, and accepted-response-loss ambiguity remain P0.
3. **Protocol work cannot reopen authority manufacture.** Remote MCP, MCP Apps, and AG-UI remain projections under Manager custody.
4. **The architecture remains acceptance-poor outside source/CI.** Database, target host, provider, channels, commercial, recovery, accessibility, deployment, and pilot evidence remain open.
5. **Pilot readiness remains a release program, not a marketing toggle.**

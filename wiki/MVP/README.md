# AMTECH AI Employee MVP Wiki

Status: **strategy, research, and historical record index**  
Updated: 2026-07-19

The wiki preserves product rationale, market research, historical build plans, and factual implementation records. It does not define current source state, dependency order, or release acceptance.

## Current authority route

Before using a wiki page for implementation work, read:

1. [`../../CODEGRAPH.md`](../../CODEGRAPH.md)
2. [`../../mvp-build/CODEGRAPH.md`](../../mvp-build/CODEGRAPH.md)
3. ratified [`../../mvp-build/STANDARD.md`](../../mvp-build/STANDARD.md)
4. canonical [`../../mvp-build/second-half-plan/README.md`](../../mvp-build/second-half-plan/README.md)
5. [`../../mvp-build/memory/MEMORY.md`](../../mvp-build/memory/MEMORY.md) and the newest relevant handoff
6. current source, migrations, workflows, and proof

The single active production program is:

[`../../mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/README.md`](../../mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/README.md)

## Wiki families

- [`implementation-records/`](implementation-records/) — historical factual implementation/proof ledger.
- [`build-plan-current/`](build-plan-current/) — superseded historical reconciled build-plan packet.
- [`old-build-plan/`](old-build-plan/) — original historical plan packet.
- strategy, GTM, product, protocol, and research documents — rationale and hypotheses that require reconciliation against the ratified Standard and current source.

## Current product orientation

AMTECH builds governed persistent AI Employees. The reusable protocol—not one provider integration—is the moat:

- identity and assignments;
- authority and role-safe projection;
- transport-neutral capabilities and connectors;
- Manager MCP, explicitly safe direct MCP, and runtime-native tools;
- managed authorization across OAuth, provider onboarding, managed credentials, and operator installation;
- work objects, approval, effects, receipts, repair, and commercial attribution;
- bounded adapters for MCP Apps, AG-UI, Web, SMS, signed Review, and future channels.

Gmail, QuickBooks, and Stripe are shipped adapters rather than the connector ontology.

## Evidence and database policy

- Local/CI production-shaped PostgreSQL is the routine database TDD loop.
- Disposable managed Supabase is used when platform-specific Auth, Realtime, Storage, Data API, advisors, security-sensitive behavior, or the final release candidate is material.
- Production is not the routine test target.
- Wiki prose, source wiring, fixtures, screenshots, and historical proofs cannot establish live acceptance.

## Historical integrity

Do not delete or silently rewrite historical documents merely because they are stale. Preserve point-in-time facts and add routing/status at the family index or document banner when a reader could mistake them for current instructions.

# Dependency-Ordered Production Roadmap

Status: **active execution order**  
Updated: 2026-07-23  
Exact structural status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision router: [`../decision/active.json`](../decision/active.json)

## Current checkpoint

The locally and CI-provable source portions of WS-01 through WS-09 are integrated in the current branch candidate. Trace013 added the executable experiment compiler. Trace014 and Trace015 added the session bootstrap and strategy/frontier branch lineage. Trace016 repaired production runtime topology and produced exact-candidate local mirror P3 evidence at `c83c23be7d9bc5c36c164579ff47c16c45bb97a0`, but its transaction finish is not claimed because the repair exceeded the admitted patch scope. Trace017 reconciles the authority documents and memory to that state.

Current order:

```text
keep task/new-task-20260723 pushed and exact-green
→ review/merge into main
→ verify the exact main merge commit
→ create a fresh UI development branch
→ repoctl start opens Trace018 or the next available transaction
→ redesign UI Lab from current product authority
→ managed database, provider, target-host, and external acceptance work
```

## Dependency spine

```text
WS-01 repository/test/document/experiment truth
→ WS-02 connector and protocol authority
→ WS-03 database authority
→ WS-04 target-host/runtime custody
→ WS-05 fixture-free owner/channels
→ WS-06 golden governed work
↘ WS-07 commercial/provider ambiguity
→ WS-08 repair/rollback/observability/release
→ WS-09 human surface/capacity/pilot
→ frozen candidate
→ controlled pilot
→ measured expansion
```

## WS-01 — Repository, experiment, and document truth

Delivered:

- one exact-status owner and machine authority router;
- repository-native fact extraction and registered representation dialects;
- P1 certificate and P2 correspondence verifiers;
- task capsules, predictions, plan admission, impact coverage, evidence ledgers, and finish verification;
- six-case retrospective benchmark;
- structural governance and broad exact-head gates;
- Trace017 documentation reconciliation for the current exact candidate.

Exit: one exact-green `main` merge commit, with active documents and memory agreeing.

## WS-02 — Connector and protocol authority

Source contracts cover issuer/resource/scope/PKCE/custody, effective capability, discovery, guided setup, revoke/reconnect, MCP Apps, and exact conversational decisions.

Still required: live authorization, refresh/expiry, revocation, outage, repair, deletion, and remote conformance.

## WS-03 — Database authority

Source/local evidence covers the immutable ledger through `0082`, RLS, grants, functions, isolation, concurrency, rate/budget, ambiguity, and receipt chains. Production Supabase status has been observed fully applied through `0082` using the production env file.

Still required: managed advisors/security review, existing-row behavior, backup/restore, and rollback proof.

## WS-04 — Target-host custody

Source covers Host Provisioner authority, image identity, lifecycle/fault classification, and isolation scripts. Current local mirror evidence shows Manager, Model Gateway, Web, Host Provisioner, Caddy, and Cloudflare tunnel containers healthy on the exact candidate.

Still required: production-matching host secrets, target topology, managed tunnel/DNS, two-employee isolation, replacement, rotation, teardown, and destructive recovery.

## WS-05 — Fixture-free owner/channels

Source covers exact snapshots/streams, no-replay reconnect, Talk-first streaming, connector/review projections, and historical UI variants. Current UI Lab is non-authoritative for new UI development and should be redesigned on a fresh branch.

Still required: redesigned UI Lab route, real owner activation, denial/revocation, live reconnect, connector lifecycle, and Web/SMS/signed-Review convergence.

## WS-06 — Golden work

Source covers revision, approval, effect, receipt, output, proof, repair, and replay safety.

Still required: provider-backed Website, Contractor Office, and Bookkeeping journeys with preview/delivery parity, restart proof refinding, and fresh onboarding proof under production env.

## WS-07 — Commercial/provider ambiguity

Source/local evidence covers worst-case reservation, shared rate authority, one effect/provider identity, durable ambiguity, accounting, conservation, and original-effect reconciliation.

Still required: live provider idempotency/response loss and complete billing lifecycle.

## WS-08 — Recovery and release

Source/CI/local-mirror evidence covers fault states, rollback guards, backup/restore scripts, current-SHA app images, local Caddy upstream wiring, deploy smoke, signed metadata machinery, independent verification, and typed Manager composition.

Still required: Caddy system activation, wildcard DNS-01, desired Cloudflare production state, backup/restore proof, red-health operations, target-host destructive rehearsal, trusted signing/registry retention, incident execution, and accepted-work conservation under real faults.

## WS-09 — Human surface, capacity, and pilot

Source/fixture evidence covers coherent UI grammar, browser automation, capacity/fairness descriptors, and pilot-stop schema.

Still required: supported browsers, human accessibility, live recovery UX, representative 64 GiB capacity/fairness, and a complete pilot packet.

## Frozen candidate rule

Freeze only when every non-waivable gate passes on one exact candidate. Pilot is a measured production stage, never a substitute for prerequisites.

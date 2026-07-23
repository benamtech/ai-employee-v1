# 12 — Document Control, Decision, Memory, and Handoff Map

Status: active routing contract  
Updated: 2026-07-20

## Cold-start chain

```text
identity.md
→ root AGENTS.md + CONTRIBUTING.md + root CODEGRAPH.md
→ mvp-build/AGENTS.md + mvp-build/CODEGRAPH.md
→ STANDARD.md + ratified amendments
→ decision/README.md + protocol-v1.json
→ production-readiness-program/README.md + current transaction
→ exact source, migrations, tests, workflows, and proof
→ newest relevant indexed handoff when needed
→ applicable architecture documents
```

Do not select authority by filename date, concatenate historical handoffs, or treat a score as source truth.

## Contributor-document consolidation

| File | Owns | Must not own |
|---|---|---|
| `/AGENTS.md` | repository-wide authority, evidence rules, routing, generic Git discipline | product topology, current PR/SHA, migration head, workstream state |
| `/mvp-build/AGENTS.md` | product authority invariants and task execution | duplicated exact status or root repository mechanics |
| `/CLAUDE.md` | short compatibility router to root `AGENTS.md` | independent policy |
| `/mvp-build/CLAUDE.md` | short compatibility router to scoped `AGENTS.md` | independent policy |
| `/CODEGRAPH.md` | repository routing and major ownership boundaries | product implementation detail or exact status |
| `/mvp-build/CODEGRAPH.md` | sole exact product status and executable topology | contributor-policy duplication |

The exact branch, candidate, migration head, workstream status, and gate state must not be maintained in four or more mirrors.

## Authority classes

### Normative and operating

- `identity.md` — company/product identity.
- root/scoped `AGENTS.md` — execution contracts.
- `STANDARD.md` plus ratified amendments — non-waivable requirements.
- `decision/README.md` and `protocol-v1.json` — decision method.
- `mvp-build/CODEGRAPH.md` — exact current product topology/status.
- `production-readiness-program/` — single active dependency/issue/workstream/test/evidence route.
- source, migrations, generated configuration, executable tests, workflows, deployed proof, and release records — implementation/acceptance truth.

### Explanatory

- `docs/architecture/`;
- current UX/runtime derivations;
- canonical runbooks.

These explain current source. They do not establish stronger evidence.

### Decision records

- one active `decision/traceNNN/` per consequential transaction;
- candidate graph and software invariant hypergraph remain separate;
- complete prior traces are historical evidence;
- incomplete duplicate transports are removed;
- computation selects/describes work and records non-causality when it does not beat the simple baseline.

### Narrative evidence

- `memory/` contains dated handoffs; `MEMORY.md` is the sole index;
- `wiki/MVP/implementation-records/` is point-in-time factual history;
- exact CI artifacts and release records retain their original candidate scope.

Point-in-time evidence does not carry forward automatically.

### Historical plans and audits

- `second-half-plan/` is historical and non-canonical;
- old audits, architecture packets, and handoffs remain readable as provenance;
- obsolete active-looking entrypoints become routing stubs or archives rather than rewritten pseudo-current documents.

## Active route

```text
production-readiness-program/README.md
├─ 04-dependency-ordered-production-plan.md
├─ 08-production-issue-vector.json
├─ 13-resolution-ledger.json
├─ 09-workstream-execution-map.md
├─ 20-ws06-ws08-commercial-effect-transaction.md
├─ 10-test-suite-disposition.md
└─ 07-verification-and-handoff-matrix.md

decision/trace007/
├─ candidate_population.json
├─ candidate_graph.json
├─ software_invariant_hypergraph.json
├─ selection_comparison.json
├─ selected_implementation.json
├─ implementation_ablation.json
├─ verification_plan.json
└─ compute.py
```

## Update transaction

```text
authority/evidence/Unknown extraction
→ baseline, candidate matrix, topology, controls, sensitivity
→ implementation compression and proof plan
→ source / migrations / behavioral tests / workflows
→ active trace
→ program issue/workstream/test/evidence maps
→ mvp-build/CODEGRAPH exact status
→ architecture explanation
→ root routing only when ownership changes
→ one dated handoff and MEMORY.md
→ PR or release record
```

A current claim is incomplete when any required map points to another candidate, migration, workstream state, trace, or evidence class.

## Governance boundary

Repository governance validates:

- required authority routes exist;
- JSON schemas and references are valid;
- compressed trace payloads decode and hash correctly;
- candidate and software topology semantics are distinct;
- software edges have behavioral proof mappings;
- evidence classes do not promote;
- exact product status is not duplicated;
- deterministic verification entrypoints exist.

It does **not** hard-pin PR numbers, SHAs, migration values, issue counts, selected candidate IDs, objective values, causal labels, or prose fragments.

## Anti-context-rot rules

1. One Standard family.
2. One decision protocol.
3. One active production program.
4. One active trace per active transaction.
5. One exact product-status owner.
6. One memory index.
7. Compatibility files route; they do not mirror policy.
8. Memory is a handoff layer, not a second plan.
9. Historical material remains point-in-time evidence.
10. Unknown stays Unknown.
11. Documentation, computation, source, fixtures, local tests, and ancestor evidence do not prove stronger gates.

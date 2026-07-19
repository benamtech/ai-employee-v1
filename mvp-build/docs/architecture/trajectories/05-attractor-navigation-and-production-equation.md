# 05 — Attractor Navigation and Production Acceptance Equation

Status: **[VERIFIED] current basin predicates; [INFERRED] admissible transition path**

## Basin A — extraction

- [VERIFIED] α10=1, α11=1, ν46=1, and ν47=1.
- [VERIFIED] Extraction/package/consumer compatibility is occupied and stable.
- [INFERRED] The control objective is preservation, not reopening extraction or importing reference implementations into production.

## Basin B — production

- [VERIFIED] `min(π56…π64)=0.0`; Basin B is not occupied.
- [INFERRED] The shortest wall-safe path is:

```text
1. preserve W1/W2/W3/W5/W6 and increase evidence margin above W4;
2. close α15, α20, σ40, and ν51–ν53 deficits with source and failure evidence;
3. pre-stage π56–π59 as one DB/secrets/model/identity activation packet;
4. prove π60 sandbox/network isolation and π61 durable effect/outbox behavior;
5. prove π62 reconciliation, π63 crash recovery, and π64 dead-letter/replay;
6. compute π65 from the lowest accepted production coordinate;
7. deploy only the signed manifest and retain rollback proof.
```

- [INFERRED] No π coordinate is promoted from documentation or CI shape. Its production value changes only when its live acceptance predicate is satisfied on the exact deployed SHA.

## Basin C — research

- [VERIFIED] σ30=1 and ρ remains low.
- [INFERRED] Research remains a separate meta-stable basin after production acceptance, with no production import, renderer, authority, or release dependency.

## Basin D — invention/fragmentation

- [VERIFIED] Entry conditions include a second authority, reference import leakage, or scope-lock loss.
- [VERIFIED] Current controls preventing this basin include one generated-view compiler, one canonical adaptive planner, Manager authority, no reference imports, and the UX research disposition.

## Control intervention queue

| Rank | Dimensions | Normalized deficit | Required intervention |
|---:|---|---:|---|
| 1 | σ40 and π56–π64 | 1.8 each after gates | managed secrets and coordinated live production acceptance |
| 2 | π65 | 1.6 nominal, minimum-gated | compute from evidence minimum; never set independently |
| 3 | α15 | 1.0 | cumulative budget, shared rate, provider ambiguity/idempotency |
| 4 | α20, ν53, χ75 | 0.8 | concurrency/crash idempotency and evidence-backed trust |
| 5 | α23, χ74 | 0.6 magnitude | complete action/repair loop and reduce cognitive load |
| 6 | α14, ν51, ν52 | 0.5 | live schema, durability, and isolation proof |
| 7 | χ73 | 0.4 | exception-first stable owner focus |
| 8 | σ27 | 0.3 | complete approval lifecycle without increasing fatigue |
| 9 | σ26, χ76 | 0.2 magnitude | close injection boundary and reduce redundant approval load |

## Exact production acceptance equation

[INFERRED] The branch enters Basin B only when:

```text
B_accept =
  min(π56…π64) ≥ 0.9
  AND π65 = min(π56…π64)
  AND σ30 = 1
  AND σ34 = 1
  AND α11 = 1
  AND ν46 = 1
  AND tested_sha = deployed_sha
  AND accepted receipts exist for:
      migration and identity activation,
      normal owner turn,
      generated work object,
      provider/accounting effect,
      recovery/repair,
      dead-letter/replay,
      rollback and deployment attestation
```

- [VERIFIED] Current branch does not satisfy this equation.
- [INFERRED] Documentation, CI, and trajectory scores can identify the next control surface but cannot satisfy a live term.

## Agent usage rule

A coding agent may use this packet to order work only after it:

1. confirms the current exact head;
2. reads the source files and tests associated with the interacting dimensions;
3. confirms that the current-state values still describe the repository;
4. records any changed state in CODEGRAPH/memory or supersedes the trajectory entry;
5. validates the concrete acceptance predicate rather than reporting movement from prose alone.

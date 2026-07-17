# Vector-Native Corrections — Validation Report

Date: 2026-07-17
Branch: `agent/ui-metaprogramming-pass-1`
Status: vector identity/prototype source pass; proposal coverage mechanics pass; external relevance pending

## Scope

Correct the three highest-impact compiler defects without claiming production SEO value.

## Disposition

| Finding | State |
|---|---|
| F-01 namespace/version ignored by symbols | corrected and tested |
| F-02 broad `spaceHash` order-sensitive | corrected and tested |
| F-03 secondary prototypes lost | corrected and packed/tested |
| F-04 proposal coverage was prose only | mechanical computation corrected; calibration/independence still P0 |
| F-06 agent context primary-only | corrected and tested |
| F-05/F-07–F-13 | open |

## Implemented source changes

### Vector identity

- `reference/src/benchmark.ts`: `VectorSpaceIdentity`; namespace/version-prefixed symbols.
- `site-manifest.yaml`: `vector_space.symbol_version`.
- `reference/scripts/emit-manifest.mjs`: identity emitted.

### Prototype preservation

- `reference/src/framework.ts`: all prototypes in `PageIR`; packed offsets/IDs/vectors; prototype state in build hash.
- `reference/src/manifest.ts`: all prototypes sent into `SiteSource`; every packed float checked against geometry.
- `reference/src/agent-harness.ts`: all page regions exposed.

### Proposal mechanics

- `site-manifest.yaml`: coverage policy and context/report requirements.
- `reference/src/manifest.ts`: baseline/proposed weighted coverage, normalized gain, improved contexts, duplicate ceiling, noindex recompilation.

Qualification:

- contexts can be supplied by the proposing agent;
- graded labels are not used;
- validated code shifts cosine from `[-1,1]` to `[0,1]`, giving orthogonal vectors about `0.5` coverage;
- thresholds are not externally calibrated.

Therefore this is a structural admission mechanism, not accepted relevance authority.

### CSI control

- `reference/src/csi.ts`: Facility Location Complement Information and positive-marginal greedy batch selection.
- `reference/test/vector-native.test.mjs`: coherent head/tail fixture rejects isolated noise.

## Exact source validation

```text
validated head: 9ef48b97308e09d5a97f4978820255e3c8b53c7e
workflow: Website Framework Reference
run: 29576487817
conclusion: success
Node tests: 22/22
manifest/UI/browser/R3F source stages: pass
pages: 6
indexable pages: 0
prototype count: 7
namespace: amtech-hyper-site-v1
symbol version: 1
build hash: ae16957209827c1fbbc295992ab0aceeaf648b250521b03695b4f663cf6d241a
space hash: 934ac02b434b0d583c131a15bbff79492ea8e27ca13a5ea2d07367b4fa8b6978
artifact: sha256:3dce480b18b10020ab6607440e256d085abf62a8d79b6d127c6a102c26c0a94d
```

## Passed invariants

- identical vector identity produces identical vectors;
- namespace/version rotation changes vectors;
- broad source collection reorder preserves build/space hashes;
- every declared estimate-page prototype survives geometry, `PageIR`, packed arrays, agent context, and UI inputs;
- a distinct synthetic proposal passes the mechanical gate;
- an exact synthetic duplicate fails;
- CSI controlled selection covers coherent head/tail slices and rejects isolated noise;
- all current pages remain noindex.

## Not passed

- explicit primary-prototype semantics;
- calibrated compatibility transform;
- independently sourced/adjudicated contexts;
- learned semantic baseline;
- held-out/out-of-domain relevance;
- typed graph paths;
- public employee task runtime;
- browser accessibility/CWV;
- Zig/Wasm/Cloudflare runtime;
- field indexing/search/conversion/revenue.

## Academic boundary

Kong et al. 2023 supports separate query-document and context-document relevance with human graded labels. The current synthetic proposal fixture does not reproduce that evaluation.

Iyer 2026 supports CSI as a complement-aware batch/split research arm. It is a new preprint and not a single-page admission gate.

## Next gate

```text
primary prototype semantics
-> independent graded context corpus
-> calibrated lexical/semantic/facet/graph/HRR compatibility
-> typed graph paths
-> public task-surface contract
-> browser/accessibility
-> first noindex 20–40-page cohort
```

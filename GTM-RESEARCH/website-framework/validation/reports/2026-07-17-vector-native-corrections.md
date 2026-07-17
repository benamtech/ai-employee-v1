# Vector-Native Corrections — Validation Report

Date: 2026-07-17
Branch: `agent/ui-metaprogramming-pass-1`
Status: source-level pass; external relevance, browser, runtime, and field acceptance pending

## Scope

Correct and validate the highest-impact findings from `2026-07-17-vector-node-path-deep-code-review.md` without claiming production SEO value.

## Finding disposition

| Finding | Prior state | Current state |
|---|---|---|
| F-01 vector namespace/version ignored by symbols | blocker | corrected and tested |
| F-02 broad `spaceHash` source-order-sensitive | blocker | corrected and tested |
| F-03 secondary prototypes lost after geometry | blocker | corrected and packed/tested |
| F-04 proposal marginal coverage was prose | blocker | corrected with computed gate |
| F-05 links untyped similarity neighbors | blocker | open |
| F-06 agent context exposed only primary prototype | blocker | corrected and tested |
| F-07 synthetic relevance true by construction | blocker | open; fixture-only wording retained |
| F-08 UI primarily module-driven | limitation | open; source UI proof remains valid |
| F-09 public employee task surface absent | blocker | open |
| F-10 experiment aggregation boundaries | blocker | open |
| F-11 business event idempotency | blocker | open |
| F-12 ontology values open | risk | open |
| F-13 evidence semantics coarse | risk | open |

## Source changes

### Vector identity

- `reference/src/benchmark.ts`
  - `VectorSpaceIdentity`
  - namespace/version-prefixed role, value, and empty-context symbols
- `site-manifest.yaml`
  - `vector_space.symbol_version`
- `reference/scripts/emit-manifest.mjs`
  - vector identity emitted in artifacts

### Prototype preservation

- `reference/src/framework.ts`
  - `VectorPrototypeSource` and `VectorPrototypeIR`
  - all prototypes in `PageIR`
  - packed prototype offsets, IDs, and vectors
  - build hash includes prototype state
- `reference/src/manifest.ts`
  - all geometry prototypes passed into `SiteSource`
  - every packed prototype checked against the reference geometry
- `reference/src/agent-harness.ts`
  - every page prototype and atom set emitted to generation agents

### Computed proposal coverage

- `site-manifest.yaml`
  - explicit coverage policy
  - coverage-context and computed-report requirements
- `reference/src/manifest.ts`
  - sourced weighted context cases
  - baseline/current-corpus coverage
  - proposed-corpus coverage
  - normalized marginal gain
  - improving-context count
  - existing-page similarity ceiling
  - noindex structural recompilation after the numeric gate

### CSI control

- `reference/src/csi.ts`
  - Facility Location Complement Information
  - deterministic positive-marginal greedy batch selector
- `reference/test/vector-native.test.mjs`
  - coherent head/tail selection and isolated-noise rejection fixture

## Exact validation

Validated head: `9ef48b97308e09d5a97f4978820255e3c8b53c7e`

Workflow: `Website Framework Reference`

Run: `29576487817`

Conclusion: success

Stages:

```text
npm install --no-audit --no-fund
npm test
npm run manifest:emit
npm run ui:emit
npm run browser:check
npm run ui:r3f:build
artifact upload
```

Tests:

```text
22 tests
22 pass
0 fail
```

Emitted facts:

```text
manifest version: 1.1.0
pages: 6
indexable pages: 0
prototype count: 7
vector namespace: amtech-hyper-site-v1
symbol version: 1
build hash: ae16957209827c1fbbc295992ab0aceeaf648b250521b03695b4f663cf6d241a
vector-space hash: 934ac02b434b0d583c131a15bbff79492ea8e27ca13a5ea2d07367b4fa8b6978
```

Artifact digest:

```text
website-framework-emissions
sha256:3dce480b18b10020ab6607440e256d085abf62a8d79b6d127c6a102c26c0a94d
```

## Tests added or strengthened

1. identical vector identity produces byte-identical vectors;
2. namespace rotation changes the symbol space;
3. symbol-version rotation changes the symbol space;
4. broad vector-space and site hashes survive source collection reordering;
5. all estimate-page prototypes survive geometry, `PageIR`, packed arrays, agent context, and UI inputs;
6. a distinct landscaping missed-call proposal produces positive computed coverage and enters noindex;
7. a duplicate estimate proposal receives near-zero gain and fails;
8. Facility Location Complement Information is zero for empty/full sets;
9. CSI greedy selection covers coherent head and tail slices while excluding isolated noise.

## Validation vector result

### Pass

- vector identity affects actual symbols;
- all declared prototypes reach packed IR;
- packed/reference prototype parity is enforced;
- broad source-order determinism is restored;
- proposal admission no longer relies on prose alone;
- duplicate proposal rejection is executable;
- CSI is implemented only as a bounded research/batch control;
- current corpus remains fully noindex.

### Not passed

- independent human graded query/context/document collection;
- learned semantic baseline;
- out-of-domain context relevance;
- typed internal-link/path semantics;
- browser screenshot/accessibility acceptance;
- public employee task runtime;
- production Zig/Wasm/Cloudflare;
- real indexing, ranking, conversion, gross profit, or lifecycle return.

## Important residual issue

The manifest does not yet declare `primary_prototype_id`. The compiler preserves every prototype, but the legacy `pageVectors` compatibility alias uses the canonicalized first prototype. Retrieval that claims multi-region behavior must use packed prototype arrays. Add an explicit primary-prototype schema before field publication or remove the alias from authoritative scoring.

## Academic interpretation

The contextual-ranking paper supports separate evaluation of query-document and explicit context-document relevance with graded labels. It does not validate our HRR representation or corpus construction.

The CSI paper supports a new complement-aware batch-selection research arm. It is a 2026 preprint, its guarantees depend on assumptions not yet diagnosed here, and it is not the single-proposal gate.

## Next gate

```text
explicit primary-prototype semantics
-> typed graph edges and path validation
-> independent graded context-document benchmark
-> learned semantic and simpler baseline comparison
-> public task-surface contract
-> browser/accessibility validation
-> first noindex 20–40-page proposal cohort
```

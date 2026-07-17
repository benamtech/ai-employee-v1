# UI Metaprogramming Pass 1 Validation

Date: 2026-07-17
Branch: `agent/ui-metaprogramming-pass-1`
Status: source-level pass; browser/field acceptance pending

## Implemented

- explicit Tier 2 browser target contract;
- browser resolver with package/rc/framework/default precedence;
- fixed 57-item modern-CSS decision engine;
- AMTECH semantic design-system adapter;
- page-matrix/vector-to-layout compiler;
- deterministic static HTML and critical CSS renderer;
- optional page-geometry-to-3D contracts with SVG posters;
- React 19 / R3F 9.6.1 / Three.js 0.185.1 demand-rendered adapter;
- source-order determinism, noindex parity, no-JS, CSS-budget, and scene-policy tests;
- CI emission of browser, CSS, UI-plan, HTML, CSS, and scene artifacts;
- persistent CI diagnostic artifacts on failure.

## GitHub Actions proof

Workflow: `Website Framework Reference`
Run: `29573692015`
Validated head: `cc40548e868f1faf01c5e02fd0ca007902a36175`
Conclusion: success

Successful stages:

```text
npm install
npm test
npm run manifest:emit
npm run ui:emit
npm run browser:check
npm run ui:r3f:build
artifact upload
```

Reference tests: `19/19` passed.

Emissions artifact:

```text
artifact digest: sha256:46d76365cc1bec9bae7941f81859f0d313261f851f62b4c5cf32c044ba840826
browser tier: 2
browser report: browser-a3d08505
CSS decisions: 57
native: 42
guarded: 10
skipped: 1
prohibited: 4
critical CSS: 11,594 bytes
UI plan hash: e4748f2609c1b86d5972217102e1f0f9425ab4e98242794315340e994ecb0996
site hash: 58ea7da4bb10ae44b7261c8569ca666abea5d55ef8aa088238a1d0cfd1e1272d
```

Page results:

| Page | Archetype | Optional scene | HTML hash |
|---|---|---:|---|
| `page:contractor-estimate-followup` | `workflow-led` | no | `2678f8c6c2c9e5d6aaeca146c880ee16729c20cf39276ebd226dca821b39a1ee` |
| `page:technical-security` | `comparison-led` | yes | `4861e5f801171a82dc682da18c3f4cc4d202900f42722af76eeb5e84c48c07e2` |

Module coverage:

```text
hero 2
answer 1
workflow 1
proof 2
comparison 2
faq 2
cta 2
instruction 2
```

Layout-role coverage:

```text
lead 3
support 5
proof 2
decision 2
conversion 2
```

## Failure found and corrected

The first CI run exposed that the framework's existing broad `CompiledHyperVectorSpace.spaceHash` changes when manifest page ordering changes, even though compiled page semantics remain stable. The UI pass now computes a canonical UI vector-space serialization by sorting axes, pages, profiles, prototypes, feature atoms, neighbors, and vocabulary before hashing.

This makes UI plans and emissions deterministic under source reordering. The broader compiler `spaceHash` implementation remains a separately recorded cleanup target; this pass does not misrepresent it as fixed globally.

## Pass vector

The source-level pass requires strict TypeScript build; all Node tests; all eight module kinds and five roles covered; deterministic UI hashes under source reordering; CSS below 24 KB; no dark-mode branch; all pages noindex; zero canonical JavaScript; exactly one justified current 3D scene; and a successful pinned R3F adapter build. All passed on the validated head above.

## Fail vector

Missing browser targets, incomplete CSS decisions, arbitrary styling, missing constructors, UI hash drift, metadata/robots drift, content trapped in canvas, canonical R3F dependency, always-running rendering, multiple scenes, default postprocessing, mandatory Wasm, or budget violation blocks the pass.

## Not yet validated

- browser screenshots and visual-regression quality;
- keyboard, screen reader, 400% zoom, contrast, and accessibility-tree acceptance;
- field LCP, INP, and CLS;
- R3F runtime performance, memory, context loss, and mobile GPU behavior;
- production search indexing, ranking, conversion, or revenue;
- global source-order stability of the existing broad compiler `spaceHash` outside the UI canonicalization boundary.

# Holographic Hyper-Targeting Research Notes

Date: 2026-07-17
Branch: historical Phase 1 research log
Status: retained evidence and decision history; `RESEARCH-NOTES-CURRENT.md` supersedes architectural state

> Current correction: the former Request Mirror manifest and the newer synthetic compiler have been unified through `site-manifest.yaml` and `reference/src/manifest.ts`. Read `RESEARCH-NOTES-CURRENT.md` and `16-unified-hypervector-manifest-agent-harness.md` before using this historical log. The repository remains research-only and all current manifest pages are noindex.

## Research question

Can a public website use request/session context encoded with HRR/VSA, plus a content/entity graph and bounded priors, to select a more relevant finite landing-page slice at edge latency while preserving canonical SEO, user trust, and privacy?

This historical question has expanded. The current framework also tests whether a first-class page/context geometry can guide agent-generated corpus construction, graph links, UI scaffolding, and deterministic emissions. Neither application is established by existing research.

## Current external baseline added after this log

Deguang Kong, Daniel Zhou, Zhiheng Huang, and Steph Sigalas, “Personalized Search Via Neural Contextual Semantic Relevance Ranking,” arXiv:2309.05113:

https://arxiv.org/abs/2309.05113

The paper supports treating context-document compatibility as distinct from ordinary query-document relevance and motivates lexical/semantic contextual controls. It does not establish HRR, SEO lift, public corpus generation, zero-volume strategy, agent-generated content, or revenue.

Denis Kleyko et al., “A Survey on Hyperdimensional Computing aka Vector Symbolic Architectures, Part II: Applications, Cognitive Models, and Challenges,” arXiv:2112.15424 / ACM Computing Surveys 55(9):

https://arxiv.org/abs/2112.15424

The survey supports HDC/VSA as a broad compositional computing framework. It does not validate search ranking or publishing outcomes.

## Preserved Phase 1 findings

The following remain active unless superseded by current code or research notes:

- Tony Plate’s HRR work supports deterministic distributed role/filler composition, circular convolution, superposition, and approximate retrieval—not website or SEO benefit.
- HRR recommender research supports testing feature interaction and sparse associative retrieval—not public-search lift.
- target-runtime performance must be measured end to end; Zig/Wasm is optional until it beats the TypeScript oracle.
- build-time pre-binding is the primary hot-path simplification.
- exact flat scanning is the first retrieval control.
- graph augmentation must demonstrate incremental relevance rather than restating content priors.
- confidence requires calibration and explicit fallback.
- static canonical output, crawler/human parity, visible structured data, and evidence ceilings remain hard gates.
- browser fingerprinting, raw IP persistence, covert identity stitching, and sensitive-trait inference remain prohibited.
- network vector stores are not part of the default request path.
- Google-specific behavior must be validated against current official documentation and live Search Console evidence.

## Superseded Phase 1 architecture

The old separate v0.1 decision was:

```text
Request Mirror lab
+ explicit trait fixtures
+ five finite candidate slices
+ noindex/private output
```

That lab is no longer a separate system. It is represented by the `request-mirror-lab` profile inside the unified manifest and compiles through the same vector-space, semantic IR, and emission path as future pages.

## Current open questions

1. Does a hyper-aware agent harness produce materially better page opportunities than a normal content brief?
2. Does HRR/hybrid geometry improve held-out human relevance over lexical, semantic, facet, and graph controls?
3. Does vector-derived internal linking remain semantically useful under real reviewed corpora?
4. Can the supplied design system satisfy the renderer superset without changing page truth or geometry?
5. Does a reviewed 20–40-page field cohort produce compatible non-branded discovery and qualified pipeline per page?
6. Do long-tail and reported zero-volume pages add marginal information and commercial value rather than merely increasing page count?
7. Does Zig/Wasm provide an end-to-end advantage on the selected runtime?

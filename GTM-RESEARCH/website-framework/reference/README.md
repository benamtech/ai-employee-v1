# Website-framework reference package

Status: executable research reference; not production accepted

This package now has one primary entry path:

```text
../../site-manifest.yaml
-> compileFrameworkManifest()
-> first-class hyper-vector space
-> vector-derived links and profiles
-> SiteSource / PageIR / packed artifacts
-> HTML, instruction, agent-context, and UI-scaffold emissions
```

The legacy Request Mirror and newer synthetic compiler are not separate systems. Request Mirror behavior is the `request-mirror-lab` profile inside the unified manifest.

## Commands

```bash
npm install
npm test
npm run manifest:emit
npm run benchmark:scale
npm run generate:field
ZIG=/path/to/zig-0.15.2 ./zig/build.sh
node scripts/verify-wasm.mjs
```

`manifest:emit` emits:

- all current noindex page fixtures;
- instruction projections;
- sitemap;
- vector-space vocabulary/prototype metadata;
- hyper-aware agent context;
- UI scaffold plan;
- build and vector-space hashes.

## Package layers

- `benchmark.ts`: contextual lexical/semantic/facet/graph/HRR controls.
- `optimizer.ts`: corpus-coverage and distinctness controls.
- `manifest.ts`: unified manifest parser, validator, composer, vector geometry, profile and publication gates.
- `agent-harness.ts`: compact context supplied to content-generation agents.
- `framework.ts`: semantic IR, packed vectors/graph, deterministic neutral emissions.
- `ui-scaffold.ts`: renderer-independent metaprogramming input.
- `distribution.ts`: field search/conversion measurement contracts.
- `resolver.ts`, `worker/`, `zig/`, `wasm.ts`: source-wired runtime research paths.

## Acceptance boundary

Passing tests means the research compiler is internally coherent. It does not establish:

- that pages should be indexed;
- that Google/Bing will rank them;
- that zero-volume targets produce authority;
- that agent-generated content is useful;
- that Zig/Wasm or Cloudflare improves end-to-end performance;
- that the system generates revenue.

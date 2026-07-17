# Synthetic Persona Matrix Generator Validation

Date: 2026-07-17
Branch: `research`
Generator: `scripts/generate-synthetic-persona-matrix.mjs`
Status: passed local Node execution and independent parse/constraint assertions

## Command

```bash
node scripts/generate-synthetic-persona-matrix.mjs /tmp/synthetic-persona-matrix.toon
```

The repository could not be cloned directly in the assistant runtime because outbound DNS was unavailable. The exact just-committed generator source was reproduced locally and executed with Node, then the output was independently parsed and asserted with Python.

## Results

- data rows: `100`
- header rows: `1`
- output bytes: `55151`
- SHA-256: `ce3a6d38b5c3e01f6b48692da00091078b68914791f8c3afc44213b7a221f2a6`
- first ID: `SLICE-001`
- last ID: `SLICE-100`
- unique IDs: `100`
- unique target slugs: `100`

## Constraints asserted

- age is within `30..60` for every row;
- synthetic net worth is within `$550,000..$2,000,000` for every row;
- owned homes is strictly less than `2` for every row;
- activation is `plain-text<2m` for every row;
- API keys are not required for every row;
- duplicate slice IDs: `0`;
- duplicate target slugs: `0`;
- output parses as the expected `toon`-prefixed JSON matrix.

## Privacy and use boundary

The dataset is synthetic. Financial, family, pet, property, vehicle, music, hobby, and emotional-friction fields are benchmark labels for representation, perturbation, ranking, and policy tests. They are not approved runtime inference targets.

## Validation not run

- committed-source checkout execution through normal repository tooling;
- CI execution;
- TypeScript/HRR matching against the matrix;
- relevance labels or reviewer evaluation;
- Cloudflare/Next/Zig/WASM integration;
- conversion or runtime acceptance.

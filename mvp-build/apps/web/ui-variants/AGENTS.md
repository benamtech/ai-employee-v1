# UI Variant Agent Authority

Read `README.md`, `contract.ts`, the target folder's `instructions.md`, `TASK.md`, and `variant.json` before editing.

For an ordinary design session, write only inside the selected `apps/web/ui-variants/<slug>/` directory. Repository-wide files, scripts, tests, routes, shared contracts, generated registries, package manifests, fixtures, and other variants are read-only.

Capability and information fidelity to the AMTECH Web client are required. Its appearance and layout are not authoritative. Use the neutral `model`, bounded `dispatchIntent`, and optional `slots.reference_client` only.

Run from `mvp-build` before stopping:

```bash
node scripts/ui-variant.mjs validate <slug>
```

Do not promote or assign a variant.

# AMTECH UI Variants

A UI variant is a filesystem-discovered frontend implementation of the neutral AMTECH employee experience contract.

```text
production Web-client capability set ⊂ UI variant capability space
```

The production Web client is one reference variant and an optional runtime slot. A variant is not required to preserve its appearance, DOM structure, navigation, terminology, component hierarchy, or layout.

## Required files

```text
<slug>/variant.json
<slug>/index.tsx
```

All other files are local implementation choices. Use `node scripts/ui-variant.mjs new <slug>` from `mvp-build` to create the full agent-ready scaffold.

## Public boundary

Import only:

```ts
import { defineUiVariant } from "../contract";
```

The component receives:

- `model`: `EmployeeExperienceModelV1`;
- `dispatchIntent`: bounded host actions;
- `slots.reference_client`: the real production client tree;
- `environment`: viewport, color-scheme, reduced-motion, locale, and lab metadata;
- `manifest`: the validated folder manifest.

## Internal freedom

A folder may contain arbitrary local React components, CSS Modules, SVG, Canvas code, shaders, Workers, assets, and WASM glue when declared in `variant.json`. The standard does not impose a style or layout system.

## Boundaries

Variants cannot:

- import product routes, API clients, Manager, database, infrastructure, or fixtures;
- import relative files outside the folder except `../contract`;
- fetch product data directly;
- use ambient browser storage;
- add undeclared dependencies;
- claim unavailable capabilities;
- promote or assign themselves.

## Commands

```bash
node scripts/ui-variant.mjs new <slug>
node scripts/ui-variant.mjs validate <slug>
node scripts/ui-variant.mjs generate
node scripts/ui-variant.mjs doctor
node scripts/ui-variant-collaborator.mjs <slug> --agent claude
```

See `../../../UI_LAB_AGENT_ONBOARDING.md` for the complete collaborator workflow.

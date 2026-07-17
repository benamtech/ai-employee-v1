# First UI metaprogramming pass handoff

The UI pass starts from the compiled `ui-scaffold` profile, not from hand-authored HTML and not from the synthetic 2,000-page scale output.

## Generate the input

```bash
cd GTM-RESEARCH/website-framework/reference
npm install
npm run manifest:emit
```

Primary inputs:

- `generated-manifest/ui-scaffold.json`
- `generated-manifest/vector-space.json`
- `generated-manifest/agent-context.json`
- emitted noindex fixture HTML
- the supplied AMTECH design system

## Required semantic constructors

- `hero`
- `answer`
- `workflow`
- `proof`
- `comparison`
- `faq`
- `cta`
- `instruction`

Required layout roles:

- `lead`
- `support`
- `proof`
- `decision`
- `conversion`

Required capability superset:

- semantic hierarchy;
- responsive grids and mobile priority;
- evidence-dense proof;
- workflow steps;
- comparison tables;
- progressive disclosure;
- conversion panels;
- long-form reading;
- visible structured data;
- instruction pointers;
- reduced-motion compatibility where motion is introduced.

## Metaprogramming contract

The renderer receives:

```text
page vector prototype IDs
+ semantic module sequence
+ layout roles
+ capability requirements
+ variant axes
+ canonical content/evidence
```

It returns deterministic component trees and HTML.

The renderer may derive a light, clean, professional standard that is a satisfactory superset of the supplied design system. It may not change:

- target feature atoms or prototype sets;
- canonical questions;
- claims or evidence;
- information objects;
- internal graph edges;
- profile membership;
- indexability/publication gates.

## Required first-pass proof

- every `ui-scaffold` page renders;
- all module kinds have constructors;
- all layout roles are represented;
- desktop/mobile and reduced-motion fixtures pass;
- HTML meaning, metadata, JSON-LD, links, and noindex state match the neutral renderer;
- JS-disabled output remains complete;
- the supplied design system passes `validateDesignSystemSuperset()`;
- renderer output is deterministic under source reordering.

# UI design-system handoff

The next design pass must implement a clean professional renderer as a **satisfactory superset** of the framework's semantic contract. It must not change knowledge, evidence, query/page geometry, canonical intent, or corpus optimization.

## Required semantic module kinds

- `hero`
- `answer`
- `workflow`
- `proof`
- `comparison`
- `faq`
- `cta`
- `instruction`

## Required layout roles

- `lead`
- `support`
- `proof`
- `decision`
- `conversion`

## Design capability vector

The current feature space records whether a page or variant requires:

```text
semantic-hierarchy
responsive-grid
evidence-dense
comparison-table
workflow-steps
progressive-disclosure
conversion-panel
media-slot
reduced-motion
long-form-reading
mobile-priority
structured-data-visible
instruction-pointer
```

The supplied design system will be translated into:

- token scales: spacing, typography, radii, content widths, color semantics;
- component constructors for every required module kind;
- supported layout roles and responsive constraints;
- accessibility, reduced-motion, evidence, table, workflow, media, and conversion capabilities;
- forbidden component/layout combinations;
- renderer golden fixtures.

`validateDesignSystemSuperset()` must pass before the renderer can emit production pages. The reference contract is intentionally light: it establishes semantic sufficiency, consistency, and professional hierarchy without forcing AMTECH's eventual visual identity into the framework core.

# ADR-010 — Employee UI port and web presentation adapters

Status: **implemented candidate; exact-head type, unit, build, and browser evidence pending**  
Decision date: 2026-07-22  
Repository: `benamtech/ai-employee-v1`  
Starting SHA: `712599ff31599e1a259157dd0e34915d0777d5f6`  
Branch: `agent/employee-ui-port-adapters`

The initial source inspection used PR #36 head `c20adaede64d45c24d74b8531507935ad7a8ce02`. GitHub comparison proved that its tree is identical to integrated PR #36 merge commit `712599ff31599e1a259157dd0e34915d0777d5f6`; the final review branch was recreated from the integrated merge commit.

## Decision in one sentence

AMTECH exposes one typed employee UI port contract; `owner_web`, `public_form`, and `boundless_website` are high-level web adapters, while theme, layout, component set, density, and brand tokens are replaceable strategies inside an adapter.

## Why the terminology matters

The original ports-and-adapters pattern says a port identifies a purposeful conversation and an adapter translates that port for a particular external technology or interaction environment. A color palette is not a purposeful conversation. Neither is a compact card style. Calling every visual variant an adapter would create hundreds of meaningless adapters and obscure the actual boundaries.

For AMTECH:

```text
employee UI port
├── owner_web adapter
│   ├── theme strategy
│   ├── layout strategy
│   ├── component-set strategy
│   └── density strategy
├── public_form adapter
│   ├── conversational form layout
│   ├── estimator brand/theme
│   └── form-forward components
└── boundless_website adapter
    ├── full-page layout
    ├── brand/theme
    └── editorial or custom components
```

UI Lab is a test driver and workshop. It mounts adapter + strategy + fixture combinations. It is not itself a product adapter.

## Current repository facts

- The standard employee route is `apps/web/app/agent/[employeeId]/page.tsx`.
- `LiveEmployeeOperatingShell` provides the Talk/Workspace owner client.
- `AgentSurface` contains the richer operating workspace and can consume fixture payloads.
- `FreeEstimatorClient` is an existing public conversational estimator surface with its own public-session API.
- UI Lab already renders fixture scenarios through production components.
- Global CSS already contains design tokens, but the Talk and Workspace components also contain substantial component-local hard-coded styling.
- Profile key, business kind, dominant domains, and profile/onboarding facts already reach the Web resource payload.
- `employee_manifests.manifest` and profile package descriptors are JSON, so optional presentation hints require no schema migration.

## Port contract

The shared contract is defined in `packages/shared/src/employee-ui-presentation.ts`:

```ts
interface EmployeeUiPortContract {
  version: 1;
  adapter_key: "owner_web" | "public_form" | "boundless_website";
  presentation: {
    version: 1;
    theme_key: string;
    layout_key: string;
    component_set_key: string;
    density: "calm" | "balanced" | "dense";
    brand: {
      primary?: string;
      secondary?: string;
      accent?: string;
      canvas?: string;
      surface?: string;
      ink?: string;
      muted?: string;
    };
    source: string;
  };
}
```

The port contract intentionally does not contain React components, CSS text, route names, or arbitrary HTML. Registry keys select code already installed in the Web application. Custom keys must use `custom:<lowercase-slug>` and must later be backed by an installed registry entry.

## Resolution order

Presentation is resolved deterministically in this order:

```text
adapter default
→ business/profile match
→ onboarding brand tokens
→ profile-generated presentation hint
→ explicit user, custom, or UI Lab override
```

The host chooses the adapter. A generated profile hint cannot silently turn an authenticated owner employee into a public website or public form. It may choose strategies inside the selected adapter.

## Initial built-ins

### Adapters

| Key | Purpose | Current state |
|---|---|---|
| `owner_web` | Authenticated standard employee Web client | Mounted on `/agent/[employeeId]` |
| `public_form` | Public bounded conversational workflow | Mounted around the current `/free-estimator` preview |
| `boundless_website` | Employee-dominant public website | Registered and selectable in UI Lab; no production public route claim |

### Theme strategies

`amtech_light`, `brand`, `field_notebook`, `ledger`, `studio`, `editorial`, `midnight`, and `high_contrast`.

### Layout strategies

`conversation_workspace`, `focus`, `canvas`, `form_chat`, and `boundless`.

### Component-set strategies

`standard`, `compact`, `editorial`, `terminal`, and `form_forward`.

These dimensions are independent enough to support visually unrelated results. They are not assumed to form a valid unrestricted Cartesian product forever; registry metadata and compatibility checks may constrain combinations when real failures appear.

## Profile and onboarding integration

`OnboardingManifest` and `ProfilePackage` now accept an optional `ui_presentation` strategy hint. `buildProfileContext` serializes that hint into the existing profile context and also retains onboarding branding facts. Web can therefore resolve presentation from:

- business kind;
- profile package key;
- dominant work domains;
- branding facts such as primary/accent/background colors;
- an explicit generated presentation hint;
- a later user preference or custom employee override.

No new table or migration is introduced. A future settings UI may persist the same validated JSON shape in a dedicated preference store without changing adapter implementations.

## React and CSS implementation

`EmployeeUiPortHost` is a React context provider and presentation boundary. It:

1. resolves the port contract;
2. publishes adapter and strategy keys as data attributes;
3. supplies scoped CSS custom properties;
4. wraps the existing route component tree;
5. leaves the loaded employee payload unchanged.

CSS custom properties are the correct first mechanism for ordinary color, typography, radius, spacing, and surface changes because they inherit through the existing tree. Layout and component-set strategies use scoped selectors. A later adapter may swap complete React component registries when CSS is insufficient.

This is deliberately incremental. It avoids rewriting the current controller/data-loading components before the variation system proves useful.

## UI Lab role

UI Lab now exposes explicit selectors for:

- adapter;
- theme;
- layout;
- component set.

Scenario defaults demonstrate materially different combinations, including contractor, clothing operations, research, personal brain, and website-shaped employees. The same fixture payload remains installed while presentation changes.

Future browser coverage should use Playwright projects or parameterized cases across:

```text
adapter × scenario × theme × layout × component set × viewport
```

Pairwise coverage is appropriate for the broad visual matrix. Specific high-value combinations and accessibility behavior should remain explicit tests. Screenshot comparison should run in a controlled CI image because browser/OS rendering changes can create false diffs.

## Second-order effects

### Positive

- A normal owner can change colors without provisioning another employee.
- Onboarding can select a reasonable starting presentation without creating a one-off page fork.
- A custom employee can override a bad profile match with one bounded profile object.
- UI Lab can compare incompatible-looking designs using the same fixture state.
- Public form and boundless website work can reuse theme/layout registries without forcing those experiences to resemble the owner client.
- Custom client themes stop requiring edits throughout many component files.

### Costs

- The supported combination count grows multiplicatively.
- Hard-coded component CSS must gradually be translated to semantic variables or component variants.
- CSS-only variation eventually reaches a limit; extreme experiences require separate adapter component trees.
- Every registered adapter becomes a browser, accessibility, responsive, and loading-state test obligation.
- User-selected preferences eventually need versioned persistence and migration behavior.

## Third-order effects and controls

### Combinatorial test explosion

Do not execute every combination on every commit. Maintain:

- small smoke cases for each adapter;
- deterministic pairwise visual coverage;
- explicit golden combinations for commercial products;
- full accessibility and interaction tests for each adapter family;
- screenshot baselines only in a controlled environment.

### Bundle growth

When adapters acquire distinct component trees, load them through statically declared `next/dynamic` entries. Do not build a runtime path string importer. Next.js requires explicit import paths for reliable bundling and preloading.

### Styling collisions

The current inline component CSS is tolerated during migration. New adapter-specific styles must remain under `.employee-ui-port[data-ui-adapter=...]` or a CSS Module. Avoid adding new unscoped global selectors; Next.js App Router retains some global styles during navigation and conflicting route styles can accumulate.

### Hydration and determinism

The same presentation resolver must produce the same profile for the same inputs. Random theme selection and viewport-dependent server decisions are prohibited. Viewport adaptation belongs in CSS/container/media rules or client state after hydration.

### Accessibility drift

A visually successful theme is not automatically usable. Every built-in theme must eventually prove:

- visible focus;
- minimum target size;
- contrast for text and controls;
- reduced-motion behavior;
- keyboard operation;
- stable accessible names and landmarks.

Playwright ARIA snapshots are useful for detecting structural accessibility drift while screenshot tests detect visual drift.

### Registry sprawl

Do not create a new adapter for a color change, spacing change, card shape, or alternative ordering. Add an adapter only when the purposeful interaction changes enough to justify a different high-level client. Add a theme/layout/component strategy for ordinary presentation variation.

## Alternatives rejected

1. **One React page fork per employee type.** Fast initially, but fixes and responsive behavior diverge immediately.
2. **Theme-only CSS variables.** Handles branding but cannot support genuinely different information architecture or component trees.
3. **One universal schema-driven renderer.** Excessive abstraction for the current React code and likely to produce generic-looking interfaces.
4. **Treat every visual variant as an adapter.** Misuses ports-and-adapters terminology and creates registry noise.
5. **Install Storybook immediately.** Storybook is a credible isolated UI workshop, but UI Lab already owns fixture scenarios and Playwright integration; adding another framework now would duplicate infrastructure.
6. **Rewrite AgentSurface before establishing the port.** Too much regression risk. The wrapper establishes selection and testing seams first.

## Research basis

- Alistair Cockburn, *Hexagonal Architecture / Ports and Adapters* (2005): ports identify purposeful conversations; multiple technology-specific adapters may satisfy one port.
- Alistair Cockburn, *Component + Strategy generalizes Ports & Adapters* (2022): configurable strategies fit variation inside a component/environment better than multiplying adapters.
- React official documentation: Context provides one value to a component subtree and allows nested overrides.
- Next.js App Router documentation: layouts organize shared UI; route groups support different root layouts; CSS Modules scope component styles; explicit dynamic imports support code splitting.
- CSS custom properties specification/documentation: variables participate in the cascade and inherit through a subtree, making them suitable for scoped theme tokens.
- W3C Design Tokens Community Group Format Module 2025.10: typed design-token values, groups, aliases, and extension points support interoperable theme definitions.
- Playwright official documentation: projects parameterize the same tests across configurations; screenshot comparisons and ARIA snapshots cover visual and accessible structure.
- Zod official documentation: schema parsing and `safeParse` provide a bounded runtime contract for generated and user-supplied presentation hints.

## Proof obligations

- shared package build/typecheck;
- Web and Manager typecheck;
- `tests/unit/employee-ui-port.test.ts`;
- `tests/unit/ui-architecture-fitness.test.ts`;
- existing UI and profile-context suites;
- Next production build;
- UI Lab browser render for each adapter at desktop and mobile;
- screenshot metadata naming exact commit, adapter, strategies, scenario, and viewport.

Until those execute on the exact branch head, this ADR records source architecture only, not browser or production acceptance.

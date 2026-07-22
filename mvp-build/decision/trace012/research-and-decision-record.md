# Trace012 — UI Lab live workbench research and decision record

Task: `AMTECH-UI-LAB-001`  
Starting SHA: `b42ebc704534c85692810f73d2bb93af72b69ece`  
Status: implementation in progress

## Problem reconstructed from repository evidence

The repository already contains the important substrate:

- a real Next.js App Router Web application;
- production `LiveEmployeeOperatingShell` and `AgentSurface` components;
- deterministic fixture scenarios that reach the same production renderers;
- a guarded `/ui-lab` route;
- Playwright browser scripts and screenshot output;
- one employee UI port with adapter and presentation strategies;
- profile/onboarding presentation hints.

The missing product layer is not another renderer. It is a development workbench that makes the existing substrate practical for a collaborator:

1. start quickly;
2. update live while React/CSS is edited;
3. isolate the preview from workbench chrome;
4. view realistic desktop/tablet/mobile dimensions;
5. preserve named versions;
6. distinguish a temporary visual checkpoint from a reproducible approved design;
7. assign approved designs to profile selectors;
8. run repeatable validation before promotion;
9. give coding agents an exact onboarding path and script inventory.

## External research used

### Next.js development loop

Next.js documents Fast Refresh for JavaScript, TypeScript, and CSS and incremental/lazy compilation in development. The current repository is on Next 15, where `next dev --turbopack` is the explicit fast-development path. This invalidates the old assumption that the full project must be rebuilt after each visual edit.

Decision consequence: `ui:lab` runs the Web application in development mode with fixtures and Turbopack, while independent TypeScript watch processes retain type feedback.

### Storybook and component stories

Storybook documents stories as declarative component states, an isolated preview iframe, live controls, and saved story variants. Those ideas are useful, but Storybook's primary unit is a component story. AMTECH's required unit is a complete employee experience containing real route composition, Talk/Workspace switching, fixture runtime transitions, responsive behavior, and adapter strategies.

Decision consequence: copy the useful workbench patterns—isolated canvas, controls, named states, testable variants—inside the existing Next application. Do not install a second primary UI application now. Storybook may later be added for low-level component atoms if a concrete need appears.

### Playwright configuration and visual comparison

Playwright projects can run the same tests under multiple configurations and devices. Screenshot comparison is useful but sensitive to browser, OS, hardware, and rendering settings.

Decision consequence: maintain deterministic functional vectors on every change, capture exact-head screenshots with provenance, and reserve pixel-baseline enforcement for a controlled runner. Human review remains part of promotion.

### Browser file-system access

Browser file-system APIs require explicit permission and have uneven support. A browser-only save design would also separate versions from repository review and Git provenance.

Decision consequence: use a local Next route handler to perform bounded atomic repository writes, guarded by development mode, fixture mode, an explicit write flag, loopback host, and same-origin requests. The browser never receives arbitrary filesystem access.

## Candidate architectures

| ID | Candidate | Result | Reason |
|---|---|---|---|
| A | Production rebuild after every edit | Reject | High latency; duplicates work already solved by Next development mode. |
| B | Storybook as the primary UI Lab | Reject for now | Good component isolation, insufficient full-route and employee-runtime fidelity without substantial parallel wiring. |
| C | Browser-only controls with localStorage | Reject | Fast but not reviewable, portable, reproducible, assignable, or durable across collaborators. |
| D | Database-backed visual drafts | Reject for this layer | Adds service and migration complexity to source-owned React/CSS versions; weak Git coupling. |
| E | Git branches/commits only, no preset registry | Partial | Preserves code but does not name the adapter/theme/layout/profile selection or support assignment automation. |
| F | Direct preview inside workbench DOM | Partial | Reuses production components but allows workbench CSS/layout to contaminate viewport and screenshot results. |
| G | Next dev + isolated same-origin preview + Git-backed preset registry | Select | Highest combination of fidelity, iteration speed, reproducibility, bounded complexity, and existing-stack reuse. |

## Selected architecture

```text
npm run ui:lab
  ├─ build shared contracts once
  ├─ watch shared TypeScript output
  ├─ watch Web TypeScript diagnostics
  └─ next dev --turbopack with fixture + UI-Lab-write guards

/ui-lab/[scenario]
  └─ workbench shell
      ├─ scenario, adapter, theme, layout, component, density controls
      ├─ named preset/version browser
      ├─ viewport controls
      ├─ save-draft controls
      ├─ validation/provenance display
      └─ same-origin iframe
          └─ /ui-lab/preview/[scenario]
              └─ production AgentSurface + fixture runtime + EmployeeUiPortHost

ui-lab/presets/<preset-id>/vNNNN.json
  ├─ immutable checkpoint payload
  ├─ presentation strategies
  ├─ intended selectors
  ├─ scenario and viewport review metadata
  └─ Git provenance and dirty/reproducible status

ui-lab/assignments.json
  └─ approved preset reference per profile/business selector

scripts/ui-lab-registry.mjs
  ├─ list
  ├─ validate
  ├─ promote
  ├─ assign
  └─ generate runtime registry
```

## Checkpoint versus promotion

A draft checkpoint may be saved while source is dirty. It records:

- current commit;
- branch;
- dirty flag;
- changed paths;
- selected adapter and presentation strategies;
- scenario and intended employee targets.

It is useful for human comparison but is explicitly non-reproducible.

Promotion requires:

- a clean Git worktree before the command starts;
- a source preset that validates;
- current focused/unit/browser validation evidence supplied or generated by the promotion command;
- creation of a new immutable approved preset version tied to the clean commit;
- assignment updates and regenerated runtime registry.

This avoids the failure mode where a JSON control snapshot points to CSS or React code that was never committed.

## Port, adapter, strategy, preset, and assignment

- **Port:** stable employee UI conversation contract.
- **Adapter:** high-level Web experience such as `owner_web`, `public_form`, or `boundless_website`.
- **Strategy:** theme, layout, component set, density, and brand tokens inside an adapter.
- **Preset:** a named, versioned, source-provenanced adapter + strategy configuration intended for review and reuse.
- **Assignment:** a mapping from an approved preset to profile keys or business-kind selectors.

A preset is not a React component fork. A custom component implementation may be selected by a `custom:<slug>` registry key, but the code remains normal reviewed source.

## Validation dimensions

The selected design is evaluated across these independent dimensions:

1. edit-to-preview latency;
2. production component fidelity;
3. CSS isolation;
4. fixture/runtime-state coverage;
5. viewport fidelity;
6. accessibility and reduced motion;
7. preset schema validity;
8. version monotonicity and immutability;
9. Git provenance;
10. dirty-draft handling;
11. clean promotion enforcement;
12. assignment determinism;
13. runtime registry parity;
14. local write-route confinement;
15. production-like fixture denial;
16. no database/runtime dependency growth;
17. bundle/build compatibility;
18. agent discoverability;
19. documentation consistency;
20. human visual review.

The machine-readable pass/fail vectors live in `validation-vectors.json`.

## Second-order effects

### Positive

- UI work stops competing with full production builds for every edit.
- A collaborator can explore radically different employee visuals against identical fixture data.
- Human feedback can refer to stable preset IDs and versions instead of screenshots alone.
- Approved presets become reusable product assets rather than one-off code branches.
- Profile generation gains a governed override path when heuristic matching is wrong.
- Browser validation becomes naturally parameterized by preset and viewport.

### Costs and controls

- **Preset count grows.** Use immutable versions, explicit status, tags, and deprecation rather than deleting history.
- **Visual matrix grows multiplicatively.** Use smoke coverage for every approved preset, pairwise exploration for broad combinations, and explicit golden vectors for commercial presets.
- **Custom registries can increase bundle size.** Use static registry imports and lazy-load only when real component forks appear.
- **Drafts can become stale.** Surface dirty/non-reproducible provenance and disallow assignment.
- **Local write endpoints are dangerous.** Require development + fixture + explicit write flag + loopback + same-origin, write only validated JSON under one root, and use atomic create-without-overwrite.
- **Heuristic profile matching can conflict with approved assignment.** Approved assignment precedes heuristics; explicit user/profile override remains highest priority.

## Third-order effects

- Presets become a lightweight product-line mechanism. That is useful, but they must not evolve into an unrestricted low-code platform without evidence.
- Human visual approval becomes a durable release input. The system should later retain reviewer, date, screenshot digest, and validation run, but it should not falsely automate aesthetic judgment.
- Design work becomes more parallelizable. This increases merge conflicts in shared CSS/component registries, so custom variants should use scoped modules and bounded registry entries.
- Stable preset references allow experiments and customer-specific branding, which creates future lifecycle obligations: migration, deprecation, fallback, and support policy.
- Because UI Lab uses production components, defects found there are more likely to be real, but fixture truth still cannot establish live provider, authorization, or deployment behavior.

## Promotion rule

A preset may be assigned to an employee selector only when all are true:

```text
schema valid
AND immutable version path valid
AND source commit recorded
AND source worktree was clean
AND runtime registry generation is deterministic
AND focused UI contracts pass
AND workbench browser smoke passes
AND human reviewer deliberately selects it
```

Pixel perfection is not inferred from a green test suite.

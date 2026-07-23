# Trace012 — UI Lab live workbench research and decision record

Task: `AMTECH-UI-LAB-001`  
Starting SHA: `b42ebc704534c85692810f73d2bb93af72b69ece`  
Status: **completed implementation decision; historical exact-candidate source/build/release verification exists; headed supported-browser and human visual/accessibility review remain open**  
Reconciled: 2026-07-23  
Self-state: [`task_state.json`](task_state.json); current repository status: [`../../CODEGRAPH.md`](../../CODEGRAPH.md)

This trace records the UI Lab and source-owned preset decision. The folder-first full UI-variant extension is recorded in [`folder-first-ui-variant-extension.md`](folder-first-ui-variant-extension.md). It is the latest completed trace, not an open planning transaction. Trace013 is reserved for a fresh post-merge branch.

## Problem reconstructed from repository evidence

The repository already contained:

- a real Next.js App Router Web application;
- production `LiveEmployeeOperatingShell` and `AgentSurface` components;
- deterministic fixture scenarios that reach production renderers;
- a guarded `/ui-lab` route;
- Playwright browser scripts and screenshot output;
- one employee UI port with adapter and presentation strategies;
- profile/onboarding presentation hints.

The missing product layer was not another renderer. It was a practical, reproducible development workbench that could:

1. start quickly;
2. update live while React/CSS changes;
3. isolate preview rendering from workbench chrome;
4. exercise desktop/tablet/mobile dimensions;
5. preserve named versions and Git provenance;
6. separate temporary visual checkpoints from reproducible approved designs;
7. assign approved designs to profile selectors;
8. run repeatable validation before promotion;
9. give coding agents one exact onboarding path and bounded write scope.

## Research conclusions

### Next.js development loop

Next development mode provides Fast Refresh for JavaScript, TypeScript, and CSS and incrementally compiles routes. The repository already uses Next 15 and can use `next dev --turbopack` for the visual edit loop.

Decision consequence: the UI Lab uses the development server and independent TypeScript watchers. It does not perform a full production rebuild after each visual edit.

### Storybook and component stories

Storybook’s isolated canvas, controls, named states, and testable variants are useful patterns. Its primary unit is a component story, while AMTECH’s required unit is a complete employee experience with route composition, Talk/Workspace state, runtime transitions, responsive behavior, adapters, and production contracts.

Decision consequence: reuse the workbench patterns inside the existing Next application. Do not create a second primary UI application. Storybook remains a future option for low-level atoms only when a concrete need justifies the parallel surface.

### Playwright, devices, and visual comparison

Playwright projects can exercise the same behavior under different browsers and devices. Pixel comparison is sensitive to browser, OS, fonts, hardware, and rendering configuration.

Decision consequence: deterministic functional vectors and exact-head screenshots are useful evidence, but pixel baselines require a controlled runner and human review remains part of promotion. Automated browser checks do not establish aesthetic quality or full accessibility.

### Browser file-system access

Browser file-system APIs require explicit permission and vary by browser. Browser-only state would also separate presets from Git review and reproducibility.

Decision consequence: bounded repository writes use a local Next route handler guarded by development mode, fixture mode, an explicit write flag, loopback host, same-origin requests, validated paths, and atomic create-without-overwrite. The browser never receives arbitrary filesystem authority.

### Agent-first collaboration

Claude Code, Codex, Cursor, and similar agents can inspect the actual machine and repository rather than relying on a brittle OS-specific installer. Repeated sessions should not reinstall dependencies or browsers when the desired state already exists.

Decision consequence: `ui-lab/README.md` is the canonical agent entry point. The agent inspects the environment, preserves the working tree, establishes the required end state, uses `--agent none` when already controlling the session, and works inside the selected variant folder.

## Candidate architectures

| ID | Candidate | Result | Reason |
|---|---|---|---|
| A | Production rebuild after every edit | Reject | High latency and duplicates development-mode compilation. |
| B | Storybook as the primary UI Lab | Reject for now | Good component isolation, insufficient full-route/runtime fidelity without parallel wiring. |
| C | Browser-only controls with localStorage | Reject | Not reviewable, portable, reproducible, assignable, or durable across collaborators. |
| D | Database-backed visual drafts | Reject for this layer | Adds service/migration complexity to source-owned React/CSS versions. |
| E | Git branches/commits only | Partial | Preserves code but lacks named presentation configuration and assignment semantics. |
| F | Direct preview inside workbench DOM | Partial | Allows workbench layout/CSS to contaminate viewport and screenshot results. |
| G | Next dev + isolated same-origin preview + Git-backed preset registry | Select | Best reuse, fidelity, speed, reproducibility, and bounded complexity. |

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
      └─ same-origin isolated preview

ui-lab/presets/<preset-id>/vNNNN.json
  ├─ immutable checkpoint payload
  ├─ presentation strategies
  ├─ intended selectors
  ├─ scenario and viewport review metadata
  └─ Git provenance and reproducibility status

ui-lab/assignments.json
  └─ approved preset reference per profile/business selector
```

The later folder-first extension adds:

```text
apps/web/ui-variants/<variant-slug>/
→ neutral EmployeeExperienceModelV1
→ generated literal lazy registry
→ bounded host and intent bridge
→ folder-local agent instructions
→ deterministic doctor and fixture routes
```

## Checkpoint versus promotion

A draft checkpoint may be saved while source is dirty. It records current commit, branch, dirty flag, changed paths, selected adapter/strategies, scenario, and intended targets. It is useful for review but is explicitly non-reproducible and cannot be assigned.

Promotion requires:

```text
clean worktree before command
AND valid source preset
AND focused/unit/browser validation evidence
AND new immutable approved version tied to the clean commit
AND deterministic assignment and runtime-registry update
AND deliberate human selection
```

This prevents a JSON control snapshot from pointing to uncommitted CSS or React code.

## Port, adapter, strategy, preset, assignment, and variant

- **Port:** stable purposeful employee UI contract.
- **Adapter:** high-level Web experience such as `owner_web`, `public_form`, or `boundless_website`.
- **Strategy:** theme, layout, component set, density, and brand tokens inside an adapter.
- **Preset:** named, versioned, source-provenanced adapter + strategy configuration.
- **Assignment:** mapping from an approved preset to profile/business selectors.
- **Full UI variant:** independent React/CSS employee experience behind the neutral capability contract, with the production client available only as an optional reference slot.

A preset is not a React component fork. A full variant is not required to preserve production visual or structural grammar.

## Validation dimensions

The selected design is evaluated across independent dimensions:

- edit-to-preview latency and production component fidelity;
- CSS/preview isolation and runtime-state coverage;
- viewport behavior and reduced motion;
- preset schema, version monotonicity, immutability, and Git provenance;
- dirty-draft handling and clean promotion;
- assignment determinism and generated-registry parity;
- local write-route confinement and production-like denial;
- no database/runtime dependency growth;
- bundle/build compatibility and agent discoverability;
- variant import/network/storage/dependency containment;
- supported-browser behavior, manual accessibility, and human visual review.

Machine-readable vectors live in `validation-vectors.json`. A green vector is evidence only for the boundary it executes.

## Second-order effects

Positive:

- UI work no longer competes with full production builds for every edit.
- Collaborators can compare radically different experiences against identical employee truth.
- Feedback can reference stable preset/variant IDs rather than screenshots alone.
- Approved presets become reusable product assets.
- Browser validation becomes parameterized by scenario, presentation, variant, and viewport.
- Agent context and write scope become smaller and more deterministic.

Costs and controls:

- Preset and variant counts grow; use immutable versions, explicit status, tags, and deprecation.
- The visual matrix grows multiplicatively; use smoke coverage for every approved surface, pairwise exploration, and explicit commercial golden vectors.
- Custom registries can increase bundle size; keep static discovery and introduce lazy loading only where measured.
- Drafts become stale; surface dirty/non-reproducible provenance and disallow assignment.
- Local write endpoints are dangerous; retain development + fixture + explicit flag + loopback + same-origin + bounded-path + atomic-write guards.
- Parallel design work can conflict in shared registries; prefer folder-scoped modules and generated registries.

## Third-order effects

- Presets and variants form a governed product-line mechanism, creating lifecycle obligations for migration, deprecation, fallback, support, and customer-specific branding.
- Human visual approval becomes a durable release input but must not be falsely automated.
- Stable presentation references enable experiments; experiment outcomes must remain separate from authority and acceptance.
- Production-component reuse increases real defect yield, but fixture truth still cannot establish live provider, authorization, channel, target-host, or production behavior.
- Agent-first onboarding lowers setup friction while increasing the need for explicit machine routers, local authority boundaries, and anti-drift tests.

## Final evidence boundary

Historical exact candidate `86ed155643530b5dc75ff31287fd547da211e630` passed merge and release-candidate workflows, including source/UI, PostgreSQL integration, production build, five image builds, image identity, and independent signed-manifest verification.

That result is historical. It does not certify later documentation or merge descendants and does not establish headed supported-browser coverage, human visual approval, manual accessibility, managed database, live provider, target host, pilot, deployment, or production.

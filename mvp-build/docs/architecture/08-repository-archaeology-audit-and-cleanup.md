# 08 — Repository Archaeology Audit and Cleanup

Status: **[VERIFIED] tracked-object exhaustion instrument and source-confirmed findings; [UNVERIFIED] mechanical candidate ledgers until intent review**

## Exhaustive traversal mechanism

[VERIFIED] `scripts/repository-archaeology-v2.mjs` reads the repository through the Git object database rather than through the checked-out filesystem.

It uses:

- `git ls-files --stage -z` to enumerate every tracked stage-0 entry;
- `git cat-file blob <sha>` to read the exact committed bytes of every regular tracked object;
- explicit Gitlink handling for mode `160000`;
- byte count, Git object ID, SHA-256, extension, text/binary classification, line count, category, declared-purpose extraction, import/export/env/effect extraction, document-reference extraction, and primitive classification;
- exact-head branch checkout in `.github/workflows/repository-archaeology.yml` rather than GitHub's synthetic pull-request merge commit.

[VERIFIED] The CI artifact contains:

- `repository-archaeology.json` — complete machine-readable bundle;
- `file-primitives.jsonl` — one FORMAT-A-compatible record for every tracked entry;
- `relationship-map.json` — import/document-reference edges and orphan candidates;
- `effect-graph.json` — filesystem, database, network, process, event, secret, and cryptographic signals;
- `defect-audit.json` — DEF-001..004 mechanical candidates;
- `README.md` — exact-SHA exhaustion ledger and interaction summary;
- `archaeology-run.log` — execution summary or failure diagnostics.

[VERIFIED] The first complete run read more than one thousand tracked entries and more than eight megabytes of tracked repository data. [VERIFIED] The workflow reruns on every branch push and PR head, so final counts belong to the final exact-head artifact rather than this narrative.

## Exhaustion checklist

The generated artifact asserts and computes:

- [x] root directory listing enumerated;
- [x] every root entry read or marked binary/Gitlink;
- [x] every tracked subdirectory explored to leaf entries;
- [x] every tracked Markdown/MDX blob read;
- [x] every tracked config/manifest blob read;
- [x] every tracked source blob read or marked binary;
- [x] every tracked test blob read;
- [x] every tracked build/deploy/tooling blob read;
- [x] imports extracted for every source blob;
- [x] DEF-001..004 detectors executed against applicable entries.

[VERIFIED] This checklist proves byte-level traversal and detector execution. [UNVERIFIED] It does not prove every regex-derived import, effect, documentation reference, or orphan candidate expresses author intent.

## FORMAT-A file primitive

Every JSONL row contains:

```text
FILE-####: relative/path
SIZE: bytes
MODE / OBJECT SHA / SHA-256
TYPE: extension and category
TAG: [VERIFIED] or [BINARY]
DECLARED PURPOSE
ACTUAL BEHAVIOR SUMMARY
PRIMITIVES: READ / WRITE / EXEC / TRANSFORM / DECLARE / ORCHESTRATE / VERIFY
SIDE EFFECT SIGNALS
IMPORTS / EXPORTS / ENV READS
INBOUND MECHANICAL EDGES
DEFECT MAP
```

[VERIFIED] Binary and Gitlink rows carry byte size/object identity and extension or Gitlink inference rather than fabricated content claims.

## Mechanical detector limits

[VERIFIED] The raw detector intentionally maximizes recall. It can over-count:

- API routes and shell fragments that look like repository paths;
- historical memory references to removed files;
- TypeScript imports written with emitted `.js` suffixes;
- Python standard-library imports;
- generated production source that is created before build;
- scripts invoked through `package.json`, CI, shell, dynamic import, directory convention, or runtime discovery;
- effect-bearing files documented by subsystem rather than by exact path link.

Therefore:

- [VERIFIED] byte counts, object IDs, hashes, literal imports, literal env reads, and literal reference matches are source-derived;
- [UNVERIFIED] DEF-001..004 candidate classification remains advisory until source-level intent and runtime registration are checked;
- [VERIFIED] no file is deleted solely because the mechanical orphan detector reports zero inbound edges.

## Source-confirmed cleanup performed

### CLEANUP-001 — Python bytecode

- File: `packages/agent-template/plugins/amtech-hygiene/__pycache__/__init__.cpython-314.pyc`
- Tag: [VERIFIED]
- Primitive: binary generated Python cache artifact.
- Relationship: no source authority; reproducible from Python execution.
- Action: removed from Git.
- Prevention: `.gitignore` now excludes `__pycache__/` and `*.py[cod]`.
- Defect: DEF-004.

### CLEANUP-002 — orphaned worktree Gitlink

- Entry: `worktrees/ui-redesign-docs-packet`
- Tag: [VERIFIED]
- Primitive: Gitlink to an external commit, not an embedded directory.
- Relationship: retained repository worktree pointer, not a production dependency or documented runtime component.
- Action: removed through the Git tree API.
- Defect: DEF-004.

### CLEANUP-003 — superseded scanner

- File: `scripts/repository-archaeology.mjs`
- Tag: [VERIFIED]
- Primitive: initial filesystem scanner.
- Relationship: failed on directory-valued Gitlink entries and was replaced by Git-object traversal.
- Action: removed after `repository-archaeology-v2.mjs` became the sole workflow entrypoint.
- Defect: DEF-004 and W₁ one-authority prevention.

### CLEANUP-004 — generated archaeology output

- Path: `mvp-build/.artifacts/`
- Tag: [VERIFIED]
- Primitive: CI/local generated evidence bundle.
- Action: excluded from Git; retained as exact-SHA workflow artifact.
- Defect prevented: DEF-004 generated-output accumulation.

## Source-confirmed documentation defects

### DEF-001 — stale references and state claims

1. [VERIFIED] `docs/ux/04-implementation-coverage-audit.md` still states that generated UI has a legacy dark-mode/blue-action divergence and that browser proof uses `next dev`; both were closed by later branch changes.
2. [VERIFIED] `mvp-build/README.md` contains an earlier remediation checkpoint and does not point to the new architecture live map.
3. [VERIFIED] `mvp-build/CODEGRAPH.md` is a chronological lane/checkpoint map and does not by itself describe current cross-plane runtime topology.
4. [VERIFIED] historical memory/wiki references remain useful chronology but cannot be read as final exact-head state.

Control: update UX audit, README, CODEGRAPH live-map header, and PR state after final exact-head CI.

### DEF-002 — implicit dependencies

1. [VERIFIED] Production employee Caddy snippets targeted `localhost:<employee-port>` while Caddy originally ran in a separate bridge namespace; the required host-network relationship was not declared.
2. [VERIFIED] Production profiles targeted `amtech-model-gateway` and Manager reached `amtech-hermes-<id>`, but the launcher did not attach Manager and Model Gateway to each employee bridge.
3. [VERIFIED] Runtime teardown attempted to remove employee networks without first detaching the shared control peers after the topology correction.

Control implemented: host-network Caddy; explicit scoped peer attachment/aliases; explicit peer detachment before network removal; source contracts.

### DEF-003 — undocumented or silently represented effects

1. [VERIFIED] Manager MCP resource reads used the non-strict snapshot builder, allowing database faults to appear as empty resource state.
2. [VERIFIED] Business-brain employee/manifest/profile/fact/count queries discarded or failed to inspect database errors.
3. [VERIFIED] Owner operating-surface auxiliary reads used the normal client after the strict primary snapshot.
4. [VERIFIED] Model Gateway cumulative spend is not enforced against prior/in-flight usage.
5. [VERIFIED] Model Gateway rate state is process-local.
6. [VERIFIED] provider timeout retry can duplicate cost when upstream acceptance is ambiguous.

Controls implemented for 1–3: strict MCP snapshot, fail-closed business-brain queries, strict operating-surface client, mandatory tests.

Controls required for 4–6: database-backed reservation/settlement budget and rate ledger; provider idempotency where available; ambiguity/repair policy where unavailable.

### DEF-004 — orphaned artifacts

[VERIFIED] The bytecode, Gitlink, and superseded scanner were removed. [UNVERIFIED] Remaining mechanical orphan candidates are retained until dynamic registration, CLI/workflow invocation, generated-file convention, and historical evidence purpose are reviewed.

## Relationship map

### RELMAP-001 — repository hubs

[VERIFIED] High-connectivity conceptual hubs include:

- shared contracts in `packages/shared/src`;
- database migrations and generated types in `packages/db`;
- generated production Manager server and route registrars;
- `employee-stream.ts` / `employee-stream-strict.ts`;
- `run-tool.ts`, tool registry, and tool implementations;
- provisioning reconciler/profile renderer/provisioner boundary;
- event ingress/ambient inbox/employee events;
- `operating-surface.ts`, materialization, and UI-resource compiler;
- Web `AgentSurface.tsx` and API proxy routes;
- integrated CI and acceptance workflows.

[VERIFIED] No single Markdown file is executable authority. Documentation links these hubs; source and migrations establish behavior.

### RELMAP-002 — generated-source edge

```text
apps/manager/scripts/generate-production-server.mjs
  → apps/manager/src/server.generated.ts (ignored generated file)
  → Manager typecheck/build/image inclusion
  → production container command
```

[VERIFIED] The generated file is an intentional untracked transform, not a missing source artifact.

## Effect graph coverage

The archaeology detector records first-class signals for:

- filesystem reads/writes;
- database reads/writes and schema mutation;
- outbound network calls and inbound listeners/routes;
- process/container spawns;
- event publish/consume paths;
- runtime secret/environment access;
- hashing/signing/encryption/verification.

[INFERRED] This graph is most useful as a review queue sorted by files that combine multiple effect classes and low documentation/reference coverage. [UNVERIFIED] It is not a semantic call graph and cannot prove an effect executes on every path.

## Commercial documentation value

| Interaction | Coverage basis | Coefficient | Asset value |
|---|---:|---:|---:|
| source × build × env | every tracked blob read; runtime docs added | 2.0 EMERGENT | highest: deployment/recovery knowledge |
| source × tests | every tracked blob read; CI gates mapped | 1.2 FEEDBACK | high: release confidence |
| source × docs | every tracked blob read; live map added | 1.5 TRANSFORM | high: onboarding/operator leverage |
| data/schema × source | migration and query/effect maps | 1.0 PARALLEL | high: authority and incident response |
| build × secrets | config/env extraction plus deployment map | 0.5 GATE | low until managed deployment proof |

## Reproduction

```bash
cd mvp-build
node scripts/repository-archaeology-v2.mjs
```

The default output path is ignored by Git. CI uploads the exact-head artifact for 30 days under `repository-archaeology-<sha>`.

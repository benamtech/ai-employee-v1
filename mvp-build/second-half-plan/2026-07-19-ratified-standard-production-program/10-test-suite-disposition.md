# Test Suite Disposition

Status: **active test-authority map; WS-01 normalized**  
Baseline: `main@816aae325401a8d8d4bc7ffe90e8f241eb977ba8`  
WS-01 implementation evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`

A suite is evidence only for the boundary it actually exercises. Broad-unit, curated source contracts, fixture browser proof, database proof, and live provider/runtime acceptance remain distinct evidence classes.

## Classification

| Suite / harness | Classification | Current authority and use | Required action |
|---|---|---|---|
| `npm run test:standard` | current and authoritative | Ratified Standard syntax/vector, connector registry/setup, capability binding, owner setup contracts | Preserve; extend only when normative/manifest behavior changes |
| `npm run test:s10-onboarding` | current and authoritative | Identity/onboarding source contract | Preserve; add fixture-free acceptance separately |
| `npm run test:lane1-scope` | current and authoritative | Assignment and authorization scope contracts | Preserve; any failure is presumed a source defect until stale expectation is proven |
| `npm run test:lane10-evidence` | current and authoritative | Release-evidence contract shape | Preserve; does not replace signed deployed evidence |
| `npm run test:production-boundary` | current and authoritative for named source/unit contracts | Model/profile isolation, provider-authority lock, provisioner idempotency, ambient inbox, topology source, strict stream, workbench and local-production contracts | Preserve; add database/host/provider fault evidence outside this suite |
| `npm run test:ui:contracts` | current and authoritative for typed/fixture UI contracts | UI resources, fixture guard, event projection, operating snapshot | Preserve; not fixture-free browser/channel acceptance |
| `npm run repo:verify:quick` | current and authoritative for repository governance | Standard, active-plan, connector, onboarding, and governance checks | Preserve |
| `npm run repo:verify:full` | current and authoritative for source hygiene | Quick gate plus ordered typecheck and lint | Preserve; remains pre-push source gate |
| `npm run build` | current and authoritative for compilability | Production workspace build | Preserve; no runtime acceptance implied |
| `npm run test:unit` | current and authoritative broad regression | Builds shared/database workspace dependencies, generates production source, and runs every surviving unit/source contract | Preserve as an independent Main Integration job with retained diagnostics |
| `Main Integration Gates` | current canonical merge gate | Governance, type/lint, named authority/production/UI contracts, broad unit, build, archaeology, and compiled Chromium fixture matrices | Preserve; broad and curated results remain separately reported |
| `npm run test:integration` | useful but incomplete / environment-gated | PostgreSQL and environment-dependent behavior selected by config | Expand to the full DTEP matrices; report skipped/blocked explicitly |
| `npm run test:worker-migrations` and `db:verify:worker-migrations` | current but incomplete | Blank-ledger/worker migration evidence | Preserve and expand through new forward migrations, existing rows, rollback, hashes |
| `local:acceptance:*` and `local:acceptance` | useful but incomplete | Local production-shaped orchestration | Keep as developer proof; never promote to target-host/provider acceptance |
| `ui:test`, `ui:test:shell`, compiled fixture Web | current regression, fixture-bound | Deterministic Chromium UI behavior | Preserve; add Firefox/WebKit, accessibility, and fixture-free candidate proof |
| `acceptance:golden:*` | useful but incomplete until real dependencies are present | Golden role journey harnesses | Execute only after protocol/database/runtime/commercial prerequisites; retain real provider/effect/proof IDs |
| `prod:boundary:*` live scripts | useful but blocked until environment exists | Migration, gateway, rotation, recovery, ambient, onboarding, work-object, and isolation release boundaries | Run on exact target candidate; missing environment is `blocked`, not pass |
| `deploy:smoke`, `deploy:rollback`, backup/restore, health/repair ops | useful but incomplete | Operational and recovery scaffolding | Convert into signed exact-candidate release evidence with fault injection |
| `capacity:pod-alpha` and future load harnesses | useful but incomplete | Capacity entry point | Add declared envelopes, fairness, cost, recovery, and stepwise 1/10/100/250/500/700 evidence |
| public-estimator smoke/harness | non-canonical but usable in narrow scope | Acquisition/regression harness only | Keep isolated; cannot satisfy AI Employee product, commercial, or live acceptance |

## WS-01 normalization result

The first canonical broad run exposed two layers:

1. 63 loader failures caused by running source tests before building `@amtech/shared` and `@amtech/db`; the aggregate now builds both dependencies first.
2. 27 pre-ratification suites asserting superseded account-owned, unassigned, direct-provider, or obsolete webhook/preview/runtime contracts.

The obsolete suites were removed atomically rather than skipped. Their current invariants remain covered by assignment enforcement, approval authority, artifact workbench, signed links, ambient inbox/event adapters, strict employee stream, model-profile isolation, provisioner idempotency, production topology, command/effect, connector-commercial, and owner-turn contracts. Three reusable source-contract assertions were corrected to the current fixed capability allowlist, full employee topology check, and managed-connector descriptor.

On implementation evidence head `1460960f415fafc20582313b1dd2117b781a63f7`:

- **106 test files passed**;
- **613 tests passed**;
- no test file was excluded or quarantined;
- diagnostics were retained by Main Integration run `29725298163`.

## Overlap and duplicate-count policy

Some tests intentionally appear in more than one named gate. For example, `web-operating-snapshot-contract.test.ts` protects both presentation honesty and the Manager/Web protocol boundary. This overlap is acceptable, but pass counts must not be added together as if they were unique coverage.

The same rule applies to generated-source, typecheck, build, and fixture browser steps repeated across workflows. Report the candidate, workflow, suite, unique tests when known, failures, skips, and environment.

## Flakiness policy

No suite is classified as proven flaky. Browser, provider, target-host, timing, and capacity harnesses are flakiness risks, not proven flaky tests. Before labeling a test flaky:

1. repeat the exact candidate/environment;
2. retain logs, seed, timing, host/provider identifiers, and artifacts;
3. distinguish nondeterministic product behavior from harness defects;
4. fix the invariant or harness rather than adding blind retries;
5. quarantine only with an owner, expiry, and replacement gate.

## Unusable and blocked evidence

A harness is unusable only when it cannot exercise its claimed boundary even with declared prerequisites. Missing secrets, target host, provider sandbox, disposable database, or browser runtime makes a release harness `blocked`. It remains visible and cannot be omitted to obtain green.

## WS-01 completion checklist

- [x] every broad failure was classified as loader defect, obsolete contract, or reusable current assertion;
- [x] loader order was repaired without changing product expectations;
- [x] obsolete suites were deleted rather than hidden by exclusions;
- [x] reusable assertions were corrected to current source contracts;
- [x] broad aggregate passed 106 files / 613 tests on the implementation evidence head;
- [x] curated and broad results are independently reported;
- [x] no fixture or source suite claims a live boundary it did not exercise;
- [ ] final documentation-head workflows and PR evidence are recorded after branch movement stops.

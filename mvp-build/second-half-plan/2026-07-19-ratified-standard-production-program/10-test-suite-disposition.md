# Test Suite Disposition

Status: **active test-authority map**  
Baseline: `main@5e5b8d7` with final cutover head `d131dd09`

A suite is evidence only for the boundary it actually exercises. Curated green suites do not imply the broad aggregate is green, fixture browser proof does not imply fixture-free acceptance, and an environment-gated skip is neither failure nor pass.

## Classification

| Suite / harness | Classification | Current authority and use | Required action |
|---|---|---|---|
| `npm run test:standard` | current and authoritative | Ratified Standard syntax/vector, connector registry/setup, capability binding, owner setup contracts | Preserve; extend only when normative/manifest behavior changes |
| `npm run test:s10-onboarding` | current and authoritative | Identity/onboarding source contract | Preserve; add fixture-free acceptance separately |
| `npm run test:lane1-scope` | current and authoritative | Assignment and authorization scope contracts | Preserve; any failure is presumed a source defect until stale expectation is proven |
| `npm run test:lane10-evidence` | current and authoritative | Release-evidence contract shape | Preserve; does not replace signed deployed evidence |
| `npm run test:production-boundary` | current and authoritative for named source/unit contracts | Model/profile isolation, provisioner idempotency, ambient inbox, topology source, strict stream, workbench and local-production contracts | Preserve; add database/host/provider fault evidence outside this suite |
| `npm run test:ui:contracts` | current and authoritative for typed/fixture UI contracts | UI resources, fixture guard, event projection, operating snapshot | Preserve; not fixture-free browser/channel acceptance |
| `npm run repo:verify:quick` | current and authoritative for repository governance | Standard, active-plan, connector, onboarding, and governance checks | Preserve; update routing assertions for post-merge main |
| `npm run repo:verify:full` | current and authoritative for source hygiene | Quick gate plus ordered typecheck and lint | Preserve; remains pre-push source gate |
| `npm run build` | current and authoritative for compilability | Production workspace build | Preserve; no runtime acceptance implied |
| `Main Integration Gates` | current curated merge gate | Governance, ordered type/lint, named authority/production/UI contracts, build, archaeology, compiled Chromium fixture matrices | Preserve; add broad aggregate only after WS-01 normalization proves it trustworthy |
| `npm run test:unit` | stale/migrating and currently red | Broad historical Vitest aggregate; PR #23 records 30 files and 112 failures from pre-ratification assignment/principal/fake-RPC/environment fixtures | WS-01 must classify every failure, repair stale fixtures, and expose real source defects; no weakening for green |
| `npm run test:integration` | useful but incomplete / environment-gated | PostgreSQL and environment-dependent behavior selected by config | Expand to the full DTEP matrices; report skipped/blocked explicitly |
| `npm run test:worker-migrations` and `db:verify:worker-migrations` | current but incomplete | Blank-ledger/worker migration evidence | Preserve and expand through new forward migrations, existing rows, rollback, hashes |
| `local:acceptance:*` and `local:acceptance` | useful but incomplete | Local production-shaped orchestration | Keep as developer proof; never promote to target-host/provider acceptance |
| `ui:test`, `ui:test:shell`, compiled fixture Web | current regression, fixture-bound | Deterministic Chromium UI behavior | Preserve; add Firefox/WebKit, accessibility, and fixture-free candidate proof |
| `acceptance:golden:*` | useful but incomplete until real dependencies are present | Golden role journey harnesses | Execute only after WS-02 through WS-07 prerequisites; retain real provider/effect/proof IDs |
| `prod:boundary:*` live scripts | useful but blocked until environment exists | Migration, gateway, rotation, recovery, ambient, onboarding, work-object, and isolation release boundaries | Run on exact target candidate; missing environment is `blocked`, not pass |
| `deploy:smoke`, `deploy:rollback`, backup/restore, health/repair ops | useful but incomplete | Operational and recovery scaffolding | Convert into signed exact-candidate release evidence with fault injection |
| `capacity:pod-alpha` and future load harnesses | useful but incomplete | Capacity entry point | Add declared envelopes, fairness, cost, recovery, and stepwise 1/10/100/250/500/700 evidence |
| public-estimator smoke/harness | non-canonical but usable in narrow scope | Acquisition/regression harness only | Keep isolated; cannot satisfy AI Employee product, commercial, or live acceptance |

## Overlap and duplicate-count policy

Some tests intentionally appear in more than one named gate. For example, `web-operating-snapshot-contract.test.ts` is included in both UI-contract and production-boundary suites because it protects both presentation honesty and the Manager/Web protocol boundary. This overlap is acceptable, but pass counts must not be added together as if they were unique coverage.

The same rule applies to generated-source, typecheck, build, and fixture browser steps repeated across workflows. Report the candidate, workflow, suite, unique tests when known, failures, skips, and environment. Do not report an inflated repository-wide total.

## Flakiness policy

No suite is currently classified as proven flaky from repository evidence. Browser, provider, target-host, timing, and capacity harnesses are **flakiness risks**, not proven flaky tests. Before labeling a test flaky:

1. repeat the exact candidate/environment;
2. retain logs, seed, timing, host/provider identifiers, and artifacts;
3. distinguish nondeterministic product behavior from harness defects;
4. fix the invariant or harness rather than adding blind retries;
5. quarantine only with an owner, expiry, and replacement gate.

## Unusable and blocked evidence

A harness is unusable only when it cannot exercise its claimed boundary even with the declared prerequisites. Missing secrets, target host, provider sandbox, disposable database, or browser runtime makes a release harness `blocked`. It must remain visible in the evidence packet and cannot be omitted to obtain green.

## WS-01 completion checklist

- [ ] every current `test:unit` failure is mapped to current source defect, stale fixture, duplicate contract, environment contract, or invalid/unusable test;
- [ ] stale fixtures are repaired without weakening the intended invariant;
- [ ] real defects receive source fixes and focused regression tests;
- [ ] broad aggregate is green on the final candidate;
- [ ] curated and broad results are reported separately;
- [ ] no suite or fixture claims a live boundary it did not exercise;
- [ ] final exact-head workflows and artifacts are recorded after branch movement stops.

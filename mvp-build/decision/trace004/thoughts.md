# trace004 public computation ledger

Status: computed and committed before product or canonical-document edits  
Starting main SHA: `48b917389ed85b9652eca43a8e4a8f60b52e917b`  
Newer stacked authority incorporated: PR #33 merge `943f2613243ebcbcc9fb703e6273e83a5edc0a24`  
Task branch: `agent/ws05-ws06-owner-runtime`

This ledger records public matrices, descriptors, scores, evidence references, selections, rejections, and updates. It does not contain private chain-of-thought.

## Separate spaces

- Basis state matrix: `B_108 = W_2 x L_9 x H_6`, with `W_2={WS05,WS06}`, nine lenses, and six horizons.
- Candidate matrix rows are the 64 normalized `r_i in R^14` vectors in `search_space.json`.
- Rollout tensor is `16 x 6 x 12`; it yields 80 transitions in `rollout_ensemble.json`.
- The spaces are encoded separately and never concatenate dimensions.

## Scoring matrices

`r` column order: `N, Adj, CrossLens, UserValue, FeatureYield, FutureBug, ArchLeverage, EvidenceGain, Testability, Reversibility, -Risk, -Scope, -Cost, -Unverifiable`.  
`w` row: `N=0.85, Adj=0.7, CrossLens=1.05, UserValue=1.35, FeatureYield=0.9, FutureBug=0.75, ArchLeverage=1.2, EvidenceGain=1.15, Testability=1.1, Reversibility=0.8, -Risk=1.15, -Scope=0.95, -Cost=0.7, -Unverifiable=1.25`.  
Selection coefficients: `{'alpha': 1.8, 'beta': 0.65, 'gamma': 0.55, 'delta': 1.15, 'eta': 0.85}`; RBF sigma `1.85`; novelty k `5`.

Hypergraph incidence is represented by 18 weighted edges across orders 2-5. It includes `(ownerIdentity,assignment,streamCursor,crossAccountDenial)`, `(workRevision,approvalSnapshot,providerEffect,receipt,proofRefinding)`, and `(runtimeAmbiguity,noReplay,recoveryLanguage,ownerAction)`.

## Evidence references

- `E01` — identity.md: product identity and research-first operating posture
- `E02` — docs/ui/AMTECH_AI_EMPLOYEE_UI_RUNTIME_DEEP_DIVE_2026-07-19.md: validated snapshot should atomically replace local state before ordered deltas
- `E03` — docs/ui/HERMES_RUNTIME_UI_DERIVATIONS.md: exact runtime identity, no silent fallback, reconnect is not replay, scope-keyed caches
- `E04` — docs/ui/HERMES_HEARTBEAT_UI_ARCHITECTURE.md: durable snapshots/receipts define correctness; heartbeat is liveness only
- `E05` — mvp-build/.../09-workstream-execution-map.md: WS-05 and WS-06 acceptance and stop conditions
- `E06` — mvp-build/apps/web/app/agent/[employeeId]/AgentSurface.tsx: snapshot handler schedules a refetch and does not install the frame
- `E07` — mvp-build/packages/shared/src/work-stream.ts: snapshot is the full read model; stream frames carry assignment/account/employee/authority scope
- `E08` — mvp-build/apps/manager/src/lib/employee-stream.ts: buildEmployeeSnapshot is the single owner snapshot source
- `E09` — PR #33 and mvp-build/memory/2026-07-20-ws04-destructive-host-failure-verification.md: source hardening only; broad WS-05 and live acceptance remain open
- `E10` — fixture architecture and workstream map: fixtures cannot satisfy fixture-free acceptance

## Population and adaptive allocation

Exactly 64 trajectories were generated: 16 A current/failure, 16 B feature emergence, 16 C counterfactual mutation, and 16 D revision/recombination. B and C were authored independently of A rankings and wording. D was created only after A-C.

After the first 32, allocation used `A_c = 0.4 Uncertainty + 0.3 Undercoverage + 0.3 ProductLeverage`:

- fixture_acceptance: A_c=0.8335555, first32_hits=2
- proof_refinding: A_c=0.6454445, first32_hits=7
- channel_convergence: A_c=0.6394445, first32_hits=7
- stream_and_recovery: A_c=0.5097777, first32_hits=10
- scope_and_identity: A_c=0.4917777, first32_hits=10
- work_effect_receipt: A_c=0.3798888, first32_hits=14

## Quality-diversity result

- Generated: 64
- Occupied descriptor cells: 62
- Archive occupancy ratio: 0.968750
- Selected objective: 145.60416531
- Selected sum quality: 106.09458315
- Effective diversity `VS(D)`: 1.25581178
- Hypergraph coverage `C_H(D)`: 26.2
- Mean selected hypothesis separation: 0.82083333
- Selected redundancy: 0.95736365

The archive retains the highest-q candidate in every occupied `b_i` cell. Complete 16-candidate sets were compared list-wise under batch, workstream, surface, and occupied-cell diversity constraints; the highest objective set was selected.

## Selected exploration set

- `A01` — Install validated initial snapshot atomically (q=7.64342725, Sep=0.93333333)
- `A02` — Reject snapshot for another account or employee (q=7.92456485, Sep=0.93333333)
- `A03` — Drop stale or reordered work-event deltas (q=7.45616465, Sep=0.8)
- `A05` — Account switch clears incompatible projected state (q=6.75697535, Sep=0.8)
- `A06` — Employee switch preserves exact assignment identity (q=6.54421955, Sep=0.8)
- `A07` — Authority revocation terminates stale stream state (q=6.8832666, Sep=0.93333333)
- `A16` — Fixture payload cannot satisfy live journey acceptance (q=6.9805202, Sep=0.33333333)
- `B10` — Receipt-backed completion language shared by every channel (q=5.3119541, Sep=0.8)
- `B11` — Context-safe employee switcher with pending-work warning (q=6.1911647, Sep=0.93333333)
- `C08` — Drop accepted provider response and replay the same effect intent (q=6.3443212, Sep=0.6)
- `C12` — Request another account employee through a valid owner session (q=6.9051111, Sep=0.8)
- `C13` — Refind proof after account switch and session rotation (q=5.94339065, Sep=1.0)
- `D01` — Atomic scoped snapshot plus cross-account delta denial (q=7.0640238, Sep=0.93333333)
- `D07` — Employee switch during stalled run with fail-closed input (q=6.657103, Sep=0.8)
- `D12` — Proof search filters preserve assignment isolation (q=5.93844505, Sep=0.93333333)
- `D15` — Cross-surface permalink opens exact approved revision and proof (q=5.5499311, Sep=0.8)

## Hypothesis discrimination

Six plausible repo-state hypotheses are stored with a categorical predicted observation for every candidate. Selected mean pairwise separation is `0.82083333`.

## Koopman search proxy

- 16 selected trajectories x 6 states = 80 transitions.
- Train trajectories: A05, A06, A07, A16, B10, B11, C08, C12, C13, D01, D07, D15
- Holdout trajectories: A01, D12, A02, A03
- Lambda sensitivity: 1e-05, 0.001, 0.1
- Selected lambda: 0.1
- Train one-step NRMSE: 0.1022959
- Holdout one-step NRMSE: 0.13214242
- Holdout multistep NRMSE: 0.15119437
- Identity baseline: 0.11507722
- Mean-delta baseline: 0.10668644
- Rank: 12
- Eigenvalue moduli: 1.04942353, 1.0284287, 0.9282183, 0.87536106, 0.77436536, 0.61899266, 0.42103373, 0.24342573, 0.14546748, 0.09705235, 0.04178585, 0.01789112
- Result: `non_predictive`

The full ridge matrices are stored in `koopman_validation.json` using the documented lossless `zlib+base64(json)` codec. Mode language is suppressed because the selected model does not beat both held-out baselines. This is a generated search-state proxy, not hidden model state or physical software dynamics.

## Compression and implementation admission

- `A02` — I=4.92: direct source defect and executable local contract
- `A03` — I=4.71: direct source defect and executable local contract
- `A01` — I=4.69: direct source defect and executable local contract

The three admitted trajectories compress to one patch: atomically install a validated snapshot, establish exact account/employee/assignment/authority scope and cursor before deltas, and reject stale, reordered, or cross-scope deltas without replaying owner intent.

Rejected for implementation now: live provider/channel acceptance, broad WS-05/WS-06 completion, paid-effect acceptance, managed database, target host, pilot, production, WS-07/08/09 implementation, and fixture-based substitutes. Exact rejected candidates and prerequisite debt are in `selected_implementation.json`.

## Update rule

After implementation, update only evidence-backed fields: executable tests, exact changed source, archive admission/rejection, and claims not established. Source wiring must not be promoted to CI, provider, channel, database, target-host, pilot, or production acceptance.

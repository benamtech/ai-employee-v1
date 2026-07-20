# Verification and Handoff Matrix

Status: **active evidence checklist; WS-01 normalized and hardened WS-02 controls accepted for source/CI**  
Current merged baseline: current `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
WS-01 evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`  
Hardened WS-02 implementation evidence head: `16dc18e0535ac14f867875989dfe5aee596f89c0`

## Gate matrix

| Gate | Accepted evidence | Current state |
|---|---|---|
| Ratified Standard/governance | `29735429854` on `16dc18e` | accepted for source/document scope |
| Hermes streaming/UI review | `29735429873` on `16dc18e` | accepted; pin unchanged |
| Source/type/lint/contracts | Main Integration `29735429859` | accepted |
| Current broad regression | Main Integration `29735429859` | accepted: **110 files / 635 tests** |
| WS-01 historical broad closure | Main Integration `29725298163` | **accepted: 106 files / 613 tests** |
| Production build | `29735429859` | accepted for compilability |
| Repository archaeology | `29735429859` | accepted |
| Compiled browser regression | `29735429859` | accepted as fixture Chromium regression |
| Provider-authority lock | alias-only registered Manager route and caller-field denial | accepted source/CI |
| Assignment-scoped live projection | account/employee/assignment channel plus authority-version stream scope | accepted source/CI |
| Remote MCP authorization | metadata/audience/redirect/PKCE/state/token-custody contracts | accepted source/CI; live AS/provider open |
| MCP Apps | content-bound resource, opaque origin, document CSP, host mediation, protocol return path | accepted source/CI; external host/provider open |
| AG-UI | ordered scope, stable error projection, finite command return path | accepted source/CI; fixture-free client open |
| Effective capability | persisted decision plus final current policy/version/provider-verification gate | accepted source/CI; live lifecycle open |
| Live connector lifecycle | authorization, health, revocation, staleness, outage, repair, deletion | open (`ISS-011`) |
| WS-03 database authority | guarded frontier/task contract | prepared; implementation not started |
| Target host/channels/golden work/commercial/recovery/human surface/capacity/signed release | exact release packets | open |

## Mirror Cabinet findings and repairs

| Conjugate surface | Before | Repair | DEF |
|---|---|---|---|
| exact head vs cited ancestor | later documentation head was red while closure cited ancestor | current implementation evidence isolated and final docs forced through exact-head CI | DEF-003 |
| employee-wide progress channel | two assignments could subscribe to one employee channel | account/employee/assignment-scoped bus; legacy unscoped progress does not broadcast | DEF-001 |
| projected-action drift | MCP App UI could call native callbacks; Manager ignored returned version fields | first-party protocol-action route plus current assignment/version check before command | DEF-001, DEF-003 |
| declarative no-network claim | metadata denied connect domains but document could still request resources | resource-domain denial plus enforceable in-document CSP | DEF-002, DEF-003 |
| MCP dispatch TOCTOU | credential was current at authentication but final interceptor trusted carried policy/version | current assignment relationship/policy and authority version re-read before dispatch | DEF-001 |
| AG-UI failure detail | raw error message could reach client | stable public error code; bounded server log | DEF-002 |

## Source/CI evidence boundary

- First useful Hermes text/activity is forwarded without avoidable Manager buffering.
- A started run is not recreated after stream loss.
- Owner-visible live progress cannot cross assignment boundaries.
- Stream frames carry exact assignment and current authority version.
- Remote MCP authorization cannot accept caller-selected issuer/audience/redirect/scope/token custody.
- MCP Apps cannot access external network/resources or execute actions outside the first-party protocol return path.
- AG-UI shared state is projection and client commands are finite.
- MCP `tools/list` is broad discovery; `tools/call` revalidates current assignment policy/version and effective capability before dispatch.
- Capability decisions persist failed dimensions and proof references.

This does not establish remote MCP authorization against a live server, external MCP Apps/AG-UI conformance, live connector/provider, managed database, target-host, fixture-free channel, commercial, recovery, or production acceptance.

## Test evidence rules

- Broad and curated suites are independently reported.
- Fixture browser proof is not fixture-free provider/channel proof.
- Local PostgreSQL proof is not managed-platform proof where a Standard trigger applies.
- `skipped`/`blocked` never become pass.
- Documentation after an implementation run does not inherit exact-head acceptance; the final PR-head checks rerun.

## Completion rules

- `ISS-007` through `ISS-010` are source/CI resolved on implementation head `16dc18e`.
- `ISS-011` remains the WS-02 workstream completion gate.
- WS-03 is prepared but starts only after PR `#31` merges or is formally superseded.
- Production-ready still requires every non-waivable gate on one exact signed deployed release.

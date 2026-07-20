# Verification and Handoff Matrix

Status: **active evidence checklist; WS-01 normalized, provider authority and WS-02 protocol controls accepted for source/CI**  
Current merged baseline: current `main` at `1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
WS-01 evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`  
WS-02 implementation evidence head: `6f792eabe44a9ca1e9635fd4fe5329fa7daca6c4`

## Gate matrix

| Gate | Accepted evidence | Current state |
|---|---|---|
| Ratified Standard/governance | `29731384034` on `6f792ea` | accepted for source/document scope |
| Hermes streaming/UI review | `29731384166` on `6f792ea` | accepted; pin unchanged |
| Source/type/lint/contracts | Main Integration `29731384039` | accepted |
| Current broad regression | Main Integration `29731384039` | accepted: **109 files / 630 tests** |
| WS-01 historical broad closure | Main Integration `29725298163` | **accepted: 106 files / 613 tests** |
| Production build | `29731384039` | accepted for compilability |
| Repository archaeology | `29731384039` | accepted |
| Compiled browser regression | `29731384039` | accepted as fixture Chromium regression |
| Provider-authority lock | alias-only registered Manager route and caller-field denial | accepted source/CI |
| Remote MCP authorization | metadata/audience/redirect/PKCE/state/token-custody contracts | accepted source/CI; live AS/provider open |
| MCP Apps | negotiated resource, sandbox/hash/bridge/authority projection | accepted source/CI; external host/provider open |
| AG-UI | ordered mapping, first-party SSE, finite command return path | accepted source/CI; fixture-free client open |
| Effective capability | persisted version/freshness/entitlement/probe evidence and pre-dispatch gate | accepted source/CI; live lifecycle open |
| Live connector lifecycle | authorization, health, revocation, staleness, outage, repair, deletion | open (`ISS-011`) |
| Database/target host/channels/golden work/commercial/recovery/human surface/capacity/signed release | exact release packets | open |

## Source/CI evidence boundary

- First useful Hermes text/activity is forwarded without avoidable Manager buffering.
- A started run is not recreated after stream loss.
- Stream frames carry assignment and current authority version.
- Remote MCP authorization cannot accept caller-selected issuer/audience/redirect/scope/token custody.
- MCP Apps cannot access network/credentials/database/provider directly and cannot offer actions without current authority projection.
- AG-UI shared state is projection and client commands are finite.
- MCP `tools/list` is broad discovery; `tools/call` is gated by current effective-capability evidence before dispatch.
- Capability decisions persist failed dimensions and proof references.

This does not establish remote MCP authorization against a live server, external MCP Apps/AG-UI conformance, live connector/provider, managed database, target-host, fixture-free channel, commercial, recovery, or production acceptance.

## Test evidence rules

- Broad and curated suites are independently reported.
- Fixture browser proof is not fixture-free provider/channel proof.
- Local PostgreSQL proof is not managed-platform proof where a Standard trigger applies.
- `skipped`/`blocked` never become pass.
- Documentation after an implementation run does not inherit exact-head acceptance; final PR-head checks rerun.

## Completion rules

- ISS-007 through ISS-010 are source/CI resolved on the implementation head.
- ISS-011 remains the WS-02 workstream completion gate.
- Production-ready still requires every non-waivable gate on one exact signed deployed release.
# tests

| Tier | Runs against | Mocks? | Command |
|---|---|---|---|
| **unit** (`tests/unit`) | pure functions | allowed | `npm run test:unit` |
| **integration** (`tests/integration`) | real provider test creds via tunnel | **no** | `npm run test:integration` *(Phase 1)* |
| **golden-path** (`tests/golden-path`) | the real end-to-end loop | **no** | manual + `npm run smoke:phase01` |

**Provider-mock policy (00-source-of-truth-and-rules.md):** mocks are allowed **only** in unit
tests and local dev loops. They are **never** MVP acceptance. A manually injected provider
result, a stubbed connector success, or a synthetic provider event does not satisfy acceptance.
Every claimed capability must leave real provider proof (Twilio SID, Gmail/Stripe ids, artifact
id, runtime health record).

Phase 0 ships unit tests + integration/golden-path skeletons. Phase 1 provider proof is checked
with `npm run smoke:phase01` after a real provision. Phase 2 artifact acceptance is documented in
`golden-path/step2-estimate-artifact.md`.

#!/usr/bin/env node
/**
 * Superseded shim. The Phase 1 account/provisioning proof now lives in
 * infra/scripts/acceptance/run2-provision.mjs (one of the 8 acceptance runs).
 * Kept so existing references / muscle memory still work; `npm run smoke:phase01`
 * already points at the new verifier.
 */
import { verify } from "./acceptance/run2-provision.mjs";
import { printResult, STATUS } from "./acceptance/_env.mjs";

const r = await verify();
printResult(r);
process.exit(r.status === STATUS.PASS ? 0 : 1);

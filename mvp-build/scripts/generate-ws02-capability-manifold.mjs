#!/usr/bin/env node
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dimensions = {
  1: "Remote MCP transport negotiation",
  2: "MCP App sandbox boundary",
  3: "AG-UI rendering surface",
  4: "Connector capability manifest",
  5: "Effective capability resolution",
  6: "Manager-owned authority boundary",
  7: "Runtime-native capability dispatch",
  8: "OAuth token custody flow",
  9: "Transport-neutral adapter contract",
  10: "Generated view authority projection",
  11: "MCP tool discovery vs. execution split",
  12: "AG-UI channel protocol binding",
  13: "Connector fail-closed behavior",
  14: "Idempotent external effect reservation",
  15: "Authority version drift detection",
};

const apiSurfaces = {
  1: ["GET /.well-known/oauth-protected-resource{resource-path}", "GET /.well-known/oauth-authorization-server{issuer-path}", "POST {token_endpoint}", "POST /manager/mcp"],
  2: ["MCP initialize", "MCP tools/list", "MCP resources/read(ui://…)", "MCP Apps ui/initialize", "MCP Apps tools/call(amtech.surface.intent)"],
  3: ["GET /api/employee/{employeeId}/events", "AG-UI RUN_STARTED", "AG-UI TEXT_MESSAGE_START/CONTENT/END", "AG-UI STATE_SNAPSHOT/STATE_DELTA", "AG-UI ACTIVITY_SNAPSHOT", "AG-UI RUN_FINISHED"],
  4: ["POST /manager/employee/{employeeId}/workbench/connect/{connector}", "connector manifest resolution", "connector continuation binding"],
  5: ["POST /manager/employee/{employeeId}/workbench/capabilities", "POST /manager/internal/effective-capabilities/report", "MCP tools/call pre-dispatch capability interceptor"],
  6: ["owner-session verification", "employee MCP credential verification", "Manager command authorization", "Manager tools/call execution boundary"],
  7: ["GET /v1/capabilities", "GET /v1/toolsets", "POST /v1/runs", "GET /v1/runs/{runId}/events"],
  8: ["GET {authorization_endpoint}", "POST {token_endpoint}", "Manager sealed-secret custody", "connector revocation/rotation"],
  9: ["MCP tools/list", "MCP tools/call", "AMTECH Work Stream SSE", "AG-UI event adapter", "MCP Apps host bridge"],
  10: ["POST /manager/employee/{employeeId}/resources", "GET /api/employee/{employeeId}/events", "MCP resources/read(ui://…)", "native WorkResource renderer"],
  11: ["MCP tools/list", "MCP tools/call", "amtech://manager/tool-catalog", "amtech://manager/capability-registry"],
  12: ["AMTECH Work Stream assistant_delta/work_progress/run_completed", "AG-UI RUN/TEXT/STATE/ACTIVITY events", "AG-UI client command envelope"],
  13: ["HTTP 401/403/409/410/503", "capability_not_effective", "connector setup 404", "ambiguous/failed durable receipt"],
  14: ["Manager command creation", "approval resolution", "effect reservation", "provider commit", "accepted/failed/ambiguous receipt", "reconciliation"],
  15: ["authority_versions.current_version", "MCP credential authority version", "WorkAction authority projection", "queued command authority recheck"],
};

const edges = new Set([
  "1-8","1-9","1-11","1-13","1-15","2-6","2-9","2-10","2-11","2-13","2-14","2-15",
  "3-6","3-9","3-10","3-12","3-13","3-14","3-15","4-5","4-6","4-8","4-9","4-11","4-13","4-15",
  "5-6","5-7","5-9","5-11","5-13","5-14","5-15","6-7","6-8","6-9","6-10","6-11","6-12","6-13","6-14","6-15",
  "7-9","7-11","7-13","7-14","7-15","8-9","8-13","8-15","9-10","9-11","9-12","9-13","9-14","9-15",
  "10-12","10-13","10-14","10-15","11-13","11-14","11-15","12-13","12-14","12-15","13-14","13-15","14-15",
]);

const directlyVerified = new Set([
  "1-6", "1-8", "2-6", "2-10", "3-6", "3-10", "3-12", "4-5", "5-6", "5-11", "6-11", "6-15", "8-15", "10-15", "11-15", "14-15",
  "1-6-8", "2-6-10", "3-7-12", "4-5-15", "5-6-11", "6-10-15", "6-11-14", "6-14-15", "9-10-12",
]);
const weights = { Q: 0.30, I: 0.15, N: 0.10, C: 0.20, K: 0.10, R: 0.15 };

function combinations(values, size) {
  const output = [];
  function visit(start, selected) {
    if (selected.length === size) { output.push(selected); return; }
    for (let index = start; index <= values.length - (size - selected.length); index += 1) {
      visit(index + 1, [...selected, values[index]]);
    }
  }
  visit(0, []);
  return output;
}

function key(left, right) { return left < right ? `${left}-${right}` : `${right}-${left}`; }
function edgeCount(combo) { return combinations(combo, 2).filter(([a, b]) => edges.has(key(a, b))).length; }
function hazard(combo) {
  const set = new Set(combo);
  return [...set].some((value) => [2,3,10,12].includes(value)) && [...set].some((value) => [6,8,14,15].includes(value))
    || set.has(1) && set.has(8)
    || set.has(4) && set.has(5) && set.has(11);
}
function impossible(combo) { return edgeCount(combo) === 0; }
function operator(combo) {
  const set = new Set(combo);
  if (set.has(14) || ([2,3,10,12].some((value) => set.has(value)) && set.has(6))) return "GATE";
  if (set.has(3) && set.has(12) || set.has(9) && set.has(10)) return "TRANSFORM";
  if (set.has(4) && set.has(5) || set.has(5) && set.has(15)) return "FEEDBACK";
  if (impossible(combo)) return "PARALLEL";
  if (combo.length === 3 && edgeCount(combo) >= 3) return "EMERGENT";
  return "SEQUENTIAL";
}
function blockers(combo) {
  const set = new Set(combo);
  const output = [];
  if ([5,6,10,12,15].some((value) => set.has(value))) output.push("DEF-001 authority drift");
  if ([1,2,4,6,8,9,13].some((value) => set.has(value))) output.push("DEF-002 credential leakage");
  if ([1,3,7,9,11,12,13,15].some((value) => set.has(value))) output.push("DEF-003 silent fallback loops");
  if ([3,6,9,10,12,14,15].some((value) => set.has(value))) output.push("DEF-004 receipt ambiguity");
  return output;
}
function ratings(combo) {
  const set = new Set(combo);
  const business = Math.min(5, 2 + Number(set.has(6)) + Number(set.has(14)) + Number([2,3,10,12].some((value) => set.has(value))) + Number(set.has(5)));
  const risk = Math.min(5, 1 + Number(hazard(combo)) + Number([8,14,15].some((value) => set.has(value))) + Number(set.has(1)) + Number(combo.length === 3 && edgeCount(combo) >= 2));
  return { business, risk };
}
function utility(combo, verified) {
  const count = edgeCount(combo);
  const set = new Set(combo);
  const { risk } = ratings(combo);
  const Q = verified ? 5 : 2 + Math.min(2, count);
  const I = Math.min(5, 2 + count + Number(set.has(5) || set.has(15)));
  const N = Math.min(5, 1 + combo.length + Number([2,3,12].some((value) => set.has(value))));
  const C = Math.min(5, combo.length + count);
  const K = Math.min(5, 1 + combo.length + Number(set.has(1) || set.has(8)) + Number(set.has(14)));
  const score = weights.Q * Q + weights.I * I + weights.N * N + weights.C * C - weights.K * K - weights.R * risk;
  return { deltaQ: Q, informationGain: I, novelty: N, coverage: C, cost: K, regressionRisk: risk, score: Number(score.toFixed(3)) };
}
function surfaces(combo) {
  const output = [];
  for (const dimension of combo) for (const surface of apiSurfaces[dimension]) if (!output.includes(surface)) output.push(surface);
  return output;
}
function hypothesis(combo) {
  const names = combo.map((dimension) => dimensions[dimension]).join(" + ");
  if (impossible(combo)) return `Direct coupling between ${names} is impossible without crossing the Manager authority or transport-neutral adapter boundary; any observed direct mutation would prove an unauthorized hidden edge.`;
  if (hazard(combo)) return `[HAZARD] ${names} remains safe only when every client/runtime claim is re-derived at Manager from current assignment, capability, authority-version, effect, and receipt state before execution.`;
  return `${names} composes correctly when discovery and streaming remain broad and fast while execution is intersected with current Manager-owned evidence before any consequential effect.`;
}
function entry(combo, kind) {
  const identifier = combo.join("-");
  const verified = directlyVerified.has(identifier);
  const surfaceList = surfaces(combo);
  const names = combo.map((dimension) => dimensions[dimension]).join(" + ");
  const proof = impossible(combo) ? hypothesis(combo) : null;
  const { business, risk } = ratings(combo);
  return {
    id: `${kind}-${combo.map((dimension) => `Psi${dimension}`).join("-")}`,
    dimensions: combo.map((dimension) => ({ id: `Psi${dimension}`, name: dimensions[dimension] })),
    operator: operator(combo),
    hazard: hazard(combo),
    impossibility_proof: proof,
    hypothesis: hypothesis(combo),
    trajectory: {
      inspect: surfaceList,
      reproduce: `Exercise ${surfaceList.slice(0, 4).join(" → ")} with current and stale authority/evidence variants.`,
      red_test: `Assert that ${names} cannot create credentials, authority, duplicate effects, silent fallback, or receipt-free success.`,
      patch: "Insert or tighten the Manager-owned validation/translation gate at the first transition from projection or discovery into execution.",
      run_tests: ["focused WS-02 contract", "broad unit aggregate", "production-boundary contracts", "UI contracts", "production build", "compiled browser matrix"],
      regression: "Replay reconnect, duplicate delivery, stale authority, connector revocation, stream interruption, and ambiguous provider outcome."
    },
    verification: verified ? "[VERIFIED]" : "[UNVERIFIED]",
    blockers: blockers(combo),
    business_value: business,
    risk,
    utility: utility(combo, verified),
  };
}

export function generateCapabilityManifold() {
  const values = Object.keys(dimensions).map(Number);
  const pairs = combinations(values, 2).map((combo) => entry(combo, "PAIR"));
  const triples = combinations(values, 3)
    .filter((combo) => edgeCount(combo) >= 2 || hazard(combo) && edgeCount(combo) >= 1)
    .map((combo) => entry(combo, "TRIPLE"));
  return { pairs, triples };
}

export function verifyCapabilityManifold(manifold) {
  if (manifold.pairs.length !== 105) throw new Error(`ws02_pair_count:${manifold.pairs.length}`);
  if (manifold.triples.length !== 357) throw new Error(`ws02_triple_count:${manifold.triples.length}`);
  const identifiers = new Set();
  for (const candidate of [...manifold.pairs, ...manifold.triples]) {
    if (identifiers.has(candidate.id)) throw new Error(`ws02_duplicate:${candidate.id}`);
    identifiers.add(candidate.id);
    if (!candidate.hypothesis || !candidate.trajectory?.inspect?.length || !candidate.verification) throw new Error(`ws02_incomplete:${candidate.id}`);
    if (JSON.stringify(candidate).includes("out of scope")) throw new Error(`ws02_out_of_scope_marker:${candidate.id}`);
    if (candidate.trajectory.inspect.some((surface) => /(?:^|\/)mvp-build\//.test(surface))) throw new Error(`ws02_file_path_in_api_trajectory:${candidate.id}`);
    if (!candidate.blockers.length) throw new Error(`ws02_blocker_mapping_missing:${candidate.id}`);
  }
  return { pairwise: manifold.pairs.length, triple_wise: manifold.triples.length, total: identifiers.size };
}

async function writeManifold(manifold, outputDirectory) {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(resolve(outputDirectory, "01-pairwise.json"), `${JSON.stringify(manifold.pairs, null, 2)}\n`);
  for (let start = 0; start < manifold.triples.length; start += 90) {
    const chunk = manifold.triples.slice(start, start + 90);
    const index = 2 + Math.floor(start / 90);
    const name = `${String(index).padStart(2, "0")}-triples-${String(start + 1).padStart(3, "0")}-${String(start + chunk.length).padStart(3, "0")}.json`;
    await writeFile(resolve(outputDirectory, name), `${JSON.stringify(chunk, null, 2)}\n`);
  }
}

const direct = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  const manifold = generateCapabilityManifold();
  const summary = verifyCapabilityManifold(manifold);
  const writeIndex = process.argv.indexOf("--write");
  if (writeIndex >= 0) {
    const root = dirname(fileURLToPath(import.meta.url));
    const destination = process.argv[writeIndex + 1]
      ? resolve(process.argv[writeIndex + 1])
      : resolve(root, "../second-half-plan/2026-07-19-ratified-standard-production-program/15-ws02-capability-manifold/generated");
    await writeManifold(manifold, destination);
    console.log(JSON.stringify({ status: "ok", ...summary, destination }));
  } else {
    console.log(JSON.stringify({ status: "ok", ...summary }));
  }
}

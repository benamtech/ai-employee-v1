import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(process.cwd(), "..");
const validator = join(repoRoot, "scripts", "sdrt", "sdrt_validator.py");
const mcp = join(repoRoot, "scripts", "sdrt", "sdrt_mcp_server.py");
const example = join(repoRoot, "local-prod", "example.sdrt");

function python(script: string, args: string[], input?: string) {
  return spawnSync("python3", [script, ...args], { cwd: repoRoot, encoding: "utf8", input, timeout: 5000 });
}

describe("SDRT-v2 formal validator", () => {
  it("validates closed schema and preserves parse/emit/parse identity", () => {
    const validated = python(validator, [example, "--closed"]);
    expect(validated.status, validated.stderr).toBe(0);
    expect(JSON.parse(validated.stdout)).toMatchObject({ status: "pass", version: "v2", nodes: 5, closed: true });

    const roundTrip = python(validator, [example, "--closed", "--round-trip"]);
    expect(roundTrip.status, roundTrip.stderr).toBe(0);
    expect(JSON.parse(roundTrip.stdout)).toMatchObject({ status: "pass", round_trip: true });
  });

  it("preserves escaped colons, pipes, and backslashes through canonical emission", () => {
    const dir = mkdtempSync(join(tmpdir(), "sdrt-v2-escaped-"));
    const escaped = join(dir, "escaped.sdrt");
    writeFileSync(escaped, String.raw`@E|escaped|v2|type:gap|mitigation:path\:C\:\\repo\|fallback\\safe` + "\n");
    const roundTrip = python(validator, [escaped, "--closed", "--round-trip", "--json"]);
    expect(roundTrip.status, roundTrip.stderr).toBe(0);
    const body = JSON.parse(roundTrip.stdout);
    expect(body.nodes[0].fields).toContainEqual(["mitigation", "path:C:\\repo|fallback\\safe"]);
  });

  it("returns typed query subgraphs", () => {
    const queried = python(validator, [example, "--closed", "--query=type:gap", "--json"]);
    expect(queried.status, queried.stderr).toBe(0);
    const body = JSON.parse(queried.stdout);
    expect(body.nodes).toHaveLength(1);
    expect(body.nodes[0]).toMatchObject({ marker: "E", identifier: "finding_local_proof" });
  });

  it("rejects unknown closed-schema keys, mixed versions, and oversized documents", () => {
    const dir = mkdtempSync(join(tmpdir(), "sdrt-v2-"));
    const unknown = join(dir, "unknown.sdrt");
    writeFileSync(unknown, "@E|bad|v2|type:gap|unbounded_key:value\n");
    const unknownResult = python(validator, [unknown, "--closed"]);
    expect(unknownResult.status).toBe(1);
    expect(unknownResult.stderr).toContain("closed schema rejects");

    const mixed = join(dir, "mixed.sdrt");
    writeFileSync(mixed, "@S|schema|v2\n@E|bad|v3|type:gap\n");
    const mixedResult = python(validator, [mixed]);
    expect(mixedResult.status).toBe(1);
    expect(mixedResult.stderr).toMatch(/unsupported SDRT major|mixed schema versions/);

    const oversized = join(dir, "large.sdrt");
    writeFileSync(oversized, "@E|large|v2|type:gap|mitigation:" + "x".repeat(1_000_100));
    const oversizedResult = python(validator, [oversized]);
    expect(oversizedResult.status).toBe(1);
    expect(oversizedResult.stderr).toContain("document exceeds");
  });
});

describe("SDRT-v2 MCP extension", () => {
  it("exposes every entity as a resource and only a read-only query tool", () => {
    const dryRun = python(mcp, ["--dry-run", example]);
    expect(dryRun.status, dryRun.stderr).toBe(0);
    expect(JSON.parse(dryRun.stdout)).toMatchObject({ status: "pass", read_only: true, resources: 5, tools: ["query_sdrt"] });

    const requests = [
      { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
      { jsonrpc: "2.0", id: 2, method: "resources/list", params: {} },
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "query_sdrt", arguments: { query: "type:gap" } } },
      { jsonrpc: "2.0", id: 4, method: "resources/write", params: { uri: "sdrt://document/E/finding_local_proof" } },
    ].map((request) => JSON.stringify(request)).join("\n") + "\n";
    const server = python(mcp, [example], requests);
    expect(server.status, server.stderr).toBe(0);
    const responses = server.stdout.trim().split("\n").map((line) => JSON.parse(line));
    expect(responses.find((row) => row.id === 2)?.result.resources).toHaveLength(5);
    expect(responses.find((row) => row.id === 3)?.result.content[0].text).toContain("finding_local_proof");
    expect(responses.find((row) => row.id === 4)?.error).toMatchObject({ code: -32601 });
  });
});

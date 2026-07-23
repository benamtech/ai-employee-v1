import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("infra/scripts/deploy-smoke.mjs", "utf8");

describe("deploy smoke health checks", () => {
  it("polls compose health instead of sampling Caddy once during startup", () => {
    expect(source).toContain("async function composeHealth(service, attempts = 12)");
    expect(source).toContain("last = composeHealthOnce(service)");
    expect(source).toContain("await sleep(2500)");
    expect(source).toContain('await composeHealth("caddy")');
  });
});

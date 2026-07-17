import { readFile, writeFile } from "node:fs/promises";

// One-shot remaining TDD corrections. Delete after the bot commit lands.
async function replaceExactly(path, before, after, expected = 1) {
  const source = await readFile(path, "utf8");
  const matches = source.split(before).length - 1;
  if (matches !== expected) throw new Error(`${path}: expected ${expected} exact matches, found ${matches}`);
  await writeFile(path, source.split(before).join(after), "utf8");
}

await replaceExactly(
  "mvp-build/tests/unit/model-profile-isolation.test.ts",
  '    this.filters.push((row) => row[column] === value);',
  '    this.filters.push((row) => value === null ? row[column] == null : row[column] === value);',
);

await replaceExactly(
  "mvp-build/tests/unit/production-boundary-source.test.ts",
  '    expect(compose).toContain("node apps/manager/dist/model-gateway-server.js");',
  '    expect(compose).toContain(\'command: ["node", "apps/manager/dist/model-gateway-server.js"]\');',
);

await replaceExactly(
  "mvp-build/tests/unit/production-live-harness.test.ts",
  '      expect(source).not.toContain("api/dev/login");',
  '      expect(source).not.toContain(\'fetch("/api/dev/login"\');',
);

const readme = "mvp-build/packages/agent-template/README.md";
await replaceExactly(readme, 'substituting `{{TOKEN}}` placeholders', 'substituting double-brace token placeholders');
await replaceExactly(readme, '(`{{LIKE_THIS}}`)', '(`DOUBLE_BRACE_TOKEN`)');
await replaceExactly(
  readme,
  '`{{EMPLOYEE_NAME}}`, `{{BUSINESS_DISPLAY_NAME}}`, `{{BUSINESS_KIND}}`, `{{OWNER_NAME}}`, `{{OWNER_PHONE_E164}}`, `{{TIMEZONE}}`, `{{CLIENT_ID}}`, `{{GATEWAY_PORT}}`, `{{RUNTIME_BACKEND}}` (Manager isolation tier), `{{TERMINAL_BACKEND}}` (Hermes in-container execution backend), `{{MANAGER_MCP_URL}}` (container-facing), `{{MANAGER_MCP_TOKEN}}` (render-only scoped employee credential), `{{EMPLOYEE_NUMBER_E164}}`, `{{WEBHOOK_URL}}`, `{{API_SERVER_KEY}}`.',
  '`EMPLOYEE_NAME`, `BUSINESS_DISPLAY_NAME`, `BUSINESS_KIND`, `OWNER_NAME`, `OWNER_PHONE_E164`, `TIMEZONE`, `CLIENT_ID`, `GATEWAY_PORT`, `RUNTIME_BACKEND` (Manager isolation tier), `TERMINAL_BACKEND` (Hermes in-container execution backend), `MANAGER_MCP_URL` (container-facing), `MANAGER_MCP_TOKEN` (render-only scoped employee credential), `EMPLOYEE_NUMBER_E164`, `WEBHOOK_URL`, `API_SERVER_KEY`.',
);

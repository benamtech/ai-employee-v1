#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const path = "mvp-build/apps/manager/src/server.ts";
let source = await readFile(path, "utf8");
const before = "      const unsub = subscribeProgress(employeeId, (p) => {";
const after = [
  "      const unsub = subscribeProgress({",
  "        account_id: accountId,",
  "        employee_id: employeeId,",
  "        assignment_id: assignmentId,",
  "      }, (p) => {",
].join("\n");
if (!source.includes(before)) throw new Error("unscoped_progress_subscription_not_found");
source = source.replace(before, after);
await writeFile(path, source, "utf8");
console.log(JSON.stringify({ status: "ok", path, scope: "account_employee_assignment" }));

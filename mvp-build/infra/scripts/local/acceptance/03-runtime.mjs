#!/usr/bin/env node
import { loadState, printResult, runtimeForEmployee, run } from "./_lib.mjs";

const state = await loadState();
const { runtime, bearer, baseUrl } = await runtimeForEmployee(state.employee_id);

printResult("runtime endpoint row", Boolean(baseUrl), `${runtime.backend_type} ${baseUrl}`);
printResult("runtime sms skipped", runtime.sms_number_e164 == null, runtime.sms_number_e164 == null ? "no SMS number" : String(runtime.sms_number_e164));

const container = run("docker", ["ps", "--filter", `name=amtech-hermes-${state.employee_id}`, "--format", "{{.Names}}"]);
printResult("employee container", container.ok && container.out.includes(`amtech-hermes-${state.employee_id}`), container.out || "container not found");

const health = await fetch(`${baseUrl}/health`, { headers: { Authorization: `Bearer ${bearer}` } }).catch((err) => ({ error: err }));
printResult("runtime /health", Boolean(health.ok), health.error?.message ?? `${health.status}`);

const capabilities = await fetch(`${baseUrl}/v1/capabilities`, { headers: { Authorization: `Bearer ${bearer}` } }).catch((err) => ({ error: err }));
printResult("runtime /v1/capabilities", Boolean(capabilities.ok), capabilities.error?.message ?? `${capabilities.status}`);


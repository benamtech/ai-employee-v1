#!/usr/bin/env node
import { fetchJson, managerBase, printResult, webBase } from "./_lib.mjs";

const manager = await fetchJson(`${managerBase()}/health`).catch((err) => ({ error: err }));
printResult("manager /health", Boolean(manager.res?.ok), manager.error?.message ?? JSON.stringify(manager.json ?? {}));

const web = await fetch(webBase()).catch((err) => ({ error: err }));
printResult("web root", Boolean(web.ok), web.error?.message ?? `${web.status}`);


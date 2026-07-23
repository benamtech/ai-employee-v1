#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const root = process.cwd();
const trace = "mvp-build/decision/trace010";
const output = resolve(root, process.argv[2] ?? `${trace}/generated`);
const task = JSON.parse(await readFile(resolve(root, `${trace}/task_state.json`), "utf8"));
const rev = (value) => execFileSync("git", ["rev-parse", value], { cwd: root, encoding: "utf8" }).trim();
const record = {
  schema: "trace010.tree-identity.v1",
  starting_sha: task.starting_sha,
  starting_tree_sha: rev(`${task.starting_sha}^{tree}`),
  trace_head_sha: rev("HEAD"),
  trace_head_tree_sha: rev("HEAD^{tree}")
};
await mkdir(output, { recursive: true });
await writeFile(resolve(output, "tree_identity.json"), JSON.stringify(record, null, 2) + "\n");
console.log(JSON.stringify(record, null, 2));

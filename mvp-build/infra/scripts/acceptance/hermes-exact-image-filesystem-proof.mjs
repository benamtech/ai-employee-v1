#!/usr/bin/env node
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assert, run, writeProof } from "./production-proof-lib.mjs";

const image = process.env.HERMES_EXACT_IMAGE ?? "nousresearch/hermes-agent:v2026.7.1";
assert(/^nousresearch\/hermes-agent:v2026\.7\.1(?:@sha256:[a-f0-9]{64})?$/.test(image), "hermes_exact_image_not_pinned", { image });

run("docker", ["pull", image], { timeout: 20 * 60_000 });
const inspected = JSON.parse(run("docker", ["image", "inspect", image]).output)[0];
const repoDigests = Array.isArray(inspected?.RepoDigests) ? inspected.RepoDigests : [];
const resolvedDigest = repoDigests.find((value) => String(value).startsWith("nousresearch/hermes-agent@sha256:"));
assert(resolvedDigest, "hermes_exact_image_digest_missing", { image, repoDigests });

const root = await mkdtemp(join(tmpdir(), "amtech-hermes-exact-"));
const data = join(root, "data");
const profile = join(root, "profile");
const workspace = join(root, "workspace");
await Promise.all([mkdir(data), mkdir(profile), mkdir(workspace)]);
await mkdir(join(data, "plugins", "amtech-hygiene"), { recursive: true });
await writeFile(join(data, "plugins", "amtech-hygiene", "plugin.json"), "{\"name\":\"amtech-hygiene\"}\n");
await writeFile(join(profile, "config.yaml"), "model:\n  provider: custom\n");

const uid = typeof process.getuid === "function" ? process.getuid() : 1000;
const gid = typeof process.getgid === "function" ? process.getgid() : 1000;
const mountArgs = [
  "--read-only",
  "--user", `${uid}:${gid}`,
  "--tmpfs", "/tmp:rw,nosuid,nodev,size=64m,mode=1777",
  "-v", `${data}:/opt/data`,
  "-v", `${profile}:/opt/amtech/profile:ro`,
  "-v", `${workspace}:/workspace`,
];

function container(script) {
  return run("docker", ["run", "--rm", "--entrypoint", "/bin/sh", ...mountArgs, image, "-euc", script], {
    timeout: 120_000,
  });
}

try {
  const first = container([
    "test -w /opt/data",
    "test -w /workspace",
    "test ! -w /opt/amtech/profile/config.yaml",
    "test -f /opt/data/plugins/amtech-hygiene/plugin.json",
    "mkdir -p /opt/data/sessions /opt/data/memories /opt/data/checkpoints /workspace/projects/proof",
    "printf session > /opt/data/sessions/amtech-proof",
    "printf memory > /opt/data/memories/amtech-proof",
    "printf checkpoint > /opt/data/checkpoints/amtech-proof",
    "printf workspace > /workspace/projects/proof/amtech-proof",
    "test ! -e /opt/amtech-root-write-proof",
    "if touch /opt/amtech-root-write-proof 2>/dev/null; then exit 91; fi",
    "command -v hermes >/dev/null",
  ].join("\n"));

  const second = container([
    "test \"$(cat /opt/data/sessions/amtech-proof)\" = session",
    "test \"$(cat /opt/data/memories/amtech-proof)\" = memory",
    "test \"$(cat /opt/data/checkpoints/amtech-proof)\" = checkpoint",
    "test \"$(cat /workspace/projects/proof/amtech-proof)\" = workspace",
    "test -f /opt/data/plugins/amtech-hygiene/plugin.json",
    "test -r /opt/amtech/profile/config.yaml",
  ].join("\n"));

  const version = container("hermes --version 2>&1 || hermes version 2>&1 || true").output.slice(0, 500);
  const proof = await writeProof("hermes-exact-image-filesystem", "passed", {
    requested_image: image,
    resolved_digest: resolvedDigest,
    image_id: inspected?.Id ?? null,
    architecture: inspected?.Architecture ?? null,
    os: inspected?.Os ?? null,
    runtime_user: `${uid}:${gid}`,
    contracts: {
      opt_data_writable_and_persistent: true,
      workspace_writable_and_persistent: true,
      profile_read_only: true,
      root_filesystem_read_only: true,
      plugin_visible: true,
      session_memory_checkpoint_persistent: true,
    },
    hermes_version_output: version,
    first_run_tail: first.output.split("\n").slice(-10),
    second_run_tail: second.output.split("\n").slice(-10),
  });
  const persisted = JSON.parse(await readFile(proof.path, "utf8"));
  assert(persisted?.evidence?.resolved_digest === resolvedDigest, "hermes_exact_image_proof_not_persisted");
} finally {
  await rm(root, { recursive: true, force: true });
}

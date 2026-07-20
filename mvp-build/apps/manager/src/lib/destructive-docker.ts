import { spawn } from "node:child_process";

export type DestructiveDockerOutcome = "accepted" | "failed" | "ambiguous";

export interface DestructiveDockerSpec {
  action: string;
  args: string[];
  expected_stdout?: string;
  allow_empty_stdout?: boolean;
  timeout_ms?: number;
}

export interface DestructiveDockerObservation {
  exit_code: number | null;
  signal: NodeJS.Signals | null;
  timed_out: boolean;
  stdout: string;
  stderr: string;
  spawn_error?: string | null;
}

export interface DestructiveDockerEvidence extends DestructiveDockerObservation {
  outcome: DestructiveDockerOutcome;
  failure_state?: string;
  action: string;
  command: string[];
  expected_stdout?: string;
  output_verified: boolean;
}

function bounded(value: string): string {
  return value.slice(0, 2_000);
}

export function classifyDestructiveDockerObservation(
  spec: DestructiveDockerSpec,
  observation: DestructiveDockerObservation,
): DestructiveDockerEvidence {
  const base = {
    ...observation,
    stdout: bounded(observation.stdout),
    stderr: bounded(observation.stderr),
    action: spec.action,
    command: ["docker", ...spec.args],
    expected_stdout: spec.expected_stdout,
  };

  if (observation.timed_out) {
    return { ...base, outcome: "ambiguous", failure_state: "docker_destructive_timeout", output_verified: false };
  }
  if (observation.spawn_error) {
    return { ...base, outcome: "failed", failure_state: "docker_destructive_spawn_failed", output_verified: false };
  }
  if (observation.exit_code === null) {
    return { ...base, outcome: "ambiguous", failure_state: "docker_destructive_exit_unknown", output_verified: false };
  }
  if (observation.exit_code !== 0) {
    return { ...base, outcome: "failed", failure_state: "docker_destructive_nonzero_exit", output_verified: false };
  }

  const stdout = observation.stdout.trim();
  if (spec.expected_stdout) {
    const exactLinePresent = stdout.split(/\r?\n/).some((line) => line.trim() === spec.expected_stdout);
    if (!exactLinePresent) {
      return { ...base, outcome: "ambiguous", failure_state: "docker_destructive_output_unverified", output_verified: false };
    }
  } else if (!spec.allow_empty_stdout && stdout.length === 0) {
    return { ...base, outcome: "ambiguous", failure_state: "docker_destructive_output_missing", output_verified: false };
  }

  return { ...base, outcome: "accepted", output_verified: true };
}

export class DestructiveDockerFailure extends Error {
  readonly outcome: Exclude<DestructiveDockerOutcome, "accepted">;
  readonly failure_state: string;
  readonly evidence: Record<string, unknown>;

  constructor(evidence: DestructiveDockerEvidence) {
    const outcome = evidence.outcome === "accepted" ? "ambiguous" : evidence.outcome;
    const failureState = evidence.failure_state ?? "docker_destructive_ambiguous";
    super(`${failureState}:${evidence.action}`);
    this.name = "DestructiveDockerFailure";
    this.outcome = outcome;
    this.failure_state = failureState;
    this.evidence = { destructive_docker: evidence };
  }
}

export async function runDestructiveDockerStep(spec: DestructiveDockerSpec): Promise<DestructiveDockerEvidence> {
  const timeoutMs = Math.max(1_000, spec.timeout_ms ?? 30_000);
  const observation = await new Promise<DestructiveDockerObservation>((resolve) => {
    const child = spawn("docker", spec.args, { shell: false, env: process.env });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let spawnError: string | null = null;
    let settled = false;

    const finish = (exitCode: number | null, signal: NodeJS.Signals | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ exit_code: exitCode, signal, timed_out: timedOut, stdout, stderr, spawn_error: spawnError });
    };

    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (err) => {
      spawnError = String(err.message ?? err);
      finish(null, null);
    });
    child.on("close", (code, signal) => finish(code, signal));

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!settled) child.kill("SIGKILL");
      }, 1_000).unref();
    }, timeoutMs);
    timer.unref();
  });

  const evidence = classifyDestructiveDockerObservation(spec, observation);
  if (evidence.outcome !== "accepted") throw new DestructiveDockerFailure(evidence);
  return evidence;
}

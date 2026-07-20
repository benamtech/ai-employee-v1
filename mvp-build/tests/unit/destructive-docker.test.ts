import { describe, expect, it } from "vitest";
import {
  classifyDestructiveDockerObservation,
  DestructiveDockerFailure,
  type DestructiveDockerObservation,
} from "../../apps/manager/src/lib/destructive-docker.js";

const observed = (overrides: Partial<DestructiveDockerObservation> = {}): DestructiveDockerObservation => ({
  exit_code: 0,
  signal: null,
  timed_out: false,
  stdout: "amtech-hermes-employee_01\n",
  stderr: "",
  spawn_error: null,
  ...overrides,
});

const spec = {
  action: "remove_runtime_container",
  args: ["rm", "-f", "amtech-hermes-employee_01"],
  expected_stdout: "amtech-hermes-employee_01",
};

describe("destructive Docker fail-closed classifier", () => {
  it("accepts only a zero exit with the expected Docker confirmation", () => {
    expect(classifyDestructiveDockerObservation(spec, observed())).toMatchObject({
      outcome: "accepted",
      output_verified: true,
      exit_code: 0,
    });
  });

  it("classifies explicit Docker failure as failed", () => {
    const evidence = classifyDestructiveDockerObservation(spec, observed({ exit_code: 1, stdout: "", stderr: "permission denied" }));
    expect(evidence).toMatchObject({ outcome: "failed", failure_state: "docker_destructive_nonzero_exit", output_verified: false });
    expect(() => new DestructiveDockerFailure(evidence)).not.toThrow();
  });

  it("classifies timeout, signal termination, and missing exit status as ambiguous", () => {
    expect(classifyDestructiveDockerObservation(spec, observed({ timed_out: true, exit_code: null, stdout: "" }))).toMatchObject({
      outcome: "ambiguous",
      failure_state: "docker_destructive_timeout",
    });
    expect(classifyDestructiveDockerObservation(spec, observed({ signal: "SIGKILL", exit_code: null, stdout: "" }))).toMatchObject({
      outcome: "ambiguous",
      failure_state: "docker_destructive_signal_termination",
    });
    expect(classifyDestructiveDockerObservation(spec, observed({ exit_code: null, stdout: "" }))).toMatchObject({
      outcome: "ambiguous",
      failure_state: "docker_destructive_exit_unknown",
    });
  });

  it("rejects malformed or unrelated success output as ambiguous", () => {
    expect(classifyDestructiveDockerObservation(spec, observed({ stdout: "some-other-container\n" }))).toMatchObject({
      outcome: "ambiguous",
      failure_state: "docker_destructive_output_unverified",
      output_verified: false,
    });
  });

  it("permits empty output only for explicitly declared Docker commands", () => {
    const disconnect = {
      action: "detach_manager_runtime_network",
      args: ["network", "disconnect", "-f", "employee-net", "manager"],
      allow_empty_stdout: true,
    };
    expect(classifyDestructiveDockerObservation(disconnect, observed({ stdout: "" }))).toMatchObject({ outcome: "accepted", output_verified: true });
    expect(classifyDestructiveDockerObservation({ ...disconnect, allow_empty_stdout: false }, observed({ stdout: "" }))).toMatchObject({
      outcome: "ambiguous",
      failure_state: "docker_destructive_output_missing",
    });
  });
});

declare module "node:crypto" {
  interface Hash { update(value: string | Uint8Array): Hash; digest(encoding: "hex"): string; }
  export function createHash(algorithm: string): Hash;
}
declare module "node:perf_hooks" { export const performance: { now(): number }; }

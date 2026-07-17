import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createTypeScriptKernel, instantiateHyperKernel } from "../dist/index.js";

const scalar = await instantiateHyperKernel(readFileSync("dist/wasm/kernel.scalar.wasm"));
const simd = await instantiateHyperKernel(readFileSync("dist/wasm/kernel.simd.wasm"));
const oracle = createTypeScriptKernel();
const left = Float32Array.from({ length: 1024 }, (_, i) => Math.sin(i / 17));
const right = Float32Array.from({ length: 1024 }, (_, i) => Math.cos(i / 19));
const expected = oracle.dot(left, right);
assert.ok(Math.abs(scalar.dot(left, right, false) - expected) < 0.001);
assert.ok(Math.abs(simd.dot(left, right, true) - expected) < 0.001);
const normalized = simd.normalize(left);
assert.ok(Math.abs(oracle.dot(normalized, normalized) - 1) < 0.001);
console.log(JSON.stringify({ scalar: scalar.dot(left, right, false), simd: simd.dot(left, right, true), expected }, null, 2));

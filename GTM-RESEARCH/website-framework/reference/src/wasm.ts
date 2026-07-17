export interface HyperKernelExports {
  memory: WebAssembly.Memory;
  dot_f32_scalar(leftPtr: number, rightPtr: number, length: number): number;
  dot_f32_simd(leftPtr: number, rightPtr: number, length: number): number;
  normalize_f32(valuesPtr: number, length: number): number;
  weighted_add_f32(outputPtr: number, inputPtr: number, weight: number, length: number): void;
  facility_marginal_f32(weightsPtr: number, bestPtr: number, candidatePtr: number, length: number): number;
}

export interface HyperKernel {
  dot(left: Float32Array, right: Float32Array, simd?: boolean): number;
  normalize(values: Float32Array): Float32Array;
  weightedAdd(output: Float32Array, input: Float32Array, weight: number): Float32Array;
  facilityMarginal(weights: Float32Array, best: Float32Array, candidate: Float32Array): number;
}

export async function instantiateHyperKernel(bytes: BufferSource): Promise<HyperKernel> {
  const instantiated = await WebAssembly.instantiate(bytes, {});
  const exports = instantiated.instance.exports as unknown as HyperKernelExports;
  validateExports(exports);
  return createKernelAdapter(exports);
}

export function createKernelAdapter(exports: HyperKernelExports): HyperKernel {
  let cursor = 0;
  const align = (value: number) => (value + 15) & ~15;
  const allocate = (length: number): { ptr: number; view: Float32Array } => {
    const bytes = length * Float32Array.BYTES_PER_ELEMENT;
    const ptr = align(cursor);
    const required = ptr + bytes;
    if (required > exports.memory.buffer.byteLength) {
      const pages = Math.ceil((required - exports.memory.buffer.byteLength) / 65536);
      exports.memory.grow(pages);
    }
    cursor = required;
    return { ptr, view: new Float32Array(exports.memory.buffer, ptr, length) };
  };
  const reset = () => { cursor = 0; };
  return {
    dot(left, right, simd = true) {
      if (left.length !== right.length) throw new RangeError("vector length mismatch");
      reset(); const a = allocate(left.length); const b = allocate(right.length); a.view.set(left); b.view.set(right);
      return simd ? exports.dot_f32_simd(a.ptr, b.ptr, left.length) : exports.dot_f32_scalar(a.ptr, b.ptr, left.length);
    },
    normalize(values) {
      reset(); const target = allocate(values.length); target.view.set(values);
      const status = exports.normalize_f32(target.ptr, values.length);
      if (status !== 0) throw new RangeError(`Wasm normalize failed with status ${status}`);
      return new Float32Array(target.view);
    },
    weightedAdd(output, input, weight) {
      if (output.length !== input.length) throw new RangeError("vector length mismatch");
      reset(); const a = allocate(output.length); const b = allocate(input.length); a.view.set(output); b.view.set(input);
      exports.weighted_add_f32(a.ptr, b.ptr, weight, output.length);
      return new Float32Array(a.view);
    },
    facilityMarginal(weights, best, candidate) {
      if (weights.length !== best.length || best.length !== candidate.length) throw new RangeError("facility vector length mismatch");
      reset(); const w = allocate(weights.length); const b = allocate(best.length); const c = allocate(candidate.length);
      w.view.set(weights); b.view.set(best); c.view.set(candidate);
      return exports.facility_marginal_f32(w.ptr, b.ptr, c.ptr, weights.length);
    },
  };
}

export function createTypeScriptKernel(): HyperKernel {
  return {
    dot(left, right) {
      if (left.length !== right.length) throw new RangeError("vector length mismatch");
      let sum = 0; for (let i = 0; i < left.length; i += 1) sum += left[i] * right[i]; return sum;
    },
    normalize(values) {
      let squared = 0; for (const value of values) squared += value * value;
      if (!Number.isFinite(squared) || squared <= 0) throw new RangeError("invalid norm");
      const norm = Math.sqrt(squared); return Float32Array.from(values, (value) => value / norm);
    },
    weightedAdd(output, input, weight) {
      if (output.length !== input.length) throw new RangeError("vector length mismatch");
      const result = new Float32Array(output); for (let i = 0; i < result.length; i += 1) result[i] += weight * input[i]; return result;
    },
    facilityMarginal(weights, best, candidate) {
      if (weights.length !== best.length || best.length !== candidate.length) throw new RangeError("facility vector length mismatch");
      let gain = 0; for (let i = 0; i < weights.length; i += 1) gain += weights[i] * Math.max(0, candidate[i] - best[i]); return gain;
    },
  };
}

function validateExports(exports: Partial<HyperKernelExports>): asserts exports is HyperKernelExports {
  const required = ["memory", "dot_f32_scalar", "dot_f32_simd", "normalize_f32", "weighted_add_f32", "facility_marginal_f32"] as const;
  for (const name of required) if (!(name in exports)) throw new Error(`Wasm kernel missing export: ${name}`);
}

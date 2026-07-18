import "./core.js";

declare module "./core.js" {
  export function cosine(
    left: Float64Array | Float32Array,
    right: Float64Array | Float32Array,
  ): number;
}

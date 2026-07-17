# Zig / WebAssembly kernel

Pinned target: Zig `0.15.2`.

```bash
ZIG=/path/to/zig-0.15.2 ./zig/build.sh
node scripts/verify-wasm.mjs
```

The same source emits a scalar `wasm32-freestanding` module and an optional `simd128` module. TypeScript remains the semantic oracle. Candidate ordering and optimizer decisions must remain identical under the declared tolerance and tie policy.

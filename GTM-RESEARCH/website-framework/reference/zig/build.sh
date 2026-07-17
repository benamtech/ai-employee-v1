#!/usr/bin/env sh
set -eu
ZIG="${ZIG:-zig}"
mkdir -p dist/wasm
"$ZIG" test zig/kernel.zig -O ReleaseFast
"$ZIG" build-exe zig/kernel.zig -target wasm32-freestanding -O ReleaseFast -fno-entry --export-memory -femit-bin=dist/wasm/kernel.scalar.wasm
"$ZIG" build-exe zig/kernel.zig -target wasm32-freestanding -mcpu=baseline+simd128 -O ReleaseFast -fno-entry --export-memory -femit-bin=dist/wasm/kernel.simd.wasm

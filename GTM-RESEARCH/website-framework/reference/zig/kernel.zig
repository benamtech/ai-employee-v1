const std = @import("std");

fn sliceConst(ptr: usize, len: usize) []const f32 {
    const many: [*]const f32 = @ptrFromInt(ptr);
    return many[0..len];
}
fn sliceMut(ptr: usize, len: usize) []f32 {
    const many: [*]f32 = @ptrFromInt(ptr);
    return many[0..len];
}

pub fn dotScalar(left: []const f32, right: []const f32) f32 {
    if (left.len != right.len) return std.math.nan(f32);
    var sum: f32 = 0;
    for (left, right) |a, b| sum += a * b;
    return sum;
}

pub fn dotSimd(left: []const f32, right: []const f32) f32 {
    if (left.len != right.len) return std.math.nan(f32);
    const lanes = 4;
    var accumulator: @Vector(lanes, f32) = @splat(0);
    var index: usize = 0;
    while (index + lanes <= left.len) : (index += lanes) {
        const a: @Vector(lanes, f32) = left[index..][0..lanes].*;
        const b: @Vector(lanes, f32) = right[index..][0..lanes].*;
        accumulator += a * b;
    }
    var sum: f32 = @reduce(.Add, accumulator);
    while (index < left.len) : (index += 1) sum += left[index] * right[index];
    return sum;
}

export fn dot_f32_scalar(left_ptr: usize, right_ptr: usize, len: u32) f32 {
    return dotScalar(sliceConst(left_ptr, len), sliceConst(right_ptr, len));
}
export fn dot_f32_simd(left_ptr: usize, right_ptr: usize, len: u32) f32 {
    return dotSimd(sliceConst(left_ptr, len), sliceConst(right_ptr, len));
}
export fn normalize_f32(values_ptr: usize, len: u32) i32 {
    const values = sliceMut(values_ptr, len);
    const squared = dotSimd(values, values);
    if (!std.math.isFinite(squared) or squared <= 0) return 1;
    const magnitude = @sqrt(squared);
    for (values) |*value| value.* /= magnitude;
    return 0;
}
export fn weighted_add_f32(output_ptr: usize, input_ptr: usize, weight: f32, len: u32) void {
    const output = sliceMut(output_ptr, len);
    const input = sliceConst(input_ptr, len);
    for (output, input) |*target, value| target.* += weight * value;
}
export fn facility_marginal_f32(weights_ptr: usize, best_ptr: usize, candidate_ptr: usize, len: u32) f32 {
    const weights = sliceConst(weights_ptr, len);
    const best = sliceConst(best_ptr, len);
    const candidate = sliceConst(candidate_ptr, len);
    var gain: f32 = 0;
    for (weights, best, candidate) |weight, current, proposed| {
        if (proposed > current) gain += weight * (proposed - current);
    }
    return gain;
}

test "scalar and SIMD dot agree" {
    const left = [_]f32{ 1, 2, 3, 4, 5, 6, 7 };
    const right = [_]f32{ 7, 6, 5, 4, 3, 2, 1 };
    try std.testing.expectApproxEqAbs(dotScalar(&left, &right), dotSimd(&left, &right), 0.0001);
}

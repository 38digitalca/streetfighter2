import type { Input } from "./types";

export function emptyInput(): Input {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    punch: false,
    kick: false,
    special: false,
  };
}

export function maskToInput(mask: number): Input {
  const m = Number.isFinite(mask) ? mask & 127 : 0;
  return {
    left: (m & 1) !== 0,
    right: (m & 2) !== 0,
    up: (m & 4) !== 0,
    down: (m & 8) !== 0,
    punch: (m & 16) !== 0,
    kick: (m & 32) !== 0,
    special: (m & 64) !== 0,
  };
}

export function inputToMask(input: Input): number {
  return (
    (input.left ? 1 : 0) |
    (input.right ? 2 : 0) |
    (input.up ? 4 : 0) |
    (input.down ? 8 : 0) |
    (input.punch ? 16 : 0) |
    (input.kick ? 32 : 0) |
    (input.special ? 64 : 0)
  );
}

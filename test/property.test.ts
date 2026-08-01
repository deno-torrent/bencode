import { assertEquals } from "@std/assert";
import { type BencodeValue, decode, encode } from "../mod.ts";

interface RandomState {
  value: number;
}

function nextRandom(state: RandomState): number {
  state.value = (state.value * 1664525 + 1013904223) >>> 0;
  return state.value / 0x1_0000_0000;
}

function randomValue(state: RandomState, depth: number): BencodeValue {
  if (depth >= 3) {
    return randomScalar(state);
  }

  const choice = Math.floor(nextRandom(state) * 5);
  if (choice === 0) return randomScalar(state);
  if (choice === 1) {
    return Array.from(
      { length: Math.floor(nextRandom(state) * 4) },
      () => randomValue(state, depth + 1),
    );
  }

  const result = new Map<string, BencodeValue>();
  const count = Math.floor(nextRandom(state) * 4);
  for (let i = 0; i < count; i++) {
    result.set(`key-${depth}-${i}`, randomValue(state, depth + 1));
  }
  return result;
}

function randomScalar(state: RandomState): BencodeValue {
  const choice = Math.floor(nextRandom(state) * 4);
  if (choice === 0) return Math.floor(nextRandom(state) * 2001) - 1000;
  if (choice === 1) return `value-${Math.floor(nextRandom(state) * 10000)}`;
  if (choice === 2) return "中文🔥";
  return new Uint8Array([0xff, Math.floor(nextRandom(state) * 256)]);
}

Deno.test("property: deterministic nested values round-trip", () => {
  const state = { value: 0x2_0_2_0 };
  for (let i = 0; i < 100; i++) {
    const value = randomValue(state, 0);
    assertEquals(decode(encode(value)), value);
  }
});

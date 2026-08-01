import { assertEquals } from "@std/assert";
import { type BencodeValue, decode, encode } from "../mod.ts";

function roundTrip(value: BencodeValue): BencodeValue {
  return decode(encode(value));
}

Deno.test("roundtrip: scalar values", () => {
  assertEquals(roundTrip(42), 42);
  assertEquals(roundTrip(-42), -42);
  assertEquals(roundTrip("hello"), "hello");
  assertEquals(
    roundTrip(new Uint8Array([0xff, 0, 0xfe])),
    new Uint8Array([0xff, 0, 0xfe]),
  );
  assertEquals(roundTrip(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
  assertEquals(roundTrip("中文🔥"), "中文🔥");
});

Deno.test("roundtrip: empty containers", () => {
  assertEquals(roundTrip([]), []);
  assertEquals(roundTrip(new Map()), new Map());
});

Deno.test("roundtrip: nested Map and array values", () => {
  const info = new Map<string, BencodeValue>([["name", "ubuntu-22.04.iso"], [
    "length",
    1024,
  ]]);
  const value = new Map<string, BencodeValue>([
    ["announce", "https://tracker.example.com/announce"],
    ["announce-list", [["https://tracker.example.com/announce"]]],
    ["info", info],
  ]);
  assertEquals(roundTrip(value), value);
});

Deno.test("roundtrip: binary dictionary keys", () => {
  const key = new Uint8Array([0, 70, 120, 242]);
  const value = new Map<BencodeValue & (string | Uint8Array), BencodeValue>([[
    key,
    new Map([["complete", 1]]),
  ]]);
  const result = roundTrip(value) as Map<string | Uint8Array, BencodeValue>;
  const [decodedKey] = [...result.keys()];
  assertEquals(decodedKey, key);
});

Deno.test("roundtrip: multiple binary keys retain their bytes", () => {
  const first = new Uint8Array([0x01, 0xff]);
  const second = new Uint8Array([0x02, 0xff]);
  const value = new Map([[first, "first"], [second, "second"]]);
  const result = roundTrip(value) as Map<string | Uint8Array, BencodeValue>;
  const keys = [...result.keys()];
  assertEquals(keys[0], first);
  assertEquals(keys[1], second);
});

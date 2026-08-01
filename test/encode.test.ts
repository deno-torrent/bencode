import { assertEquals, assertThrows } from "@std/assert";
import {
  type BencodeDict,
  BencodeEncodeError,
  type BencodeKey,
  type BencodeValue,
  encode,
} from "../mod.ts";

const te = new TextEncoder();
const text = (value: string) => te.encode(value);
const dict = (...entries: [BencodeKey, BencodeValue][]): BencodeDict =>
  new Map(entries);

Deno.test("encode: supported integers", () => {
  assertEquals(encode(0), text("i0e"));
  assertEquals(encode(123), text("i123e"));
  assertEquals(encode(-123), text("i-123e"));
  assertEquals(
    encode(Number.MAX_SAFE_INTEGER),
    text(`i${Number.MAX_SAFE_INTEGER}e`),
  );
});

Deno.test("encode: invalid numbers throw", () => {
  for (const value of [1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assertThrows(() => encode(value), BencodeEncodeError);
  }
});

Deno.test("encode: strings and raw bytes use byte lengths", () => {
  assertEquals(encode("hello"), text("5:hello"));
  assertEquals(encode(""), text("0:"));
  assertEquals(encode("中文"), new Uint8Array([54, 58, ...te.encode("中文")]));
  assertEquals(encode(new Uint8Array()), text("0:"));
  assertEquals(
    encode(new Uint8Array([0xff, 0xfe])),
    new Uint8Array([50, 58, 0xff, 0xfe]),
  );
});

Deno.test("encode: large output grows without chunk accumulation", () => {
  const result = encode("x".repeat(100_000));
  assertEquals(result.length, 100_007);
  assertEquals(result.slice(0, 7), text("100000:"));
});

Deno.test("encode: arrays and Maps are recursive containers", () => {
  assertEquals(encode([]), text("le"));
  assertEquals(encode(new Map()), text("de"));
  assertEquals(
    encode([1, "hello", dict(["a", 2])]),
    text("li1e5:hellod1:ai2eee"),
  );
});

Deno.test("encode: dictionary keys are sorted by raw bytes", () => {
  assertEquals(
    encode(dict(["z", 3], ["a", 1], ["m", 2])),
    text("d1:ai1e1:mi2e1:zi3ee"),
  );
  assertEquals(encode(dict(["😀", 1], ["é", 2])), text("d2:éi2e4:😀i1ee"));
  assertEquals(
    encode(dict([new Uint8Array([0xff]), 1], ["é", 2])),
    new Uint8Array([...text("d2:éi2e1:"), 0xff, ...text("i1ee")]),
  );
});

Deno.test("encode: wire-equivalent dictionary keys are rejected", () => {
  assertThrows(
    () => encode(dict(["a", 1], [new Uint8Array([0x61]), 2])),
    BencodeEncodeError,
  );
});

Deno.test("encode: plain objects are no longer dictionaries in 2.0", () => {
  assertThrows(() => encode({ a: 1 } as never), BencodeEncodeError);
  assertThrows(() => encode(null as never), BencodeEncodeError);
  assertThrows(() => encode(true as never), BencodeEncodeError);
});

Deno.test("encode: cyclic containers throw", () => {
  const list: BencodeValue[] = [];
  list.push(list);
  assertThrows(() => encode(list), BencodeEncodeError);

  const first = new Map<string, BencodeValue>();
  const second = new Map<string, BencodeValue>();
  first.set("second", second);
  second.set("first", first);
  assertThrows(() => encode(first), BencodeEncodeError);
});

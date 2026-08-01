import { assertEquals, assertThrows } from "@std/assert";
import { BencodeDecodeError, type BencodeDict, decode } from "../mod.ts";

const te = new TextEncoder();
const enc = (value: string) => te.encode(value);

Deno.test("decode: supported integers", () => {
  assertEquals(decode(enc("i0e")), 0);
  assertEquals(decode(enc("i123e")), 123);
  assertEquals(decode(enc("i-123e")), -123);
  assertEquals(
    decode(enc(`i${Number.MAX_SAFE_INTEGER}e`)),
    Number.MAX_SAFE_INTEGER,
  );
  assertEquals(
    decode(enc(`i${Number.MIN_SAFE_INTEGER}e`)),
    Number.MIN_SAFE_INTEGER,
  );
});

Deno.test("decode: invalid integers throw", () => {
  for (
    const value of ["i", "ie", "i-0e", "i03e", "i+1e", "i9007199254740992e"]
  ) {
    assertThrows(() => decode(enc(value)), BencodeDecodeError);
  }
});

Deno.test("decode: trailing data throws", () => {
  assertThrows(() => decode(enc("i1ei2e")), BencodeDecodeError);
});

Deno.test("decode: strings preserve UTF-8 and invalid bytes", () => {
  assertEquals(decode(enc("0:")), "");
  assertEquals(decode(enc("5:hello")), "hello");
  assertEquals(decode(new Uint8Array([54, 58, ...te.encode("中文")])), "中文");
  assertEquals(
    decode(new Uint8Array([50, 58, 0xff, 0xfe])),
    new Uint8Array([0xff, 0xfe]),
  );
});

Deno.test("decode: malformed strings throw", () => {
  for (const value of ["5:hel", "1x:a", "01:a", "1:"]) {
    assertThrows(() => decode(enc(value)), BencodeDecodeError);
  }
});

Deno.test("decode: invalid tokens throw", () => {
  assertThrows(() => decode(enc("x")), BencodeDecodeError);
  assertThrows(() => decode(enc("")), BencodeDecodeError);
});

Deno.test("decode: lists become arrays and nested values are preserved", () => {
  assertEquals(decode(enc("le")), []);
  assertEquals(decode(enc("li1e5:hellod1:ai2eee")), [
    1,
    "hello",
    new Map([["a", 2]]),
  ]);
});

Deno.test("decode: unterminated containers throw", () => {
  assertThrows(() => decode(enc("li1e")), BencodeDecodeError);
  assertThrows(() => decode(enc("d1:ai1e")), BencodeDecodeError);
});

Deno.test("decode: dictionaries become Maps", () => {
  const value = decode(enc("d1:ai1e1:bi2ee")) as BencodeDict;
  assertEquals(value, new Map([["a", 1], ["b", 2]]));
  assertEquals(value instanceof Map, true);
});

Deno.test("decode: empty dictionary becomes an empty Map", () => {
  assertEquals(decode(enc("de")), new Map());
});

Deno.test("decode: binary dictionary keys remain Uint8Array", () => {
  const value = decode(
    new Uint8Array([100, 49, 58, 0xff, 105, 49, 101, 101]),
  ) as BencodeDict;
  const [key, item] = [...value.entries()][0];
  assertEquals(key, new Uint8Array([0xff]));
  assertEquals(item, 1);
});

Deno.test("decode: unsorted dictionary keys are rejected by default", () => {
  assertThrows(
    () => decode(enc("d1:b1:x1:a1:ye")),
    BencodeDecodeError,
    "dictionary keys are not sorted by raw bytes",
  );
});

Deno.test("decode: unsorted dictionary keys can be allowed explicitly", () => {
  assertEquals(
    decode(enc("d1:b1:x1:a1:ye"), { allowUnsortedKeys: true }),
    new Map([["b", "x"], ["a", "y"]]),
  );
});

Deno.test("decode: duplicate keys remain invalid when unsorted keys are allowed", () => {
  assertThrows(
    () => decode(enc("d1:a1:x1:a1:ye"), { allowUnsortedKeys: true }),
    BencodeDecodeError,
    "duplicate dictionary key",
  );
});

Deno.test("decode: compatibility mode still rejects malformed input", () => {
  for (
    const value of [
      "d1:ai01ee",
      "d1:a01:xe",
      "d1:a2:xe",
      "d1:a1:xe1:x",
      "d1:axe",
    ]
  ) {
    assertThrows(
      () => decode(enc(value), { allowUnsortedKeys: true }),
      BencodeDecodeError,
    );
  }
});

Deno.test("decode: duplicate binary dictionary keys throw", () => {
  const encoded = new Uint8Array([
    100,
    49,
    58,
    0xff,
    105,
    49,
    101,
    49,
    58,
    0xff,
    105,
    50,
    101,
    101,
  ]);
  assertThrows(() => decode(encoded), BencodeDecodeError);
});

Deno.test("decode: binary and UTF-8 keys are compared by wire bytes", () => {
  const value = decode(
    new Uint8Array([
      100,
      50,
      58,
      0xc3,
      0xa9,
      105,
      50,
      101,
      49,
      58,
      0xff,
      105,
      49,
      101,
      101,
    ]),
  );
  assertEquals([...value as BencodeDict].length, 2);
});

Deno.test("decode: resource limits are enforced", () => {
  assertThrows(() => decode(enc("i1e"), { maxBytes: 2 }), BencodeDecodeError);
  assertEquals(decode(enc("i1e"), { maxBytes: 3 }), 1);
  assertThrows(
    () => decode(enc("llleee"), { maxDepth: 1 }),
    BencodeDecodeError,
  );
  assertEquals(decode(enc("le"), { maxDepth: 0 }), []);
});

Deno.test("decode: compatibility mode still enforces resource limits", () => {
  const unsorted = enc("d1:b1:x1:a1:ye");
  assertThrows(
    () =>
      decode(unsorted, {
        allowUnsortedKeys: true,
        maxBytes: unsorted.length - 1,
      }),
    BencodeDecodeError,
  );
  assertThrows(
    () =>
      decode(enc("d1:bd1:b1:x1:a1:yee"), {
        allowUnsortedKeys: true,
        maxDepth: 0,
      }),
    BencodeDecodeError,
  );
});

Deno.test("decode: libtorrent-style KRPC response preserves binary fields", () => {
  const ip = new Uint8Array([0x43, 0xd7, 0x3a, 0x52, 0x63, 0x39]);
  const id = new Uint8Array([
    0xff,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
  ]);
  const transactionId = new Uint8Array([0xfe, 0x00]);
  const data = new Uint8Array([
    ...enc("d2:ip6:"),
    ...ip,
    ...enc("1:rd2:id20:"),
    ...id,
    ...enc("e1:t2:"),
    ...transactionId,
    ...enc("1:y1:r1:v4:LT\x01\x02e"),
  ]);

  assertThrows(
    () => decode(data),
    BencodeDecodeError,
    "dictionary keys are not sorted by raw bytes",
  );

  const response = decode(data, { allowUnsortedKeys: true }) as BencodeDict;
  assertEquals([...response.keys()], ["ip", "r", "t", "y", "v"]);
  assertEquals(response.get("ip"), ip);
  assertEquals((response.get("r") as BencodeDict).get("id"), id);
  assertEquals(response.get("t"), transactionId);
  assertEquals(response.get("y"), "r");
  assertEquals(response.get("v"), "LT\x01\x02");
});

Deno.test("decode: invalid resource limits throw", () => {
  assertThrows(() => decode(enc("i1e"), { maxBytes: -1 }), BencodeDecodeError);
  assertThrows(() => decode(enc("i1e"), { maxBytes: 1.5 }), BencodeDecodeError);
  assertThrows(() => decode(enc("i1e"), { maxDepth: -1 }), BencodeDecodeError);
});

Deno.test("decode: deep input is rejected at the default depth limit", () => {
  const tooDeep = `${"l".repeat(1002)}${"e".repeat(1002)}`;
  assertThrows(() => decode(enc(tooDeep)), BencodeDecodeError);
});

Deno.test("decode: explicit stack accepts the configured depth", () => {
  const depth = 1000;
  const nested = `${"l".repeat(depth)}${"e".repeat(depth)}`;
  let current = decode(enc(nested), { maxDepth: depth }) as unknown[];
  for (let level = 0; level < depth - 1; level++) {
    assertEquals(current.length, 1);
    current = current[0] as unknown[];
  }
  assertEquals(current.length, 0);
});

Deno.test("decode: Ubuntu torrent sample", async () => {
  const data = await Deno.readFile(
    "test/torrent/ubuntu-22.04.2-live-server-amd64.iso.torrent",
  );
  const torrent = decode(data) as BencodeDict;
  const info = torrent.get("info") as BencodeDict;
  assertEquals(torrent.get("announce"), "https://torrent.ubuntu.com/announce");
  assertEquals(info.get("piece length"), 262144);
  assertEquals((info.get("pieces") as string).length, 150760);
});

Deno.test("decode: Ubuntu tracker sample preserves binary info hash key", async () => {
  const data = await Deno.readFile("test/tracker/ubuntu_tracker_scrape");
  const result = decode(data) as BencodeDict;
  const files = result.get("files") as BencodeDict;
  const [key] = [...files.keys()];
  assertEquals(
    key,
    new Uint8Array([
      0,
      70,
      120,
      242,
      226,
      120,
      16,
      48,
      188,
      87,
      115,
      122,
      135,
      250,
      247,
      170,
      251,
      23,
      79,
      248,
    ]),
  );
});

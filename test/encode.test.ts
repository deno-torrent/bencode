import { assertEquals, assertThrows } from '@std/assert'
import { BencodeEncodeError, encode } from '../mod.ts'

const te = new TextEncoder()
const enc = (s: string) => te.encode(s)

// ── Integers ──────────────────────────────────────────────────────────────────

Deno.test('encode: positive integer', () => {
  assertEquals(encode(123), enc('i123e'))
})

Deno.test('encode: negative integer', () => {
  assertEquals(encode(-123), enc('i-123e'))
})

Deno.test('encode: zero', () => {
  assertEquals(encode(0), enc('i0e'))
})

Deno.test('encode: MAX_SAFE_INTEGER', () => {
  assertEquals(encode(Number.MAX_SAFE_INTEGER), enc(`i${Number.MAX_SAFE_INTEGER}e`))
})

Deno.test('encode: MIN_SAFE_INTEGER', () => {
  assertEquals(encode(Number.MIN_SAFE_INTEGER), enc(`i${Number.MIN_SAFE_INTEGER}e`))
})

Deno.test('encode: float throws BencodeEncodeError', () => {
  assertThrows(() => encode(1.5), BencodeEncodeError)
})

Deno.test('encode: NaN throws BencodeEncodeError', () => {
  assertThrows(() => encode(NaN), BencodeEncodeError)
})

Deno.test('encode: Infinity throws BencodeEncodeError', () => {
  assertThrows(() => encode(Infinity), BencodeEncodeError)
})

// ── Strings ───────────────────────────────────────────────────────────────────

Deno.test('encode: ASCII string', () => {
  assertEquals(encode('hello'), enc('5:hello'))
})

Deno.test('encode: empty string', () => {
  assertEquals(encode(''), enc('0:'))
})

Deno.test('encode: UTF-8 multibyte string (length prefix = byte count, not char count)', () => {
  // '中文' = 2 chars but 6 UTF-8 bytes → prefix must be "6:", not "2:"
  assertEquals(encode('中文'), new Uint8Array([54, 58, ...te.encode('中文')]))
})

Deno.test('encode: emoji string (4-byte codepoint)', () => {
  // '🎉' = 1 char but 4 UTF-8 bytes → prefix must be "4:"
  assertEquals(encode('🎉'), new Uint8Array([52, 58, ...te.encode('🎉')]))
})

Deno.test('encode: mixed ASCII and CJK', () => {
  // 'a中' = 2 chars but 4 UTF-8 bytes
  assertEquals(encode('a中'), new Uint8Array([52, 58, ...te.encode('a中')]))
})

// ── Uint8Array ────────────────────────────────────────────────────────────────

Deno.test('encode: Uint8Array of ASCII bytes', () => {
  assertEquals(encode(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f])), enc('5:hello'))
})

Deno.test('encode: Uint8Array with non-UTF-8 bytes', () => {
  assertEquals(encode(new Uint8Array([0xff, 0xfe])), new Uint8Array([50, 58, 0xff, 0xfe]))
})

Deno.test('encode: empty Uint8Array', () => {
  assertEquals(encode(new Uint8Array(0)), enc('0:'))
})

// ── Lists ─────────────────────────────────────────────────────────────────────

Deno.test('encode: simple integer list', () => {
  assertEquals(encode([1, 2, 3]), enc('li1ei2ei3ee'))
})

Deno.test('encode: empty list', () => {
  assertEquals(encode([]), enc('le'))
})

Deno.test('encode: list with empty string', () => {
  assertEquals(encode(['']), enc('l0:e'))
})

Deno.test('encode: mixed-type list', () => {
  assertEquals(
    encode([1, 'hello', [1, 2, 3], { a: 1, b: 2 }]),
    enc('li1e5:helloli1ei2ei3eed1:ai1e1:bi2eee')
  )
})

Deno.test('encode: nested lists', () => {
  assertEquals(encode([[1, 2], [3, 4]]), enc('lli1ei2eeli3ei4eee'))
})

// ── Dicts ─────────────────────────────────────────────────────────────────────

Deno.test('encode: simple dict', () => {
  assertEquals(encode({ a: 1, b: 2 }), enc('d1:ai1e1:bi2ee'))
})

Deno.test('encode: dict keys are sorted lexicographically', () => {
  // Keys fed in reverse order — output must still be sorted
  assertEquals(encode({ z: 3, a: 1, m: 2 }), enc('d1:ai1e1:mi2e1:zi3ee'))
})

Deno.test('encode: empty dict', () => {
  assertEquals(encode({}), enc('de'))
})

Deno.test('encode: nested dict', () => {
  assertEquals(
    encode({ info: { name: 'test', length: 1024 } }),
    enc('d4:infod6:lengthi1024e4:name4:testee')
  )
})

// ── BitTorrent-specific ───────────────────────────────────────────────────────

Deno.test('encode: dict with binary Uint8Array value (torrent pieces)', () => {
  const pieces = new Uint8Array([0xaa, 0xf4, 0xc6, 0x1d, 0xdc, 0xc5, 0xe8, 0xa2, 0xda, 0xbe])
  const result = encode({ pieces })
  const expected = new Uint8Array([
    100,                                                                // 'd'
    54, 58, 112, 105, 101, 99, 101, 115,                              // '6:pieces'
    49, 48, 58,                                                        // '10:'
    0xaa, 0xf4, 0xc6, 0x1d, 0xdc, 0xc5, 0xe8, 0xa2, 0xda, 0xbe,     // raw bytes
    101                                                                // 'e'
  ])
  assertEquals(result, expected)
})

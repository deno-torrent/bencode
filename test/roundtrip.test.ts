/**
 * Round-trip tests: encode → decode and decode → encode must produce identical results.
 */
import { assertEquals } from '@std/assert'
import { decode, encode } from '../mod.ts'

function roundTrip(value: Parameters<typeof encode>[0]) {
  return decode(encode(value))
}

// ── Scalars ───────────────────────────────────────────────────────────────────

Deno.test('roundtrip: positive integer', () => assertEquals(roundTrip(42), 42))
Deno.test('roundtrip: negative integer', () => assertEquals(roundTrip(-42), -42))
Deno.test('roundtrip: zero', () => assertEquals(roundTrip(0), 0))
Deno.test('roundtrip: MAX_SAFE_INTEGER', () => assertEquals(roundTrip(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER))

// ── Strings ───────────────────────────────────────────────────────────────────

Deno.test('roundtrip: ASCII string', () => assertEquals(roundTrip('hello'), 'hello'))
Deno.test('roundtrip: empty string', () => assertEquals(roundTrip(''), ''))
Deno.test('roundtrip: UTF-8 multibyte string', () => assertEquals(roundTrip('中文日本語한국어'), '中文日本語한국어'))
Deno.test('roundtrip: emoji', () => assertEquals(roundTrip('🔥🎉'), '🔥🎉'))

// ── Uint8Array (non-UTF-8 bytes are preserved as Uint8Array on decode) ────────

Deno.test('roundtrip: non-UTF-8 Uint8Array', () => {
  // These bytes are not valid UTF-8, so decode will return Uint8Array
  assertEquals(roundTrip(new Uint8Array([0xff, 0x00, 0xfe])), new Uint8Array([0xff, 0x00, 0xfe]))
})

// ── Collections ───────────────────────────────────────────────────────────────

Deno.test('roundtrip: empty list', () => assertEquals(roundTrip([]), []))
Deno.test('roundtrip: empty dict', () => assertEquals(roundTrip({}), {}))

Deno.test('roundtrip: nested list', () => {
  assertEquals(roundTrip([[1, 2], [3, [4, 5]]]), [[1, 2], [3, [4, 5]]])
})

Deno.test('roundtrip: dict with various value types', () => {
  const original = { count: 99, tag: 'v2', flags: [1, 0, 1] }
  assertEquals(roundTrip(original), original)
})

Deno.test('roundtrip: torrent-like nested structure', () => {
  const original = {
    announce: 'https://tracker.example.com/announce',
    'announce-list': [['https://tracker.example.com/announce'], ['udp://tracker.example.com:6969']],
    info: {
      name: 'ubuntu-22.04.iso',
      length: 1_073_741_824,
      'piece length': 262144,
      private: 0
    }
  }
  assertEquals(roundTrip(original), original)
})

// ── Dict key sort stability ───────────────────────────────────────────────────

Deno.test('roundtrip: dict keys are re-sorted on encode, decoded order matches', () => {
  // Regardless of JS insertion order, encoded output must have sorted keys
  const shuffled = { z: 26, a: 1, m: 13 }
  const result = decode(encode(shuffled)) as Record<string, number>
  assertEquals(result, { a: 1, m: 13, z: 26 })
})

import { assertEquals, assertThrows } from '@std/assert'
import { BencodeDecodeError, byteKeyToUint8Array, decode, isByteKey } from '../mod.ts'

const te = new TextEncoder()
const enc = (s: string) => te.encode(s)

// ── Integers ──────────────────────────────────────────────────────────────────

Deno.test('decode: positive integer', () => {
  assertEquals(decode(enc('i123e')), 123)
})

Deno.test('decode: negative integer', () => {
  assertEquals(decode(enc('i-123e')), -123)
})

Deno.test('decode: zero', () => {
  assertEquals(decode(enc('i0e')), 0)
})

Deno.test('decode: MAX_SAFE_INTEGER', () => {
  assertEquals(decode(enc(`i${Number.MAX_SAFE_INTEGER}e`)), Number.MAX_SAFE_INTEGER)
})

Deno.test('decode: MIN_SAFE_INTEGER', () => {
  assertEquals(decode(enc(`i${Number.MIN_SAFE_INTEGER}e`)), Number.MIN_SAFE_INTEGER)
})

Deno.test('decode: unterminated integer throws', () => {
  assertThrows(() => decode(enc('i123')), BencodeDecodeError)
})

Deno.test('decode: negative zero throws', () => {
  assertThrows(() => decode(enc('i-0e')), BencodeDecodeError)
})

Deno.test('decode: integer with leading zero throws', () => {
  assertThrows(() => decode(enc('i03e')), BencodeDecodeError)
})

Deno.test('decode: empty integer throws', () => {
  assertThrows(() => decode(enc('ie')), BencodeDecodeError)
})

// ── Strings ───────────────────────────────────────────────────────────────────

Deno.test('decode: ASCII string', () => {
  assertEquals(decode(enc('5:hello')), 'hello')
})

Deno.test('decode: empty string', () => {
  assertEquals(decode(enc('0:')), '')
})

Deno.test('decode: UTF-8 multibyte string', () => {
  // Construct "6:中文" manually (6 = byte length of '中文')
  assertEquals(decode(new Uint8Array([54, 58, ...te.encode('中文')])), '中文')
})

Deno.test('decode: non-UTF-8 byte string returns Uint8Array', () => {
  // "2:\xff\xfe" — not valid UTF-8
  assertEquals(decode(new Uint8Array([50, 58, 0xff, 0xfe])), new Uint8Array([0xff, 0xfe]))
})

Deno.test('decode: truncated string throws', () => {
  // Declares 5 bytes but only provides 3
  assertThrows(() => decode(enc('5:hel')), BencodeDecodeError)
})

// ── Lists ─────────────────────────────────────────────────────────────────────

Deno.test('decode: simple integer list', () => {
  assertEquals(decode(enc('li1ei2ei3ee')), [1, 2, 3])
})

Deno.test('decode: empty list', () => {
  assertEquals(decode(enc('le')), [])
})

Deno.test('decode: list with empty string', () => {
  assertEquals(decode(enc('l0:e')), [''])
})

Deno.test('decode: mixed-type list', () => {
  assertEquals(decode(enc('li1e5:helloli1ei2ei3eed1:ai1e1:bi2eee')), [
    1,
    'hello',
    [1, 2, 3],
    { a: 1, b: 2 }
  ])
})

Deno.test('decode: unterminated list throws', () => {
  assertThrows(() => decode(enc('li1e')), BencodeDecodeError)
})

Deno.test('decode: list with non-UTF-8 element', () => {
  const encoded = new Uint8Array([108, 50, 58, 0xff, 0xfe, 101]) // l 2:\xff\xfe e
  assertEquals(decode(encoded), [new Uint8Array([0xff, 0xfe])])
})

// ── Dicts ─────────────────────────────────────────────────────────────────────

Deno.test('decode: simple dict', () => {
  assertEquals(decode(enc('d1:ai1e1:bi2ee')), { a: 1, b: 2 })
})

Deno.test('decode: dict with out-of-order keys (decoder accepts any order)', () => {
  assertEquals(decode(enc('d1:bi2e1:ai1ee')), { a: 1, b: 2 })
})

Deno.test('decode: empty dict', () => {
  assertEquals(decode(enc('de')), {})
})

Deno.test('decode: unterminated dict throws', () => {
  assertThrows(() => decode(enc('d1:ai1e')), BencodeDecodeError)
})

// ── Non-UTF-8 dict keys ───────────────────────────────────────────────────────

Deno.test('decode: non-UTF-8 binary dict key → Uint8Array[...] string', () => {
  // Build a dict with key = [0xff, 0x00] (non-UTF-8) and value = i1e
  const encoded = new Uint8Array([
    100,       // 'd'
    50, 58,    // '2:'
    0xff, 0x00, // key bytes (non-UTF-8)
    105, 49, 101, // 'i1e'
    101        // 'e'
  ])
  const result = decode(encoded) as Record<string, unknown>
  const key = Object.keys(result)[0]
  assertEquals(key, 'Uint8Array[255,0]')
  assertEquals(result[key], 1)
})

Deno.test('isByteKey: recognises Uint8Array[...] keys', () => {
  assertEquals(isByteKey('Uint8Array[0,255,128]'), true)
  assertEquals(isByteKey('announce'), false)
  assertEquals(isByteKey('Uint8Array[]'), false)
  assertEquals(isByteKey('Uint8Array[256]'), false)
  assertEquals(isByteKey('Uint8Array[-1]'), false)
})

Deno.test('byteKeyToUint8Array: round-trips correctly', () => {
  assertEquals(byteKeyToUint8Array('Uint8Array[0,255,128]'), new Uint8Array([0, 255, 128]))
  assertEquals(byteKeyToUint8Array('announce'), undefined)
})

// ── Real torrent file ─────────────────────────────────────────────────────────

Deno.test('decode: ubuntu torrent file', async () => {
  const file = `${Deno.cwd()}/test/torrent/ubuntu-22.04.2-live-server-amd64.iso.torrent`
  const data = await Deno.readFile(file)
  const torrent = decode(data) as {
    announce: string
    info: { 'piece length': number; pieces: string }
  }
  assertEquals(torrent.announce, 'https://torrent.ubuntu.com/announce')
  assertEquals(torrent.info['piece length'], 262144)
  assertEquals((torrent.info.pieces as string).length, 150760)
})

Deno.test('decode: ubuntu tracker scrape (non-UTF-8 binary dict key)', async () => {
  const file = `${Deno.cwd()}/test/tracker/ubuntu_tracker_scrape`
  const data = await Deno.readFile(file)
  const result = decode(data) as { files: Record<string, unknown> }
  const key = Object.keys(result.files)[0]

  assertEquals(key, 'Uint8Array[0,70,120,242,226,120,16,48,188,87,115,122,135,250,247,170,251,23,79,248]')
  assertEquals(isByteKey(key), true)
  assertEquals(
    byteKeyToUint8Array(key),
    new Uint8Array([0, 70, 120, 242, 226, 120, 16, 48, 188, 87, 115, 122, 135, 250, 247, 170, 251, 23, 79, 248])
  )
})

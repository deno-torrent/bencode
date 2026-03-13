/**
 * Bencode decoder — synchronous, zero external dependencies.
 * @module
 */

import { BencodeDecodeError, type BencodeDict, type BencodeList, type BencodeValue } from './types.ts'

// TextDecoder with fatal=true rejects invalid UTF-8; fatal=false replaces bad bytes with U+FFFD.
const _tdFatal = new TextDecoder('utf-8', { fatal: true })
const _tdLossy = new TextDecoder('utf-8', { fatal: false })

/**
 * Prefix used to represent non-UTF-8 binary dictionary keys as a string.
 *
 * When a dictionary key cannot be decoded as valid UTF-8, it is serialized as:
 * `"Uint8Array[b0,b1,...,bn]"`
 *
 * Use {@link isByteKey} and {@link byteKeyToUint8Array} to detect and recover these keys.
 */
export const BYTE_KEY_PREFIX = 'Uint8Array['

/**
 * Decode bencode bytes into a JavaScript value.
 *
 * Decoding rules:
 * - Integers → `number`
 * - Valid UTF-8 byte strings → `string`
 * - Non-UTF-8 byte strings → `Uint8Array`
 * - Lists → `Array`
 * - Dicts → `object` (non-UTF-8 keys are encoded as `"Uint8Array[b0,b1,...]"`)
 *
 * @param data - Bencode-encoded bytes.
 * @returns Decoded JavaScript value.
 * @throws {BencodeDecodeError} On malformed or truncated input.
 *
 * @example
 * ```ts
 * import { decode } from './mod.ts'
 *
 * decode(new TextEncoder().encode('5:hello'))  // => 'hello'
 * decode(new TextEncoder().encode('i42e'))     // => 42
 * decode(new TextEncoder().encode('le'))       // => []
 * ```
 */
export function decode(data: Uint8Array): BencodeValue {
  const [value] = _decodeValue(data, 0)
  return value
}

/**
 * Test whether a string is a non-UTF-8 binary key encoded as `"Uint8Array[b0,b1,...]"`.
 *
 * @example
 * ```ts
 * isByteKey('Uint8Array[0,1,255]')   // true
 * isByteKey('announce')              // false
 * ```
 */
export function isByteKey(key: string): boolean {
  if (!key.startsWith(BYTE_KEY_PREFIX) || !key.endsWith(']')) return false
  const inner = key.slice(BYTE_KEY_PREFIX.length, -1)
  if (inner === '') return false
  for (const part of inner.split(',')) {
    const n = Number(part)
    if (!Number.isInteger(n) || n < 0 || n > 255) return false
  }
  return true
}

/**
 * Convert a byte key string back to its original `Uint8Array`.
 * Returns `undefined` if the input is not a valid byte key.
 *
 * @example
 * ```ts
 * byteKeyToUint8Array('Uint8Array[0,255]')  // => Uint8Array([0, 255])
 * byteKeyToUint8Array('hello')              // => undefined
 * ```
 */
export function byteKeyToUint8Array(key: string): Uint8Array | undefined {
  if (!isByteKey(key)) return undefined
  const parts = key.slice(BYTE_KEY_PREFIX.length, -1).split(',')
  return new Uint8Array(parts.map(Number))
}

// ─── Internal implementation ──────────────────────────────────────────────────

/** Decode a single bencode value starting at `offset`. Returns `[value, nextOffset]`. */
function _decodeValue(data: Uint8Array, offset: number): [BencodeValue, number] {
  if (offset >= data.length) {
    throw new BencodeDecodeError(`unexpected end of data at offset ${offset}`)
  }

  const b = data[offset]

  if (b === 0x69 /* 'i' */) return _decodeInteger(data, offset + 1)
  if (b === 0x6c /* 'l' */) return _decodeList(data, offset + 1)
  if (b === 0x64 /* 'd' */) return _decodeDict(data, offset + 1)
  if (b >= 0x30 && b <= 0x39 /* '0'–'9' */) return _decodeByteString(data, offset)

  throw new BencodeDecodeError(
    `unexpected token 0x${b.toString(16).padStart(2, '0')} at offset ${offset}`
  )
}

/** Parse `i<digits>e` — cursor is positioned after `'i'`. */
function _decodeInteger(data: Uint8Array, offset: number): [number, number] {
  const end = data.indexOf(0x65, offset) // 'e'
  if (end === -1) throw new BencodeDecodeError('unterminated integer: missing "e"')

  const raw = _tdLossy.decode(data.subarray(offset, end))
  if (raw === '') throw new BencodeDecodeError('empty integer literal')
  if (raw === '-0') throw new BencodeDecodeError('negative zero "-0" is not valid in bencode')
  if (/^-?0\d/.test(raw)) throw new BencodeDecodeError(`integer with leading zero: "${raw}"`)

  const n = Number(raw)
  if (!Number.isInteger(n)) throw new BencodeDecodeError(`invalid integer: "${raw}"`)

  return [n, end + 1]
}

/** Parse `<length>:<bytes>` — cursor is at the first digit. */
function _decodeByteString(data: Uint8Array, offset: number): [string | Uint8Array, number] {
  const colon = data.indexOf(0x3a, offset) // ':'
  if (colon === -1) throw new BencodeDecodeError('malformed byte string: missing ":"')

  const length = parseInt(_tdLossy.decode(data.subarray(offset, colon)), 10)
  if (!Number.isFinite(length) || length < 0) {
    throw new BencodeDecodeError(`invalid byte string length at offset ${offset}`)
  }

  const start = colon + 1
  const end = start + length
  if (end > data.length) {
    throw new BencodeDecodeError(
      `truncated byte string: need ${length} bytes but only ${data.length - start} available`
    )
  }

  const bytes = data.subarray(start, end)
  try {
    // Try to decode as UTF-8; if it fails, return a copy of the raw bytes
    return [_tdFatal.decode(bytes), end]
  } catch {
    return [bytes.slice(), end]
  }
}

/** Parse `l<items>e` — cursor is positioned after `'l'`. */
function _decodeList(data: Uint8Array, offset: number): [BencodeList, number] {
  const list: BencodeList = []
  while (true) {
    if (offset >= data.length) throw new BencodeDecodeError('unterminated list: missing "e"')
    if (data[offset] === 0x65 /* 'e' */) return [list, offset + 1]

    const [item, next] = _decodeValue(data, offset)
    list.push(item)
    offset = next
  }
}

/** Parse `d<key-value-pairs>e` — cursor is positioned after `'d'`. */
function _decodeDict(data: Uint8Array, offset: number): [BencodeDict, number] {
  const dict: BencodeDict = {}
  while (true) {
    if (offset >= data.length) throw new BencodeDecodeError('unterminated dict: missing "e"')
    if (data[offset] === 0x65 /* 'e' */) return [dict, offset + 1]

    // Keys are always byte strings in bencode
    const [rawKey, afterKey] = _decodeByteString(data, offset)
    offset = afterKey

    // Non-UTF-8 keys are stored as a "Uint8Array[b0,b1,...]" string representation
    const key =
      rawKey instanceof Uint8Array
        ? `${BYTE_KEY_PREFIX}${Array.from(rawKey).join(',')}]`
        : rawKey

    const [value, afterValue] = _decodeValue(data, offset)
    offset = afterValue

    dict[key] = value
  }
}

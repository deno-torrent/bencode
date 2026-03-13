/**
 * Bencode encoder — synchronous, zero external dependencies.
 * @module
 */

import { type BencodeDict, BencodeEncodeError, type BencodeList, type BencodeValue } from './types.ts'

const _te = new TextEncoder()

/**
 * Encode a JavaScript value into bencode format.
 *
 * Supported types:
 * - **integer** (`number`): must be a safe integer
 * - **string**: encoded as UTF-8; length prefix is **byte count**, not character count
 * - **Uint8Array**: written as raw bytes
 * - **Array**: bencode list
 * - **object**: bencode dictionary; keys are sorted lexicographically
 *
 * @param value - The value to encode.
 * @returns Bencode-encoded `Uint8Array`.
 * @throws {BencodeEncodeError} If value contains a non-integer number or an unsupported type.
 *
 * @example
 * ```ts
 * import { encode } from './mod.ts'
 *
 * encode('hello')                         // Uint8Array → "5:hello"
 * encode(42)                              // Uint8Array → "i42e"
 * encode(['a', 1])                        // Uint8Array → "l1:ai1ee"
 * encode({ cow: 'moo', spam: 'eggs' })    // Uint8Array → "d3:cow3:moo4:spam4:eggse"
 * ```
 */
export function encode(value: BencodeValue): Uint8Array {
  const chunks: Uint8Array[] = []
  _encodeValue(value, chunks)
  return _concat(chunks)
}

function _encodeValue(value: BencodeValue, out: Uint8Array[]): void {
  if (typeof value === 'number') {
    _encodeInteger(value, out)
  } else if (typeof value === 'string') {
    _encodeString(value, out)
  } else if (value instanceof Uint8Array) {
    _encodeRawBytes(value, out)
  } else if (Array.isArray(value)) {
    _encodeList(value, out)
  } else if (typeof value === 'object' && value !== null) {
    _encodeDict(value as BencodeDict, out)
  } else {
    throw new BencodeEncodeError(`unsupported value type: ${typeof value}`)
  }
}

function _encodeInteger(n: number, out: Uint8Array[]): void {
  if (!Number.isInteger(n) || !Number.isFinite(n)) {
    throw new BencodeEncodeError(`only safe integers are supported, got: ${n}`)
  }
  out.push(_te.encode(`i${n}e`))
}

function _encodeString(s: string, out: Uint8Array[]): void {
  const bytes = _te.encode(s)
  // Length prefix MUST be the byte count, not the character count (critical for multibyte UTF-8)
  out.push(_te.encode(`${bytes.length}:`))
  out.push(bytes)
}

function _encodeRawBytes(b: Uint8Array, out: Uint8Array[]): void {
  out.push(_te.encode(`${b.length}:`))
  out.push(b)
}

function _encodeList(list: BencodeList, out: Uint8Array[]): void {
  out.push(_te.encode('l'))
  for (const item of list) {
    _encodeValue(item, out)
  }
  out.push(_te.encode('e'))
}

function _encodeDict(dict: BencodeDict, out: Uint8Array[]): void {
  out.push(_te.encode('d'))
  // Keys MUST be sorted in lexicographic order per the bencode specification
  for (const key of Object.keys(dict).sort()) {
    _encodeString(key, out)
    _encodeValue(dict[key], out)
  }
  out.push(_te.encode('e'))
}

/** Concatenate an array of Uint8Array chunks into a single Uint8Array. */
function _concat(chunks: Uint8Array[]): Uint8Array {
  let total = 0
  for (const c of chunks) total += c.length
  const out = new Uint8Array(total)
  let pos = 0
  for (const c of chunks) {
    out.set(c, pos)
    pos += c.length
  }
  return out
}

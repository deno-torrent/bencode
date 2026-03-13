/**
 * Bencode type definitions and custom error classes.
 * @module
 */

/**
 * Bencode integer.
 * Must be a safe integer within `[Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]`.
 */
export type BencodeInteger = number

/**
 * Bencode byte string.
 * - `string` values are UTF-8 encoded on the wire.
 * - `Uint8Array` values are written as raw bytes.
 */
export type BencodeByteString = string | Uint8Array

/** Bencode list — an ordered sequence of bencode values. */
export type BencodeList = BencodeValue[]

/**
 * Bencode dictionary — string-keyed map.
 * Keys are sorted lexicographically (by raw bytes) when encoding.
 * Non-UTF-8 binary keys are represented as `"Uint8Array[b0,b1,...]"` strings on decode.
 */
export type BencodeDict = { [key: string]: BencodeValue }

/** Union of all supported bencode value types. */
export type BencodeValue = BencodeInteger | BencodeByteString | BencodeList | BencodeDict

/**
 * Thrown when encoding fails due to an invalid or unsupported value.
 * @example
 * ```ts
 * encode(1.5)   // throws BencodeEncodeError: only integers are supported
 * encode(null)  // throws BencodeEncodeError: unsupported value type
 * ```
 */
export class BencodeEncodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BencodeEncodeError'
  }
}

/**
 * Thrown when decoding fails due to malformed or truncated bencode input.
 * @example
 * ```ts
 * decode(new TextEncoder().encode('i123'))  // throws BencodeDecodeError: unterminated integer
 * ```
 */
export class BencodeDecodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BencodeDecodeError'
  }
}

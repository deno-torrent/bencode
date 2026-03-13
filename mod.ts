/**
 * bencode — a fast, zero-dependency bencode encoder/decoder for Deno.
 *
 * @example
 * ```ts
 * import { encode, decode } from 'jsr:@deno-torrent/bencode'
 *
 * const bytes = encode({ announce: 'https://tracker.example.com', info: { name: 'test', length: 1024 } })
 * const value = decode(bytes)
 * ```
 *
 * @module
 */

export type { BencodeByteString, BencodeDict, BencodeInteger, BencodeList, BencodeValue } from './src/types.ts'
export { BencodeDecodeError, BencodeEncodeError } from './src/types.ts'
export { encode } from './src/encode.ts'
export { BYTE_KEY_PREFIX, byteKeyToUint8Array, decode, isByteKey } from './src/decode.ts'

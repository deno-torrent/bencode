import { Buffer } from 'std/io/mod.ts'

export type BencodeInteger = number
export type BencodeDict = { [key: string]: BencodeType }
export type BencodeList = Array<BencodeType>
export type BencodeString = string | Uint8Array
export type BencodeType = BencodeInteger | BencodeDict | BencodeList | BencodeString

export function isBencodeInteger(data: BencodeType): data is BencodeInteger {
  return typeof data === 'number' && Number.isInteger(data)
}

export function isBencodeDict(data: BencodeType): data is BencodeDict {
  return typeof data === 'object' && data !== null && !Array.isArray(data)
}

export function isBencodeList(data: BencodeType): data is BencodeList {
  return Array.isArray(data)
}

export function isBencodeString(data: BencodeType): data is BencodeString {
  return typeof data === 'string' || data instanceof Uint8Array || data instanceof Buffer
}

import { Bencoder } from '../mod.ts'
import { assertEquals, assertThrows } from './deps.ts'

const encoder = new Bencoder()
const textEncoder = new TextEncoder()

// 字符串编码测试
Deno.test('encode string', () => {
  assertEquals(textEncoder.encode('5:hello'), encoder.encode('hello'))
})

Deno.test('encode utf-8 string', () => {
  assertEquals(textEncoder.encode('5:hello'), encoder.encode('hello'))
})

Deno.test('encode empty string', () => {
  assertEquals(encoder.encode(''), textEncoder.encode('0:'))
})

Deno.test('encode buffer string', () => {
  assertEquals(encoder.encode(Uint8Array.from([0x68, 0x65, 0x6c, 0x6c, 0x6f])), textEncoder.encode('5:hello'))
})

Deno.test('encode Uint8Array string', () => {
  const u8 = new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f])
  assertEquals(encoder.encode(u8), textEncoder.encode('5:hello'))
})

// 整数编码测试
Deno.test('encode number', () => {
  assertEquals(encoder.encode(123), textEncoder.encode('i123e'))
})

Deno.test('encode negative number', () => {
  assertEquals(encoder.encode(-123), textEncoder.encode('i-123e'))
})

Deno.test('encode zero', () => {
  assertEquals(encoder.encode(0), textEncoder.encode('i0e'))
})

Deno.test('encode max number', () => {
  assertEquals(encoder.encode(Number.MAX_SAFE_INTEGER), textEncoder.encode('i9007199254740991e'))
})

Deno.test('encode min number', () => {
  assertEquals(encoder.encode(Number.MIN_SAFE_INTEGER), textEncoder.encode('i-9007199254740991e'))
})

Deno.test('encode float number will throw error', () => {
  assertThrows(() => encoder.encode(1.23), Error, 'unsupported data type')
})

// 列表编码测试
Deno.test('encode simple list', () => {
  assertEquals(encoder.encode([1, 2, 3]), textEncoder.encode('li1ei2ei3ee'))
})

Deno.test('encode complex list', () => {
  assertEquals(
    encoder.encode([1, 'hello', [1, 2, 3], { a: 1, b: 2 }]),
    textEncoder.encode('li1e5:helloli1ei2ei3eed1:ai1e1:bi2eee')
  )
})

Deno.test('encdoe empty list', () => {
  assertEquals(encoder.encode([]), textEncoder.encode('le'))
})

Deno.test('encode list with empty string', () => {
  assertEquals(encoder.encode(['']), textEncoder.encode('l0:e'))
})

// 字典编码测试
Deno.test('encode dictionary', () => {
  assertEquals(encoder.encode({ a: 1, b: 2 }), textEncoder.encode('d1:ai1e1:bi2ee'))
})

// bencode的key排序调用的sort()方法,按照ascii码升序排序
Deno.test('encode dictionary sort', () => {
  assertEquals(encoder.encode({ a: 1, b: 2 }), textEncoder.encode('d1:ai1e1:bi2ee'))
})

Deno.test('encode empty dictionary', () => {
  assertEquals(encoder.encode({}), textEncoder.encode('de'))
})

// bittorrent 编码测试
Deno.test('encode complex dictionary', () => {
  const torrentStructure = {
    pieces: new Uint8Array([
      170, 244, 198, 29, 220, 197, 232, 162, 218, 190, 222, 15, 59, 72, 44, 217, 174, 169, 67, 77
    ])
  }

  const expectValue = new Uint8Array([
    100, 54, 58, 112, 105, 101, 99, 101, 115, 50, 48, 58, 170, 244, 198, 29, 220, 197, 232, 162, 218, 190, 222, 15, 59,
    72, 44, 217, 174, 169, 67, 77, 101
  ])

  assertEquals(encoder.encode(torrentStructure), expectValue)
})

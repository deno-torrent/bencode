import { Bencoder } from '../mod.ts'
import { assertEquals, assertRejects } from './deps.ts'

const encoder = new Bencoder()
const textEncoder = new TextEncoder()

// 字符串编码测试
Deno.test('encode string', async () => {
  assertEquals(textEncoder.encode('5:hello'), await encoder.e('hello'))
})

Deno.test('encode utf-8 string', async () => {
  assertEquals(textEncoder.encode('5:hello'), await encoder.e('hello'))
})

Deno.test('encode empty string', async () => {
  assertEquals(await encoder.e(''), textEncoder.encode('0:'))
})

Deno.test('encode buffer string', async () => {
  assertEquals(await encoder.e(Uint8Array.from([0x68, 0x65, 0x6c, 0x6c, 0x6f])), textEncoder.encode('5:hello'))
})

Deno.test('encode Uint8Array string', async () => {
  const u8 = new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f])
  assertEquals(await encoder.e(u8), textEncoder.encode('5:hello'))
})

// 整数编码测试
Deno.test('encode number', async () => {
  assertEquals(await encoder.e(123), textEncoder.encode('i123e'))
})

Deno.test('encode negative number', async () => {
  assertEquals(await encoder.e(-123), textEncoder.encode('i-123e'))
})

Deno.test('encode zero', async () => {
  assertEquals(await encoder.e(0), textEncoder.encode('i0e'))
})

Deno.test('encode max number', async () => {
  assertEquals(await encoder.e(Number.MAX_SAFE_INTEGER), textEncoder.encode('i9007199254740991e'))
})

Deno.test('encode min number', async () => {
  assertEquals(await encoder.e(Number.MIN_SAFE_INTEGER), textEncoder.encode('i-9007199254740991e'))
})

Deno.test('encode float number will throw error', () => {
  assertRejects(() => encoder.e(1.23), Error)
})

// 列表编码测试
Deno.test('encode simple list', async () => {
  assertEquals(await encoder.e([1, 2, 3]), textEncoder.encode('li1ei2ei3ee'))
})

Deno.test('encode complex list', async () => {
  assertEquals(
    await encoder.e([1, 'hello', [1, 2, 3], { a: 1, b: 2 }]),
    textEncoder.encode('li1e5:helloli1ei2ei3eed1:ai1e1:bi2eee')
  )
})

Deno.test('encdoe empty list', async () => {
  assertEquals(await encoder.e([]), textEncoder.encode('le'))
})

Deno.test('encode list with empty string', async () => {
  assertEquals(await encoder.e(['']), textEncoder.encode('l0:e'))
})

// 字典编码测试
Deno.test('encode dictionary', async () => {
  assertEquals(await encoder.e({ a: 1, b: 2 }), textEncoder.encode('d1:ai1e1:bi2ee'))
})

// bencode的key排序调用的sort()方法,按照ascii码升序排序
Deno.test('encode dictionary sort', async () => {
  assertEquals(await encoder.e({ a: 1, b: 2 }), textEncoder.encode('d1:ai1e1:bi2ee'))
})

Deno.test('encode empty dictionary', async () => {
  assertEquals(await encoder.e({}), textEncoder.encode('de'))
})

// bittorrent 编码测试
Deno.test('encode complex dictionary', async () => {
  const torrentStructure = {
    pieces: new Uint8Array([
      170, 244, 198, 29, 220, 197, 232, 162, 218, 190, 222, 15, 59, 72, 44, 217, 174, 169, 67, 77
    ])
  }

  const expectValue = new Uint8Array([
    100, 54, 58, 112, 105, 101, 99, 101, 115, 50, 48, 58, 170, 244, 198, 29, 220, 197, 232, 162, 218, 190, 222, 15, 59,
    72, 44, 217, 174, 169, 67, 77, 101
  ])

  assertEquals(await encoder.e(torrentStructure), expectValue)
})

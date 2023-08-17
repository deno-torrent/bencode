import { Bdecoder } from '../mod.ts'
import { assertEquals } from './deps.ts'

const decoder = new Bdecoder()
const textEncoder = new TextEncoder()

// 字符串解码测试
Deno.test('decode string', () => {
  assertEquals(decoder.decode(textEncoder.encode('5:hello')), 'hello')
})

Deno.test('decode empty string', () => {
  assertEquals(decoder.decode(textEncoder.encode('0:')), '')
})

// 整数解码测试
Deno.test('decode number', () => {
  assertEquals(decoder.decode(textEncoder.encode('i123e')), 123)
})

Deno.test('decode negative number', () => {
  assertEquals(decoder.decode(textEncoder.encode('i-123e')), -123)
})

Deno.test('decode zero', () => {
  assertEquals(decoder.decode(textEncoder.encode('i0e')), 0)
})

Deno.test('decode max number', () => {
  assertEquals(decoder.decode(textEncoder.encode('i9007199254740991e')), Number.MAX_SAFE_INTEGER)
})

Deno.test('decode min number', () => {
  assertEquals(decoder.decode(textEncoder.encode('i-9007199254740991e')), Number.MIN_SAFE_INTEGER)
})

// 列表解码测试
Deno.test('decode simple list', () => {
  assertEquals(decoder.decode(textEncoder.encode('li1ei2ei3ee')), [1, 2, 3])
})

Deno.test('decode complex list', () => {
  assertEquals(decoder.decode(textEncoder.encode('li1e5:helloli1ei2ei3eed1:ai1e1:bi2eee')), [
    1,
    'hello',
    [1, 2, 3],
    { a: 1, b: 2 }
  ])
})

Deno.test('encdoe empty list', () => {
  assertEquals(decoder.decode(textEncoder.encode('le')), [])
})

Deno.test('decode list with empty string', () => {
  assertEquals(decoder.decode(textEncoder.encode('l0:e')), [''])
})

// 字典解码测试
Deno.test('decode dictionary', () => {
  assertEquals(decoder.decode(textEncoder.encode('d1:ai1e1:bi2ee')), { a: 1, b: 2 })
})

// bencode的key排序调用的sort()方法,按照ascii码升序排序
Deno.test('decode dictionary sort', () => {
  assertEquals(decoder.decode(textEncoder.encode('d1:bi2e1:ai1ee')), { a: 1, b: 2 })
})

Deno.test('decode empty dictionary', () => {
  assertEquals(decoder.decode(textEncoder.encode('de')), {})
})
// torrent文件解码测试
Deno.test('decode torrent', () => {
  // torrent文件路径
  const file = Deno.cwd() + '/test/torrent/ubuntu-22.04.2-live-server-amd64.iso.torrent'
  // 读取并解码torrent文件
  const torrentObj = decoder.decode(Deno.readFileSync(file)) as {
    announce: string
    info: {
      'piece length': number
      pieces: string
    }
  }
  // 校验announce
  assertEquals(torrentObj.announce, 'https://torrent.ubuntu.com/announce')
  // 校验pieces长度
  assertEquals(torrentObj['info']['piece length'], 262144)
  // 校验pieces数量
  assertEquals(torrentObj['info']['pieces'].length, 150760)
})

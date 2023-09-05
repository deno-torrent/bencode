import { Bdecoder } from '../mod.ts'
import { assertEquals } from './deps.ts'

const decoder = new Bdecoder()
const textEncoder = new TextEncoder()

// 字符串解码测试
Deno.test('decode string', async () => {
  assertEquals(await decoder.d(textEncoder.encode('5:hello')), 'hello')
})

Deno.test('decode empty string', async () => {
  assertEquals(await decoder.d(textEncoder.encode('0:')), '')
})

// 整数解码测试
Deno.test('decode number', async () => {
  assertEquals(await decoder.d(textEncoder.encode('i123e')), 123)
})

Deno.test('decode negative number', async () => {
  assertEquals(await decoder.d(textEncoder.encode('i-123e')), -123)
})

Deno.test('decode zero', async () => {
  assertEquals(await decoder.d(textEncoder.encode('i0e')), 0)
})

Deno.test('decode max number', async () => {
  assertEquals(await decoder.d(textEncoder.encode('i9007199254740991e')), Number.MAX_SAFE_INTEGER)
})

Deno.test('decode min number', async () => {
  assertEquals(await decoder.d(textEncoder.encode('i-9007199254740991e')), Number.MIN_SAFE_INTEGER)
})

// 列表解码测试
Deno.test('decode simple list', async () => {
  assertEquals(await decoder.d(textEncoder.encode('li1ei2ei3ee')), [1, 2, 3])
})

Deno.test('decode complex list', async () => {
  assertEquals(await decoder.d(textEncoder.encode('li1e5:helloli1ei2ei3eed1:ai1e1:bi2eee')), [
    1,
    'hello',
    [1, 2, 3],
    { a: 1, b: 2 }
  ])
})

Deno.test('encdoe empty list', async () => {
  assertEquals(await decoder.d(textEncoder.encode('le')), [])
})

Deno.test('decode list with empty string', async () => {
  assertEquals(await decoder.d(textEncoder.encode('l0:e')), [''])
})

// 字典解码测试
Deno.test('decode dictionary', async () => {
  assertEquals(await decoder.d(textEncoder.encode('d1:ai1e1:bi2ee')), { a: 1, b: 2 })
})

// bencode的key排序调用的sort()方法,按照ascii码升序排序
Deno.test('decode dictionary sort', async () => {
  assertEquals(await decoder.d(textEncoder.encode('d1:bi2e1:ai1ee')), { a: 1, b: 2 })
})

Deno.test('decode empty dictionary', async () => {
  assertEquals(await decoder.d(textEncoder.encode('de')), {})
})

// torrent文件解码测试
Deno.test('decode torrent', async () => {
  // torrent文件路径
  const file = Deno.cwd() + '/test/torrent/ubuntu-22.04.2-live-server-amd64.iso.torrent'
  // 读取并解码torrent文件
  const torrentObj = (await decoder.d(Deno.readFileSync(file))) as {
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

// 解码当含有非utf8编码的字节字符串作为字典的key时
Deno.test('decode byte string as dict key', async () => {
  const decoder = new Bdecoder()

  const bytes = Deno.readFileSync(Deno.cwd() + '/test/tracker/ubuntu_tracker_scrape')

  const result = (await decoder.d(bytes)) as {
    files: {
      // 这里的key是info_hash,是一个字节字符串,由于不是utf8编码,所以无法解码为字符串,否则会丢失数据
      // 所以返回的形式是"Unit8Array[xx,xx,xx,xx,xx,xx,xx,xx,xx,xx]"这种字符串形式
      [key: string]: {
        complete: number
        downloaded: number
        incomplete: number
        name: string
      }
    }
  }

  assertEquals(
    Object.keys(result.files)[0],
    'Unit8Array[0,70,120,242,226,120,16,48,188,87,115,122,135,250,247,170,251,23,79,248]'
  )

  assertEquals(true, Bdecoder.isNotUtf8ByteStr(Object.keys(result.files)[0]))

  assertEquals(
    Bdecoder.toUnit8Array(Object.keys(result.files)[0]),
    Uint8Array.from([0, 70, 120, 242, 226, 120, 16, 48, 188, 87, 115, 122, 135, 250, 247, 170, 251, 23, 79, 248])
  )
})

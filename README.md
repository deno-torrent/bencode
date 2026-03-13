# bencode

[![JSR](https://jsr.io/badges/@deno-torrent/bencode)](https://jsr.io/@deno-torrent/bencode)
[![CI](https://github.com/deno-torrent/bencode/actions/workflows/test.yml/badge.svg)](https://github.com/deno-torrent/bencode/actions/workflows/test.yml)

[English](#english) | [中文](#中文)

---

## English

A [bencode](https://wiki.theory.org/BitTorrentSpecification#Bencoding) encoder/decoder for Deno, built for BitTorrent `.torrent` files and tracker responses.

### Import

```ts
import { encode, decode } from 'jsr:@deno-torrent/bencode'
```

### Quick Start

```ts
import { encode, decode } from 'jsr:@deno-torrent/bencode'

// Encode
const bytes = encode({
  announce: 'https://tracker.example.com/announce',
  info: { name: 'ubuntu-22.04.iso', length: 1_073_741_824, 'piece length': 262144 }
})

// Decode
const torrent = decode(Deno.readFileSync('file.torrent'))
```

### API

#### `encode(value: BencodeValue): Uint8Array`

| Type         | Bencode  | Notes                                               |
|--------------|----------|-----------------------------------------------------|
| `number`     | integer  | Safe integers only; throws `BencodeEncodeError` otherwise |
| `string`     | string   | UTF-8 encoded; length prefix is **byte count**      |
| `Uint8Array` | string   | Written as raw bytes                                |
| `Array`      | list     |                                                     |
| `object`     | dict     | Keys sorted lexicographically                       |

#### `decode(data: Uint8Array): BencodeValue`

| Bencode type | Returns                      |
|--------------|------------------------------|
| integer      | `number`                     |
| string (UTF-8 valid) | `string`             |
| string (non-UTF-8)   | `Uint8Array`         |
| list         | `Array`                      |
| dict         | `object`                     |

Throws `BencodeDecodeError` on malformed or truncated input.

Non-UTF-8 dictionary keys are returned as `"Uint8Array[b0,b1,...]"` strings.
Use `isByteKey` and `byteKeyToUint8Array` to detect and recover them:

```ts
import { decode, isByteKey, byteKeyToUint8Array } from 'jsr:@deno-torrent/bencode'

const scrape = decode(Deno.readFileSync('tracker_scrape'))
for (const key of Object.keys((scrape as any).files)) {
  if (isByteKey(key)) {
    const infoHash = byteKeyToUint8Array(key)!  // Uint8Array (20 bytes)
  }
}
```

### Tests

```sh
deno task test
```

### License

[MIT](./LICENSE)

---

## 中文

用于 Deno 的 [bencode](https://wiki.theory.org/BitTorrentSpecification#Bencoding) 编解码库，适用于解析 BitTorrent `.torrent` 文件与 Tracker 响应。

### 引入

```ts
import { encode, decode } from 'jsr:@deno-torrent/bencode'
```

### 快速上手

```ts
import { encode, decode } from 'jsr:@deno-torrent/bencode'

// 编码
const bytes = encode({
  announce: 'https://tracker.example.com/announce',
  info: { name: 'ubuntu-22.04.iso', length: 1_073_741_824, 'piece length': 262144 }
})

// 解码
const torrent = decode(Deno.readFileSync('file.torrent'))
```

### API

#### `encode(value: BencodeValue): Uint8Array`

| 类型          | Bencode  | 说明                                            |
|--------------|----------|-------------------------------------------------|
| `number`     | integer  | 仅支持安全整数，否则抛出 `BencodeEncodeError`    |
| `string`     | string   | UTF-8 编码，长度前缀为**字节数**                 |
| `Uint8Array` | string   | 原始字节，不做 UTF-8 转换                        |
| `Array`      | list     |                                                 |
| `object`     | dict     | key 按字典序排序                                 |

#### `decode(data: Uint8Array): BencodeValue`

| Bencode 类型 | 返回值                         |
|-------------|-------------------------------|
| integer     | `number`                      |
| string（有效 UTF-8）| `string`             |
| string（非 UTF-8）  | `Uint8Array`         |
| list        | `Array`                       |
| dict        | `object`                      |

格式错误或截断的输入会抛出 `BencodeDecodeError`。

非 UTF-8 的字典 key 会以 `"Uint8Array[b0,b1,...]"` 字符串形式返回，
可通过 `isByteKey` 和 `byteKeyToUint8Array` 识别和还原：

```ts
import { decode, isByteKey, byteKeyToUint8Array } from 'jsr:@deno-torrent/bencode'

// Tracker scrape 响应的 key 是 20 字节的 info_hash（非 UTF-8）
const scrape = decode(Deno.readFileSync('tracker_scrape'))
for (const key of Object.keys((scrape as any).files)) {
  if (isByteKey(key)) {
    const infoHash = byteKeyToUint8Array(key)!  // Uint8Array，20 字节
  }
}
```

### 运行测试

```sh
deno task test
```

### 许可证

[MIT](./LICENSE)

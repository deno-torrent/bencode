# @deno-torrent/bencode

[![JSR](https://jsr.io/badges/@deno-torrent/bencode)](https://jsr.io/@deno-torrent/bencode)
[![CI](https://github.com/deno-torrent/bencode/actions/workflows/test.yml/badge.svg)](https://github.com/deno-torrent/bencode/actions/workflows/test.yml)

[English](#english) · [中文](#中文)

## English

A protocol-faithful, synchronous Bencode 2.0 encoder and decoder for Deno. It is designed for BitTorrent torrent metadata, tracker responses, and other byte-oriented Bencode protocols.

### Features

- Canonical encoding with raw-byte dictionary key ordering.
- Strict decoding with complete input consumption.
- Direct preservation of binary strings and dictionary keys.
- Safe-integer validation without silent precision loss.
- Duplicate-key, malformed-input, cycle, and resource-limit protection.
- Synchronous API with no runtime dependencies.

## Install

```ts
import { decode, encode } from 'jsr:@deno-torrent/bencode'
```

## Quick start

Version 2 uses `Map` for dictionaries. This preserves binary keys without converting them to a lossy string marker.

```ts
import { decode, encode } from 'jsr:@deno-torrent/bencode'

const torrentLike = new Map([
  ['announce', 'https://tracker.example.com/announce'],
  ['info', new Map([
    ['name', 'example.iso'],
    ['piece length', 262144],
    ['pieces', new Uint8Array([0xaa, 0xbb])]
  ])]
])

const bytes = encode(torrentLike)
const decoded = decode(bytes)
const announce = (decoded as Map<string, unknown>).get('announce')
```

## 2.0 API at a glance

Supported values are safe integers, strings, `Uint8Array`, arrays, and `Map` dictionaries:

```ts
type BencodeKey = string | Uint8Array
type BencodeDict = Map<BencodeKey, BencodeValue>
```

Dictionary entries are encoded in raw byte order. Decoder output is canonical and rejects trailing data, invalid integers, unsorted keys, duplicate keys, excessive nesting, and oversized input.

Binary dictionary keys are returned directly as `Uint8Array`; the 1.x `BYTE_KEY_PREFIX`, `isByteKey`, and `byteKeyToUint8Array` compatibility API no longer exists.

### API behavior

`encode(value)` supports safe integers, strings, `Uint8Array`, arrays, and `Map` dictionaries. Plain objects, floating-point numbers, cycles, invalid keys, and byte-equivalent duplicate keys throw `BencodeEncodeError`.

`decode(data, options?)` returns strings for valid UTF-8 byte strings and `Uint8Array` for invalid UTF-8 strings. Dictionaries are always returned as `Map` instances. Malformed, truncated, unsorted, duplicated, or oversized input throws `BencodeDecodeError`.

### Migration from 1.x

```ts
// 1.x
encode({ info: { name: 'file.iso', length: 1024 } })

// 2.0
encode(new Map([
  ['info', new Map([
    ['name', 'file.iso'],
    ['length', 1024]
  ])]
]))
```

The 1.x exports `BYTE_KEY_PREFIX`, `isByteKey`, and `byteKeyToUint8Array` were removed. Iterate decoded maps and check `key instanceof Uint8Array` for binary keys. See [`docs/MIGRATION_2.0.md`](./docs/MIGRATION_2.0.md).

## Resource limits

```ts
decode(data, {
  maxBytes: 16 * 1024 * 1024,
  maxDepth: 256
})
```

Defaults are 64 MiB input and 1000 nested containers. Invalid or exceeded limits throw `BencodeDecodeError`.

## Development

```sh
deno task fmt
deno task lint
deno task check
deno task test
```

The complete project design, API reference, migration notes, and maintenance policy are in [`docs/`](./docs/).

## License

[MIT](./LICENSE)

---

## 中文

`@deno-torrent/bencode` 是一个面向 Deno 的轻量级、同步、零运行时依赖 Bencode 编解码库，适用于 BitTorrent Torrent 元数据、Tracker 响应以及其他面向字节的 Bencode 协议。

2.0 版本使用 `Map` 表示字典，使二进制字典键可以直接保留为原始 `Uint8Array`，不再转换为人为构造的字符串标记。

### 特性

- 按原始字节排序的规范化 Bencode 编码。
- 严格解码并确保完整消费输入。
- 精确保留二进制字符串和二进制字典键。
- 校验安全整数，避免 JavaScript 数值精度静默丢失。
- 检测重复键、无序键、非法输入和资源限制。
- 编码时检测循环引用。
- 同步 API，无运行时依赖。

### 安装与快速开始

安装方式为：`import { decode, encode } from 'jsr:@deno-torrent/bencode'`。

2.0 使用 `Map` 表示字典。示例：

```ts
const torrent = new Map([
  ['announce', 'https://tracker.example.com/announce'],
  ['info', new Map([
    ['name', 'example.iso'],
    ['length', 1_073_741_824],
    ['piece length', 262_144],
    ['pieces', new Uint8Array([0xaa, 0xbb, 0xcc])]
  ])]
])

const bytes = encode(torrent)
const decoded = decode(bytes) as Map<string, unknown>
console.log(decoded.get('announce'))
```

### 数据模型

`BencodeInteger` 是安全整数；`BencodeByteString` 是 `string | Uint8Array`；`BencodeDict` 是 `Map<string | Uint8Array, BencodeValue>`；`BencodeList` 是 `BencodeValue[]`。

### API 行为

| JavaScript 值 | Bencode 类型 | 行为 |
|---|---|---|
| 安全整数 | Integer | 编码为 `i<number>e` |
| `string` | Byte string | 使用 UTF-8 编码，长度前缀为字节数 |
| `Uint8Array` | Byte string | 按原始字节写入 |
| Array | List | 递归编码元素 |
| `Map` | Dictionary | 按原始编码字节排序键 |

合法 UTF-8 字节串解码为 `string`，无效 UTF-8 字节串解码为 `Uint8Array`，字典始终解码为 `Map`。二进制字典键可通过 `key instanceof Uint8Array` 判断：

```ts
const response = decode(data) as Map<string, unknown>
const files = response.get('files') as Map<string | Uint8Array, unknown>

for (const [key, value] of files) {
  if (key instanceof Uint8Array) console.log(key, value)
}
```

对于普通对象、不安全数字、循环容器、非法字典键和编码后等价的重复键，编码器抛出 `BencodeEncodeError`。对于尾随数据、非法整数、错误长度、无序键、重复键、嵌套过深或输入过大，解码器抛出 `BencodeDecodeError`。

### 资源限制

默认限制为输入 64 MiB、容器嵌套 1000 层。处理不可信输入时可以使用 `decode(data, { maxBytes: 16 * 1024 * 1024, maxDepth: 256 })` 收紧限制。

### 从 1.x 迁移

1.x 的对象字典 `encode({ info: { name: 'file.iso' } })` 在 2.0 中应改为 `encode(new Map([['info', new Map([['name', 'file.iso']])]]))`。`BYTE_KEY_PREFIX`、`isByteKey` 和 `byteKeyToUint8Array` 已移除，请直接遍历 `Map` 并判断二进制键。详见[`docs/MIGRATION_2.0.md`](./docs/MIGRATION_2.0.md)。

### 开发与测试

执行 `deno task fmt`、`deno task lint`、`deno task check` 和 `deno task test`。四条命令必须全部通过。测试包含语法、规范排序、二进制键、非法输入、资源限制、循环值、确定性生成式往返编码，以及真实 Ubuntu Torrent/Tracker 样本。

### 文档索引

- [项目总览](./docs/PROJECT_OVERVIEW.md)
- [架构说明](./docs/ARCHITECTURE.md)
- [模块映射](./docs/MODULE_MAP.md)
- [API 参考](./docs/API.md)
- [开发指南](./docs/DEVELOPMENT_GUIDE.md)
- [迁移指南](./docs/MIGRATION_2.0.md)
- [技术债](./docs/TECH_DEBT.md)
- [变更日志](./CHANGELOG.md)

### 项目边界

本包只负责 Bencode 序列化，不负责文件读取、网络请求、Torrent info hash 计算或 Torrent/Tracker schema 校验。这些职责属于调用方或上层业务项目。

### 许可证

[MIT](./LICENSE)

# 项目总览 / Project Overview

`@deno-torrent/bencode` is a synchronous, zero-runtime-dependency Bencode library for Deno. It encodes and decodes byte-oriented values used by BitTorrent torrent metadata and tracker responses.

Version 2.0 prioritizes protocol fidelity over the 1.x object-shaped compatibility API. Dictionaries are `Map` instances, binary dictionary keys remain `Uint8Array`, and decoder input is fully validated.

## Repository structure

```text
.
├── mod.ts                         # Public package entry point
├── deno.json                      # Package metadata, tasks, imports, test config
├── deno.lock                      # Locked JSR dependency graph
├── README.md                      # Public quick start and API summary
├── LICENSE                        # MIT license
├── .github/workflows/test.yml     # Formatting, lint, type-check, and test CI
├── src/
│   ├── types.ts                   # Public value types and error classes
│   ├── encode.ts                  # Canonical encoder
│   └── decode.ts                  # Strict decoder and resource limits
├── test/
│   ├── encode.test.ts             # Encoder behavior and failure tests
│   ├── decode.test.ts             # Decoder, protocol, limits, and fixture tests
│   ├── roundtrip.test.ts          # Encode/decode invariants
│   ├── property.test.ts           # Deterministic generated round trips
│   ├── torrent/*.torrent          # Real torrent fixture
│   └── tracker/*                  # Real tracker fixture
└── docs/                          # Maintainer and user documentation
```

## Runtime boundary

The library accepts and returns in-memory values only. File reads, network requests, Torrent schema validation, tracker protocol handling, and info-hash calculation belong to the caller.

## Version 2.0 guarantees

- Integers are finite safe JavaScript integers.
- Strings are UTF-8 encoded; `Uint8Array` is written byte-for-byte.
- Dictionaries use `Map<string | Uint8Array, BencodeValue>`.
- Dictionary keys are sorted by raw wire bytes during encoding.
- Decoding requires one complete canonical value with no trailing bytes.
- Duplicate keys, unsorted keys, malformed lengths, invalid integers, and resource-limit violations fail with `BencodeDecodeError`.

## 中文

`@deno-torrent/bencode` 是一个面向 Deno 的同步、零运行时依赖 Bencode 编解码库，服务于 BitTorrent Torrent 元数据、Tracker 响应及其他面向字节的协议。

2.0 版本优先保证协议字节准确性，不再维护 1.x 的普通对象字典兼容 API。字典统一使用 `Map`，二进制字典键直接保留为 `Uint8Array`，解码器会完整校验输入。

### 仓库结构

```text
.
├── mod.ts                         # 包公共入口
├── deno.json                      # 包元数据、任务、导入和测试配置
├── deno.lock                      # JSR 依赖锁定文件
├── README.md                      # 面向用户的快速开始和 API 摘要
├── src/                           # 类型、编码器和解码器
├── test/                          # 单元测试、往返测试和真实协议样本
└── docs/                          # 用户与维护者文档
```

### 运行边界

本库只处理内存中的值和字节，不负责文件读取、网络请求、Torrent schema 校验、Tracker 协议处理或 info hash 计算。

### 2.0 保证

- 整数必须是有限的 JavaScript 安全整数。
- 字符串使用 UTF-8 编码，`Uint8Array` 按原始字节写入。
- 字典类型为 `Map<string | Uint8Array, BencodeValue>`。
- 编码时按原始字节排序字典键。
- 解码必须得到一个完整值，不接受尾随字节。
- 重复键、无序键、错误长度、非法整数和超出资源限制的输入会抛出 `BencodeDecodeError`。

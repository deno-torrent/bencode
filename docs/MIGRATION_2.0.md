# 1.x 到 2.0 迁移指南 / Migrating from 1.x to 2.0

2.0 intentionally removes the object-shaped dictionary API and the synthetic binary-key string API.

## Dictionary construction

```ts
// Before
encode({ announce: 'https://tracker.example.com', info: { length: 1024 } })

// After
encode(new Map([
  ['announce', 'https://tracker.example.com'],
  ['info', new Map([['length', 1024]])]
]))
```

## Dictionary reads

```ts
// Before
const torrent = decode(bytes) as { info: { length: number } }
const length = torrent.info.length

// After
const torrent = decode(bytes) as BencodeDict
const info = torrent.get('info') as BencodeDict
const length = info.get('length')
```

## Binary keys

Remove `BYTE_KEY_PREFIX`, `isByteKey`, and `byteKeyToUint8Array`. Iterate the decoded `Map` and test `key instanceof Uint8Array`.

## Validation changes

2.0 rejects malformed or non-canonical input that 1.x accepted: trailing bytes, unsorted dictionary keys, duplicate keys, unsafe integers, malformed lengths, excessive nesting, and oversized input.

## 2.0.2 BOM decoding correction

Starting in 2.0.2, a leading UTF-8 BOM (`EF BB BF`) in a byte string or dictionary key is preserved as `U+FEFF`. Earlier 2.0 releases silently removed it, which could corrupt round trips and dictionary validation. Keys such as `"a"` and `"\uFEFFa"` now remain distinct, and ordering uses their complete raw bytes. Integer tokens containing a BOM are rejected. These corrections also apply with `allowUnsortedKeys: true`, except that this option continues to skip key-order validation. No API changes are required; callers that intentionally want to strip a leading `U+FEFF` must do so explicitly after decoding.

## 中文

2.0 有意移除了普通对象字典 API 和合成二进制键字符串 API。

### 字典构造

1.x 的 `encode({ announce: 'https://tracker.example.com', info: { length: 1024 } })` 应改为 `encode(new Map([['announce', 'https://tracker.example.com'], ['info', new Map([['length', 1024]])]]))`。

### 字典读取

1.x 可以通过 `torrent.info.length` 读取字段；2.0 应将结果转换为 `Map` 视图，使用 `const info = (decode(bytes) as BencodeDict).get('info') as BencodeDict`，再通过 `info.get('length')` 读取。

### 二进制键

移除 `BYTE_KEY_PREFIX`、`isByteKey` 和 `byteKeyToUint8Array`。遍历解码后的 `Map`，通过 `key instanceof Uint8Array` 判断并获取原始二进制键。

### 校验行为变化

2.0 会拒绝 1.x 可能接受的非法或非规范输入：尾随字节、未排序字典键、重复键、不安全整数、错误长度、嵌套过深和超大输入。

### 2.0.2 BOM 解码修正

从 2.0.2 起，字节串或字典键开头的 UTF-8 BOM（`EF BB BF`）会保留为 `U+FEFF`。此前的 2.0 版本会静默移除它，导致往返编码失真和字典校验错误。`"a"` 和 `"\uFEFFa"` 等键现在保持独立，排序依据完整原始字节，含 BOM 的整数会被拒绝。这些修正也适用于 `allowUnsortedKeys: true`，但该选项仍会跳过键顺序校验。无需修改 API 调用；如需主动移除开头的 `U+FEFF`，请在解码后显式处理。

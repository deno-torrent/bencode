# API 参考 / API Reference

## Types

```ts
type BencodeInteger = number
type BencodeByteString = string | Uint8Array
type BencodeKey = BencodeByteString
type BencodeList = BencodeValue[]
type BencodeDict = Map<BencodeKey, BencodeValue>
type BencodeValue = BencodeInteger | BencodeByteString | BencodeList | BencodeDict
```

## `encode(value)`

Returns a new `Uint8Array` containing canonical Bencode.

| JavaScript value | Wire type | Rule |
|---|---|---|
| safe integer | integer | `i<number>e` |
| string | byte string | UTF-8 bytes and byte length |
| `Uint8Array` | byte string | raw bytes and byte length |
| array | list | recursively encoded |
| `Map` | dictionary | keys sorted by raw bytes |

Plain objects, floating-point numbers, `NaN`, `Infinity`, unsupported keys, cycles, and byte-equivalent duplicate dictionary keys throw `BencodeEncodeError`.

## `decode(data, options?)`

Returns one complete `BencodeValue` and rejects malformed or non-canonical input.

```ts
interface DecodeOptions {
  maxBytes?: number
  maxDepth?: number
  allowUnsortedKeys?: boolean
}
```

Defaults are `maxBytes = 64 * 1024 * 1024`, `maxDepth = 1000`, and `allowUnsortedKeys = false`. Decoding is canonical and strict by default. Set `allowUnsortedKeys: true` only for compatibility with a known protocol implementation that emits non-canonical dictionary order. This skips only the raw-byte ordering assertion: received order is preserved in the returned `Map`, while duplicate keys and every other malformed input remain invalid.

Valid UTF-8 byte strings become `string`; invalid UTF-8 byte strings become `Uint8Array`. Dictionaries always become `Map`. Invalid UTF-8 dictionary keys are therefore available directly as byte arrays.

## Errors

- `BencodeEncodeError`: caller value cannot be represented or would produce an ambiguous encoding.
- `BencodeDecodeError`: input is malformed, non-canonical, incomplete, oversized, or too deeply nested.

## 1.x to 2.0 migration

```ts
// 1.x
encode({ info: { name: 'file' } })

// 2.0
encode(new Map([
  ['info', new Map([['name', 'file']])]
]))
```

```ts
// 1.x binary key marker helpers are removed.
// 2.0:
const files = (decode(bytes) as BencodeDict).get('files') as BencodeDict
for (const [key, value] of files) {
  if (key instanceof Uint8Array) {
    // key is the original binary info hash
  }
}
```

## 中文

### 类型

```ts
type BencodeInteger = number
type BencodeByteString = string | Uint8Array
type BencodeKey = BencodeByteString
type BencodeList = BencodeValue[]
type BencodeDict = Map<BencodeKey, BencodeValue>
type BencodeValue = BencodeInteger | BencodeByteString | BencodeList | BencodeDict
```

### `encode(value)`

返回包含规范化 Bencode 的新 `Uint8Array`。

| JavaScript 值 | 线路类型 | 规则 |
|---|---|---|
| 安全整数 | integer | `i<number>e` |
| 字符串 | byte string | UTF-8 字节和字节长度 |
| `Uint8Array` | byte string | 原始字节和字节长度 |
| 数组 | list | 递归编码 |
| `Map` | dictionary | 按原始字节排序键 |

普通对象、浮点数、`NaN`、`Infinity`、非法键、循环引用和编码后等价的重复键会抛出 `BencodeEncodeError`。

### `decode(data, options?)`

返回一个完整的 `BencodeValue`，拒绝格式错误或非规范输入。

```ts
interface DecodeOptions {
  maxBytes?: number
  maxDepth?: number
  allowUnsortedKeys?: boolean
}
```

默认 `maxBytes` 为 `64 * 1024 * 1024`，`maxDepth` 为 `1000`，`allowUnsortedKeys` 为 `false`，因此默认严格检查规范顺序。仅为兼容已知会产生无序字典的协议实现时才应设为 `true`；它只跳过原始字节顺序断言，仍拒绝重复键和其他所有格式错误，并按接收顺序生成 `Map`。合法 UTF-8 字节串返回 `string`，无效 UTF-8 字节串返回 `Uint8Array`，字典始终返回 `Map`。

### 错误类型

- `BencodeEncodeError`：输入值无法被安全或无歧义地表示。
- `BencodeDecodeError`：输入格式错误、非规范、不完整、超大或嵌套过深。

### 1.x 到 2.0 迁移

```ts
// 1.x
encode({ info: { name: 'file' } })

// 2.0
encode(new Map([
  ['info', new Map([['name', 'file']])]
]))
```

移除 `BYTE_KEY_PREFIX`、`isByteKey` 和 `byteKeyToUint8Array`。请遍历解码后的 `Map`，通过 `key instanceof Uint8Array` 识别二进制键。

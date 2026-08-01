# 架构说明 / Architecture

## Design

```text
Caller bytes/value
       │
       ▼
     mod.ts          public exports only
       │
   ┌───┴────┐
   ▼        ▼
encode   decode
   │        │
   └───┬────┘
       ▼
    types.ts
```

The implementation is deliberately small: no runtime dependency, no global state, no I/O, and no protocol-specific business layer.

## Encoding flow

1. Dispatch on the value type.
2. Encode scalars using Bencode delimiters and byte lengths.
3. Recursively encode arrays and `Map` dictionaries.
4. Convert dictionary keys to their exact wire bytes.
5. Sort dictionary entries by unsigned byte comparison.
6. Reject byte-equivalent duplicate keys.
7. Write bytes into a growable output buffer and return one `Uint8Array`.

The encoder tracks current ancestors with `WeakSet` so cycles fail with `BencodeEncodeError`. Shared, non-cyclic values are allowed.

## Decoding flow

1. Validate input size and configured depth limits.
2. Parse one value from an offset cursor using an explicit container stack.
3. Decode strings as UTF-8 when valid; otherwise return a copied `Uint8Array`.
4. Decode dictionaries into `Map` and preserve invalid UTF-8 keys as `Uint8Array`.
5. Compare dictionary keys by original wire bytes for ordering and duplicates.
6. Require the final cursor to equal `data.length`.

## Invariants

- Every accepted integer round-trips without precision loss.
- Every encoded dictionary is canonical by raw key bytes.
- A decoded binary key is never represented by a synthetic string.
- The top-level decoder consumes exactly one complete value.
- Resource failures use the public decode error class.

## Complexity

For an input of `n` bytes, scalar parsing is linear in the input size. Dictionary encoding sorts `k` entries in `O(k log k)` comparisons; each comparison is byte-based. Encoding and decoding use recursion for nested containers and enforce configurable depth limits on decoding.

## 中文

### 设计

```text
调用方字节/值
       │
       ▼
     mod.ts          只负责公共导出
       │
   ┌───┴────┐
   ▼        ▼
  encode   decode
   │        │
   └───┬────┘
       ▼
    types.ts
```

实现保持小而明确：无运行时依赖、无全局状态、无 I/O，也不包含 Torrent 或 Tracker 业务层。

### 编码流程

1. 根据运行时类型分派。
2. 使用 Bencode 分隔符和字节长度编码标量。
3. 递归编码数组和 `Map` 字典。
4. 将字典键转换为线路上的原始字节。
5. 使用无符号字节比较排序字典项。
6. 拒绝编码后字节相同的重复键。
7. 将输出分块合并为一个 `Uint8Array`。

编码器使用 `WeakSet` 跟踪当前祖先容器，循环引用会抛出 `BencodeEncodeError`；非循环的共享引用仍然允许。

### 解码流程

1. 校验输入大小和嵌套深度限制。
2. 使用 offset 游标解析一个值。
3. 合法 UTF-8 字节串转为字符串，否则返回复制后的 `Uint8Array`。
4. 字典解码为 `Map`，无效 UTF-8 键保留为 `Uint8Array`。
5. 按原始字节校验字典键的顺序和重复情况。
6. 要求最终游标等于输入长度。

### 不变量与复杂度

- 已接受整数往返后不会发生精度损失。
- 编码后的字典按原始字节规范化。
- 二进制键不会被转换为伪造字符串。
- 顶层解码会完整消费输入。
- 资源错误统一使用公开的解码错误类型。

标量解析相对于输入长度为线性复杂度；包含 `k` 个键的字典编码排序复杂度为 `O(k log k)`，比较基于原始字节。编码器使用受限递归处理嵌套值，解码器使用显式容器栈并执行可配置的深度限制。

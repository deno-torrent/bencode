# 模块映射 / Module Map

| Module | Responsibility | Public surface |
|---|---|---|
| `mod.ts` | Package boundary and re-exports | All supported types, errors, `encode`, `decode` |
| `src/types.ts` | Type model and errors | `BencodeValue`, `BencodeDict`, `BencodeKey`, error classes |
| `src/encode.ts` | Canonical serialization | `encode(value)` |
| `src/decode.ts` | Strict parsing and resource limits | `decode(data, options)`, `DecodeOptions` |
| `test/encode.test.ts` | Encoder contract | Safe values, maps, bytes, cycles, duplicates |
| `test/decode.test.ts` | Decoder contract | Grammar, canonical ordering, limits, fixtures |
| `test/roundtrip.test.ts` | Cross-module invariants | Scalar, nested, and binary-key round trips |
| `test/property.test.ts` | Deterministic generated coverage | Nested values and round-trip invariants |

## Dependency direction

```text
mod.ts ──► encode.ts ──► types.ts
   └────► decode.ts ──► types.ts
tests ──► mod.ts
```

`src/encode.ts` and `src/decode.ts` must not import each other. `mod.ts` is the only intended consumer-facing import path.

## 中文

| 模块 | 职责 | 公共内容 |
|---|---|---|
| `mod.ts` | 包边界和统一导出 | 类型、错误类、`encode`、`decode` |
| `src/types.ts` | 类型模型和错误 | `BencodeValue`、`BencodeDict`、`BencodeKey`、错误类 |
| `src/encode.ts` | 规范化序列化 | `encode(value)` |
| `src/decode.ts` | 严格解析和资源限制 | `decode(data, options)`、`DecodeOptions` |
| `test/encode.test.ts` | 编码契约 | 安全值、Map、字节、循环、重复键 |
| `test/decode.test.ts` | 解码契约 | 语法、规范排序、限制、真实样本 |
| `test/roundtrip.test.ts` | 跨模块不变量 | 标量、嵌套结构和二进制键往返 |
| `test/property.test.ts` | 确定性生成覆盖 | 嵌套值和往返不变量 |

### 依赖方向

```text
mod.ts ──► encode.ts ──► types.ts
   └────► decode.ts ──► types.ts
tests ──► mod.ts
```

`src/encode.ts` 和 `src/decode.ts` 不应互相导入；`mod.ts` 是调用方推荐使用的唯一入口。

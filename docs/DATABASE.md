# 数据库与持久化 / Database and Persistence

This library has no database, persistence layer, cache, or filesystem abstraction.

## Data ownership

- Callers own input `Uint8Array` instances.
- `decode` copies invalid UTF-8 byte strings and binary dictionary keys before returning them.
- `encode` returns a new output `Uint8Array`.
- Fixture files under `test/` are test inputs only; they are not runtime data storage.

## Operational implications

- No migrations are required.
- No credentials or connection configuration are accepted.
- Memory limits are controlled through `DecodeOptions.maxBytes` and `DecodeOptions.maxDepth`.
- Applications processing untrusted or very large inputs should apply an outer transport limit before reading the complete payload.

## 中文

本库没有数据库、持久化层、缓存或文件系统抽象。

### 数据所有权

- 输入 `Uint8Array` 由调用方负责管理。
- `decode` 会复制无效 UTF-8 字节串和二进制字典键后再返回。
- `encode` 返回新的 `Uint8Array`。
- `test/` 下的样本文件仅用于测试，不是运行时数据存储。

### 运行影响

- 不需要数据库迁移。
- 不接受凭据或连接配置。
- 内存限制通过 `DecodeOptions.maxBytes` 和 `DecodeOptions.maxDepth` 控制。
- 处理不可信或超大输入时，应用层应在完整读取数据前增加传输层大小限制。

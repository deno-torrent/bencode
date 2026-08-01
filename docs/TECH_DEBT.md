# 技术债 / Technical Debt

## Resolved in 2.0

- Object dictionary prototype behavior and binary-key marker collisions: replaced by `Map` and direct binary keys.
- Unsafe integer precision loss: safe-integer checks are enforced on both sides.
- Trailing input acceptance: top-level decoding requires full consumption.
- Loose byte-string length parsing: ASCII digits, leading zero, and safe-length validation are enforced.
- String-based dictionary ordering: keys are compared by raw bytes.
- Silent duplicate-key overwrite: duplicate wire keys are rejected.
- Cyclic encoder input: cycles fail with `BencodeEncodeError`.
- Deep decoder recursion and oversized input: `maxDepth` and `maxBytes` limits are enforced.
- Missing CI quality gates: format, lint, type-check, and test tasks are defined.

## 2.0 status

The implementation debts selected for 2.0 are resolved:

- The encoder writes through a growable buffer, avoiding chunk-array accumulation and a second full-size concatenation buffer.
- The decoder uses an explicit container stack, removing decoder dependence on the JavaScript call stack.
- Deterministic generated tests cover 100 nested values, alongside protocol fixtures and boundary/error tests.

## Intentional non-goals

Torrent and Tracker schema validation remains an upper-layer responsibility. This package validates Bencode syntax, canonical key ordering, byte fidelity, and resource limits; it does not interpret application schemas or calculate info hashes.

Differential testing against independent implementations is a useful future quality enhancement, but is not an unresolved 2.0 implementation debt. The current release has deterministic generated coverage, real protocol fixtures, and focused malformed-input tests.

## 中文

### 2.0 已解决

- 普通对象的原型键问题和二进制键标记碰撞：改用 `Map` 和直接二进制键。
- 整数精度丢失：编码和解码都强制安全整数。
- 接受尾随输入：顶层解码要求完整消费。
- 字节串长度解析宽松：严格校验数字、前导零和安全范围。
- 字符串排序问题：按原始字节比较字典键。
- 静默覆盖重复键：拒绝重复线路键。
- 编码循环引用：抛出 `BencodeEncodeError`。
- 解码递归和超大输入风险：使用显式容器栈，并增加 `maxDepth` 与 `maxBytes`。
- CI 质量门禁缺失：增加格式、lint、类型检查和测试任务。

### 2.0 状态

- 编码器改用可增长输出缓冲区，避免先积累分块再进行第二次完整拼接分配。
- 解码器改用显式容器栈，不再依赖 JavaScript 调用栈。
- 确定性生成式测试覆盖 100 个嵌套值，并与真实协议样本、边界和错误测试共同验收。

### 明确非目标

Torrent 和 Tracker schema 校验仍由上层负责。本库负责 Bencode 语法、规范键排序、字节准确性和资源限制，不解释业务 schema，也不计算 info hash。

与独立实现进行差分测试可以作为未来质量增强，但不属于当前未解决的 2.0 实现债务；当前版本已有确定性生成式测试、真实协议样本和针对非法输入的测试。

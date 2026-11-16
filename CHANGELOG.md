# 变更日志 / Changelog

## 2.0.2

### Fixed

- Preserve a leading UTF-8 BOM (`U+FEFF`) in decoded byte strings and dictionary keys instead of silently stripping it.
- Use complete key bytes, including a leading BOM, for canonical ordering and duplicate detection; compatibility mode also preserves BOM-prefixed keys and their identity.
- Reject malformed integer tokens containing a BOM, such as `i<U+FEFF>42e`.
- Add six BOM regression tests covering byte-preserving round trips, canonical and non-canonical key ordering, distinct and duplicate keys, and invalid integers. Fixes [#1](https://github.com/deno-torrent/bencode/issues/1).

### Compatibility

- No API changes. Callers that relied on BOM stripping must explicitly remove `U+FEFF` in their application; `allowUnsortedKeys` still skips only dictionary ordering validation.

## 2.0.1

### Added

- Added the opt-in decoder option `allowUnsortedKeys` for compatibility with known protocol implementations that emit non-canonical dictionary ordering.
- Compatibility mode preserves received `Map` order while continuing to reject duplicate keys, malformed input, trailing data, and resource-limit violations.

## 2.0.0

### Breaking changes

- Dictionary values are now `Map<string | Uint8Array, BencodeValue>`.
- Plain object dictionaries are no longer accepted by `encode`.
- Binary dictionary keys are returned directly as `Uint8Array`.
- Removed `BYTE_KEY_PREFIX`, `isByteKey`, and `byteKeyToUint8Array`.
- Decoder now rejects trailing data, unsorted keys, duplicate keys, unsafe integers, and malformed lengths.

### Safety and quality

- Added decoder `maxBytes` and `maxDepth` resource limits.
- Added cyclic-container detection to the encoder.
- Added canonical raw-byte dictionary ordering.
- Replaced encoder chunk accumulation with a growable output writer.
- Replaced recursive decoding with an explicit parser stack.
- Added deterministic property tests covering 100 generated nested values.
- Added real Torrent and Tracker fixture coverage.
- Added format, lint, type-check, and test CI gates.

### Tooling

- Upgraded package version to `2.0.0`.
- Updated `@std/assert` to the current `1.0.19` release line.
- Updated CI to `actions/checkout@v4`, `denoland/setup-deno@v2`, and the latest Deno channel.

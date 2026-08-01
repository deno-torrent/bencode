# 开发指南 / Development Guide

## Prerequisites

- Deno 2.x or the current Deno stable channel.
- Network access to JSR for the first dependency resolution, or a populated Deno cache.

## Quality commands

```sh
deno task fmt
deno task lint
deno task check
deno task test
```

All four commands must pass before a change is considered complete. `deno task test` includes real Torrent and Tracker fixtures plus deterministic generated round-trip cases.

## Style

- Use Deno's formatter as the source of truth.
- Keep public exports in `mod.ts` only.
- Prefer explicit types over `any`.
- Keep protocol parsing byte-oriented; do not use locale-dependent string ordering.
- Use `BencodeEncodeError` and `BencodeDecodeError` for library-level failures.
- Keep changes focused and add a regression test for every behavior change.

## Change workflow

1. State the problem and compatibility impact before editing.
2. Update or add the smallest relevant test first when practical.
3. Implement the focused change.
4. Run format, lint, type-check, and the complete test suite.
5. Update API docs and migration notes for public behavior changes.
6. Review `git diff` and `git status`; do not commit or push without explicit approval.

## Release checklist

- Update `deno.json` version and lockfile.
- Confirm README and `docs/API.md` describe the released API.
- Run all quality commands.
- Verify CI uses the intended Deno release channel.
- Create release notes describing breaking changes.

## JSR release flow

The repository publishes to JSR only when a GitHub Release is published. The release workflow checks that the release tag (for example, `v2.0.0`) exactly matches the `version` in `deno.json`, runs all quality gates, performs `deno publish --dry-run`, and then publishes through GitHub Actions OIDC. The JSR package must remain linked to this GitHub repository.

For maintainers:

1. Merge a release PR that updates `deno.json` and `CHANGELOG.md`.
2. Create a GitHub Release using the matching tag, such as `v2.0.0`.
3. Wait for `Publish JSR` to complete. Do not reuse a published version.

## 中文

### 前置条件

- Deno 2.x 或当前 Deno stable channel。
- 首次解析依赖时需要访问 JSR，或者提前准备好 Deno 缓存。

### 质量命令

```sh
deno task fmt
deno task lint
deno task check
deno task test
```

以上四条命令必须全部通过。`deno task test` 包含真实 Torrent、Tracker 样本以及确定性的生成式往返用例。

### 代码风格

- 以 Deno formatter 作为唯一格式化标准。
- 公共导出集中在 `mod.ts`。
- 使用明确类型，避免 `any`。
- 协议解析保持字节导向，禁止使用依赖 locale 的字符串排序。
- 库级失败使用 `BencodeEncodeError` 和 `BencodeDecodeError`。
- 每个行为变更都应增加回归测试。

### 变更流程

1. 修改前说明问题和兼容性影响。
2. 优先先增加或更新最小相关测试。
3. 实施范围明确的修改。
4. 执行格式、lint、类型检查和完整测试。
5. 公共行为变化时同步更新 API 文档和迁移说明。
6. 检查 `git diff` 与 `git status`；没有明确批准时不得 commit 或 push。

### 发布清单

- 更新 `deno.json` 版本和锁文件。
- 确认 README、`docs/API.md` 与发布 API 一致。
- 执行全部质量命令。
- 确认 CI 使用预期的 Deno 发布通道。
- 创建包含 breaking changes 的发布说明。

### JSR 发布流程

本仓库仅在 GitHub Release 发布时向 JSR 发布。发布工作流会检查 Release Tag（例如 `v2.0.0`）是否与 `deno.json` 中的 `version` 完全一致，执行全部质量门禁和 `deno publish --dry-run`，然后通过 GitHub Actions OIDC 正式发布。JSR 后台需要保持与本 GitHub 仓库的绑定。

维护者只需要：

1. 合并更新 `deno.json` 和 `CHANGELOG.md` 的版本发布 PR。
2. 使用匹配的 Tag 创建 GitHub Release，例如 `v2.0.0`。
3. 等待 `Publish JSR` 完成；不要重复使用已经发布过的版本号。

# ADR-0002：本地存储用 SQLite，令牌用 safeStorage 加密

- 状态：已接受（2026-11-20）；令牌加密决策已被 ADR-0011 取代（2026-11-23 改明文存储）

## 背景

需求：多账号（资料 + 令牌组 + 按账号累积的流水库）。原版 endlogs 只有一个单用户 `tokens.json` 明文文件。

候选：JSON 文件 / IndexedDB / SQLite。

## 决策

1. 结构化数据（账号、流水、同步水位）存 **SQLite**（better-sqlite3，同步 API，主进程使用），schema 见 data-model.md
2. **令牌组经 `safeStorage` 加密**后存 SQLite 的 `account_tokens`（加密 blob），由 `TokenStore` 模块唯一读写；渲染进程永远无法获得令牌明文
3. 码表沿用 userData 下的 `change_reasons.json` 文件（保持原版 endlogs 可手改、热重载特性）

理由：

- 流水量（三币种 × 多年 × 多账号）与聚合查询（按日/按原因分组）超出 JSON 文件合理规模；SQLite 索引后 `(account_id, currency_type, change_time)` 范围扫描是正路
- upsert 幂等（`ON CONFLICT`）在 SQLite 是原生操作，正好承载「seqId 去重」这个核心不变量
- safeStorage 用 OS 级密钥链（macOS Keychain / Windows DPAPI），比原版 endlogs 明文 `tokens.json` 强一个量级，且无跨平台成本

## 后果

- better-sqlite3 是原生模块：需要 electron-rebuild；是打包链路的主要复杂度来源
- 主进程崩溃或迁移失误可能损坏库文件 → 启动时 `PRAGMA integrity_check`，失败即带明确提示重建
- 用户换机器不迁移令牌（密钥链解不开），需要重新登录——接受，安全优先

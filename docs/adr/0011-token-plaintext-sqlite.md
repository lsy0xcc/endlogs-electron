# ADR-0011：令牌明文存 SQLite，取消 safeStorage 加密

- 状态：已接受（2026-11-23，用户决策）
- 修订：ADR-0002 中「令牌组经 safeStorage 加密后存 SQLite」的决策（SQLite 存储部分不变）

## 背景

safeStorage 依赖 OS 级密钥链（macOS Keychain / Windows DPAPI），带来双平台测试成本；且加密后的库文件换机不可迁移（密钥链解不开）。

威胁模型重估：令牌本质是请求头里的明文字符串，用户随时可以从浏览器 DevTools 直接复制导出（ADR-0014 的手动登录路径即基于此）。本地加密防的是「能读到数据库文件的人」，而能碰用户机器的人通常也能复刻该导出——加密收益不大。

## 决策

1. `account_tokens` 以明文 JSON（TEXT）存储 SessionTokens，不再经过 safeStorage
2. `TokenStore` 模块保留：仍是令牌的唯一读写入口，「渲染进程永远拿不到令牌」的进程隔离不变（见 architecture.md 关键规则 2）

## 后果

- 换机/备份：直接复制数据库文件即可携带令牌
- 数据库文件含明文令牌——需在文档中提醒用户不要随意分享 `endlogs.db`
- 减少 macOS / Windows 双平台测试面

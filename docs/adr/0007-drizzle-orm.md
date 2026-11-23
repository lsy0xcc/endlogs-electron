# ADR-0007：数据访问层采用 Drizzle ORM（better-sqlite3 驱动）

- 状态：已接受（2026-11-20）

## 背景

ADR-0002 定了 SQLite（better-sqlite3）。问题：是否再加 ORM。候选：不用（裸 SQL）、Drizzle、Prisma。

## 决策

采用 **Drizzle ORM**，驱动仍为 better-sqlite3，schema 用 drizzle 的 TS DSL 重写 data-model.md 中的 DDL（`drizzle/schema.ts` 为唯一真源），迁移用 drizzle-kit。

理由：

- 写入路径有多条（在线拉取、CSV 导入、未来修复工具），类型化的 schema + upsert onConflict 在各路径间共享，比裸 SQL 手写字符串安全
- 查询结果全类型推导，契合 strict TS；SQL 风格 API，无魔法
- 轻量：纯 TS、无 codegen 进程、无引擎二进制（Prisma 在 Electron 打包中 binary 处理繁琐）
- drizzle-kit 提供 migration 生成与用户库升级路径（应用启动时跑迁移）

## 后果

- DDL 不再手写：data-model.md 保持概念 schema，实现以 `drizzle/schema.ts` 为准（两者不一致时先改文档再改代码，AGENTS.md 流程不变）
- better-sqlite3 原生模块 + electron-rebuild 的打包约束不变（ADR-0002）
- 复杂聚合（按日/按原因分组）允许绕过 Drizzle 直接 `db.run(sql...)`，返回值手动标注类型

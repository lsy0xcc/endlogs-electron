# AGENTS.md — 给参与本项目的编码 Agent

## 项目一句话

用 Electron 重写 ../endlogs（Python 版终末地资源日志助手），核心变化：多账号、本地累积流水、手动粘贴 token 登录、码表自动更新、进度条、CSV 导入导出。

## 必读顺序

动手前先读，按序：

1. [docs/glossary.md](docs/glossary.md) — 所有领域词汇以术语表为准，代码命名、提交信息、PR 描述不得自造同义词
2. [docs/requirements.md](docs/requirements.md) — 需求边界，别扩
3. [docs/architecture.md](docs/architecture.md) — 模块归属：改哪层、IPC 契约
4. [docs/data-model.md](docs/data-model.md) — schema 变更前必读
5. [docs/csv-format.md](docs/csv-format.md) — CSV 导入导出格式规范，做导入导出必读
6. [docs/upstream-api.md](docs/upstream-api.md) — 上游 API 事实（请求头、分页、枚举值），是逆向所得不是猜测，改动前先核对
7. [docs/adr/](docs/adr/) — 已决事项。与 ADR 冲突的实现会被打回；推翻 ADR 必须先写新 ADR

## 技术约定

- **栈**：Electron + electron-forge（Vite + TypeScript）、React、shadcn/ui（Radix + Tailwind）、Drizzle ORM + better-sqlite3
- 主进程 TypeScript，渲染进程 React + TS；`strict` 模式，不使用 `any` 逃逸（确需时 `unknown` + 收窄）
- 所有上游 HTTP 请求只发生在**主进程**（net / fetch），渲染进程零直连——上游要求特定的 `origin`/`referer`/`x-*` 头且存在 CORS 限制
- token 读写必须经过 `TokenStore`（渲染进程不可获取令牌）；令牌**明文**存于 SQLite（ADR-0011，不再使用 safeStorage）
- 时间处理：存储为 unix 秒；面向人的显示与解析统一按**系统时区**（显示时区，ADR-0012），禁止硬编码 Asia/Shanghai；CSV 导出时间列带显式偏移（ADR-0013 十列结构）；老格式 CSV 导入默认按 Asia/Shanghai 解释（旧项目导出口径，见术语表「时间处理规则」）
- `seqId` 是流水去重的唯一键（账号 × 币种内），所有写入走 upsert

## 流程约定

- schema / IPC 契约变更：先改 docs/data-model.md 或 architecture.md，再写代码
- 新决策 → 新 ADR（`docs/adr/NNNN-标题.md`，模板见 docs/adr/0001）
- 上游 API 行为与 upstream-api.md 不符时：先更新文档并注明验证日期，再适配代码
- 中文是项目工作语言（文档、UI 文案）；代码标识符与注释用英文

## 验证

- `npm run lint` / `npm test`（脚手架建立后生效）
- 涉及上游 API 的改动无法单测时，在 PR 描述中注明手工验证的日期与账号类型

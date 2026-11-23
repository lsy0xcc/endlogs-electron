# Endlogs Electron（终末地资源日志助手）

本地桌面应用（Electron）：登录[鹰角客服中心](https://customer-service.hypergryph.com/app/endfield/gamelogs/2)后，查询《明日方舟：终末地》源石 / 嵌晶玉 / 武库配额流水，本地累积历史数据并支持多账号管理与导入导出。

> **非官方工具**。接口可能变更；仅用于查询本人账号数据。请勿分享 token 及 `endlogs.db` 数据库文件（内含明文令牌，ADR-0011）。

本项目是 [endlogs](../endlogs)（Python + FastAPI + Playwright）的 Electron 重写。

---

## 核心功能

- **双登录方式**：弹出浏览器完成鹰角账号登录并自动捕获 token；或手动粘贴 DevTools 中复制的 token 字段（见 ADR-0014）
- **多账号**：保存多个账号的资料 / token / 已获取的资源流水，随时切换
- **数据累积**：拉取的流水落本地库，展示基于当前账号全部历史流水，而非单次查询结果
- **码表自动更新**：每次拉取数据时自动同步 changeReason 码表（官方前端 → 本地缓存 → 内置兜底，逐级回退），无需手动点击
- **进度反馈**：拉取数据时按日期比例显示进度条
- **导入导出**：CSV 导出 10 列（可读列在前、原始码在后），兼容导入旧版 endlogs 的 8 列格式；导出时间列按系统时区并带显式偏移，文件名附角色 UID

## 技术栈

| 层 | 选型 |
|----|------|
| 框架 | Electron + electron-forge（Vite + TypeScript 模板） |
| UI | React + shadcn/ui（Radix + Tailwind CSS） |
| 本地存储 | SQLite（Drizzle ORM + better-sqlite3），token 明文存储（ADR-0011） |
| 目标平台 | Windows、macOS |

架构决策见 [docs/adr/](docs/adr/)，术语见 [docs/glossary.md](docs/glossary.md)。

## 开发

```bash
npm install
npm start        # 开发模式
```

## 打包发布

```bash
npm run package   # 本地打包（当前平台）
npm run make      # 按 forge.config.ts 中配置的 target 产出安装包
```

（脚手架尚未初始化，命令以 forge 标准模板为准。）

## 文档地图

| 文档 | 内容 |
|------|------|
| [docs/requirements.md](docs/requirements.md) | 功能需求与验收要点 |
| [docs/architecture.md](docs/architecture.md) | 进程模型、模块划分、IPC 面 |
| [docs/data-model.md](docs/data-model.md) | SQLite schema、去重与增量拉取策略 |
| [docs/upstream-api.md](docs/upstream-api.md) | 上游（客服中心）API 逆向笔记 |
| [docs/csv-format.md](docs/csv-format.md) | CSV 导入导出格式规范 |
| [docs/glossary.md](docs/glossary.md) | 领域术语表 |
| [docs/ui.md](docs/ui.md) | 数据展示设计（待讨论，仅记录约束） |

## License

MIT。与鹰角网络 / Hypergryph 无关。

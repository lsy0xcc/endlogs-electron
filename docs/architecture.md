# 架构

Electron 桌面应用，无本地 HTTP 服务（旧项目的 FastAPI 层整体取消，由主进程模块替代）。

## 进程模型

```
┌───────────────────────────── 主进程 (main) ─────────────────────────────┐
│                                                                          │
│  auth/          登录入口：BrowserWindow 弹窗嗅探 + 手动 token 粘贴        │
│    LoginService      浏览器登录的令牌捕获管线（请求头嗅探，ADR-0003）       │
│    ManualTokenForm   手动 4 字段 token 表单校验 → 直接落库（ADR-0014）      │
│  upstream/      上游 API 客户端（唯一出口，见 upstream-api.md）            │
│    CurrencyLogClient seqId 分页拉取（最新→最旧，有效早停见 ADR-0015）       │
│    BindingClient     binding_list 拉取                                   │
│    ReasonTableSync   码表热更（官方 → 本地缓存 → 内置兜底，ADR-0010）      │
│  store/         本地持久化                                                │
│    Database          better-sqlite3（schema 见 data-model.md）            │
│    TokenStore        令牌组读写唯一入口（明文存 SQLite，ADR-0011）          │
│  ledger/        流水服务                                                  │
│    SyncService       拉取（增量至 T / 全量，T 早停，ADR-0015）+ upsert + 进度事件 │
│    ImportExport      CSV 导入导出（papaparse，见 csv-format.md）              │
│  ipc/           IPC 契约层（handlers 注册，见下）                          │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │ contextBridge（白名单 API）
┌──────────────────────────── 渲染进程 (renderer) ─────────────────────────┐
│  React + shadcn/ui（Base UI + Tailwind v4，ADR-0016）                        │
│  页面：主页（账号下拉 / 拉取 / 展示 / CSV 导出）/                              │
│        设置页（lookback / CSV 导入导出 / 用户管理 / 码表）（见 ui.md）         │
│  纯展示与状态，不直连上游、不落盘                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## 关键规则

1. **上游请求只在主进程**。上游要求 `origin`/`referer` 与客服中心一致并携带 `x-`\* 令牌头，渲染进程直连既有 CORS 也泄露凭证。
2. **令牌零散落**。捕获 → `TokenStore`（明文存 SQLite，ADR-0011）→ 内存供 `upstream/` 使用；渲染进程永远拿不到令牌。
3. **两条登录入口，一种令牌组**。浏览器登录走「弹窗 → 页面发请求 → 嗅探 `x-`\* 头」管线（ADR-0003）；手动粘贴 token 直接落库、不经浏览器（ADR-0014）。两者产出的 `SessionTokens` 同构，下游无差别。
4. **展示只读流水库**。渲染进程查询的是本地 SQLite（经 IPC），拉取动作只是同步流水库的手段。

## IPC 面（主 → 渲染暴露的能力，实现时以 zod schema 固化）

| 通道（暂名）                                                        | 方向   | 语义                                                                                                 |
| ------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| `auth:loginBrowser`                                                 | invoke | 打开登录窗口，返回捕获结果（或轮询 `auth:loginStatus`）                                              |
| `auth:loginTokens`                                                  | invoke | 传入手动粘贴的 4 字段 token，校验后直接落库（ADR-0014）                                              |
| `auth:refreshProfile`                                               | invoke | 用 binding_token 刷新角色资料                                                                        |
| `accounts:list` / `switch` / `archive` / `restore` / `updateTokens` | invoke | 多账号管理（删除 = 归档软删除，编辑 = 更新 token；重复 roleId 合并/恢复语义见 ui.md、data-model.md） |
| `sync:run`                                                          | invoke | 拉取（模式：同步数据（增量至 T）/ 获取全部，各 × 币种；ADR-0015），入参出参含进度                    |
| `sync:progress`                                                     | event  | 进度事件（比例 0–1 + 阶段文案 + 缺口通知）                                                           |
| `ledger:query`                                                      | invoke | 查询当前账号流水/汇总（展示层过滤 changeType）                                                       |
| `csv:export` / `csv:import`                                         | invoke | 导出保存对话框 / 导入解析 + 预检（条数、冲突；papaparse，ADR-0013）                                  |
| `reasons:status` / `reasons:sync`                                   | invoke | 码表版本与来源（诊断用）/ 手动触发码表同步（设置页按钮，ADR-0006 修订）                              |
| `settings:get`                                                      | invoke | 读设置（`maxLookbackDays` 只读展示，R7；含检测值变化时「推荐获取全部」提示的返回）                   |

## 错误处理

- 上游 `code != 0` → 统一 `UpstreamError`，向渲染进程转成用户可读消息（含「token 失效请重新登录」分支）
- 登录窗口被用户关闭 → 取消态，不报错
- 码表同步全链路失败 → 静默沿用缓存，`reasons:status` 可查

## 进度条口径（ADR 遗留的展示细节）

拉取为最新→最旧分页，取已见记录的最小 `changeTime`：
`progress = (end_ts − min_changeTime_seen) / (end_ts − start_ts)`，`start_ts` = T（同步数据）或 `maxLookbackDays` 预测值（全量拉取），首屏未知时按已拉页数粗估。

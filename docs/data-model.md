# 数据模型

SQLite（better-sqlite3）+ Drizzle ORM（ADR-0007），库文件置于 `app.getPath('userData')/endlogs.db`。同步 API（主进程单线程内使用）。schema 实现以 `drizzle/schema.ts` 为唯一真源，本文档为概念 schema。

## 表结构

```sql
-- 账号：一次登录捕获（鹰角账号 + 所选角色）
CREATE TABLE accounts (
  id              INTEGER PRIMARY KEY,
  account_uid     TEXT,          -- binding_list 的 binding.uid（账号级）
  role_uid        TEXT,          -- RoleProfile.uid（= roleId，展示用 UID）
  nick_name       TEXT,
  channel_name    TEXT,
  server_id       TEXT,
  server_name     TEXT,
  level           INTEGER,
  status          TEXT NOT NULL DEFAULT 'active',  -- active / archived（软删除，见 ui.md「归档语义」）
  created_at     INTEGER NOT NULL,   -- unix 秒
  updated_at     INTEGER NOT NULL
);

-- 令牌组：明文 JSON 存为 TEXT（不再 safeStorage 加密，ADR-0011），TokenStore 唯一读写方
-- （列结构对应用 = SessionTokens 的 JSON 序列化）
CREATE TABLE account_tokens (
  account_id      INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  tokens          TEXT NOT NULL    -- {account_token, role_token, role_server_id,
                                  --  binding_token, language} 明文 JSON
);

-- 流水库：展示口径的唯一数据源（ADR-0005）
-- 表名 ledger_entries（账本条目），避免与 SQLite/Drizzle 的事务（db.transaction）混淆
CREATE TABLE ledger_entries (
  account_id     INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  currency_type  INTEGER NOT NULL,          -- 1 源石 / 2 嵌晶玉 / 3 武库配额
  seq_id         INTEGER NOT NULL,          -- 上游游标，账号×币种内唯一
  change_type    INTEGER NOT NULL,          -- 1 获取 / 2 消耗（入库恒为 0 拉取的全量）
  change_reason  INTEGER NOT NULL,          -- 数字原因码
  change_num     INTEGER NOT NULL,          -- 恒为正，方向看 change_type
  after          INTEGER NOT NULL,          -- 变动后存量
  change_time    INTEGER NOT NULL,          -- unix 秒（绝对时刻，无时区属性；见术语表「时间处理规则」）
  PRIMARY KEY (account_id, currency_type, seq_id)
);
-- 服务展示层日期范围过滤与 (change_time, seq_id) 排序聚合（同秒多笔时排序稳定）；
-- seqId 打头的查询（已知性检查、upsert 冲突）由主键免费覆盖，无需冗余索引
CREATE INDEX idx_entry_time ON ledger_entries(account_id, currency_type, change_time DESC, seq_id DESC);

-- 同步进度（ADR-0015）：每账号×币种一条，只存 T
-- T 的不变量：[T, 现在] 内任何上游能返回的记录都已在库（死亡区缺口对其恒真）
CREATE TABLE sync_state (
  account_id     INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  currency_type  INTEGER NOT NULL,
  synced_until   INTEGER,     -- T：早停锚点；NULL = 从未同步（含仅 CSV 导入）
  updated_at     INTEGER NOT NULL,   -- unix 秒（元数据时间统一 unix 秒）
  PRIMARY KEY (account_id, currency_type)
);
```

元数据时间列（`accounts.created_at` / `updated_at`、`sync_state.updated_at`）与 `change_time` 一律 INTEGER unix 秒——存储永远是绝对时刻，见术语表「时间处理规则」。

码表不进库：userData 下的 `change_reasons.json`，结构沿用旧项目 `{version, source, reasons}`，可手改（热重载）。

## 写入与去重

- 所有流水写入走 **upsert**（`INSERT ... ON CONFLICT(account_id, currency_type, seq_id) DO UPDATE`），重复拉取幂等
- 导入 CSV 与在线拉取写同一张表、同一条 upsert 路径——来源不同、键相同即同一笔流水

## 拉取与同步（ADR-0015）

两个拉取入口（R3），均从最新往旧翻页、沿途一律 upsert：

- **同步数据**：目标 = T；T 为 NULL（从未同步，含仅导入账号）时与「获取全部历史数据」等价
- **获取全部历史数据**：翻到 `hasNext=false` 为止——上游返回边界的事实，运行时感知，不依赖任何预存值

通用规则：

1. 逐页拉取（`changeType=0` 全量，见 ADR-0005），从最新往旧翻页
2. **翻页途中经过的记录一律 upsert**（拉取「路过」的数据不丢弃）——上游分页只能从最新开始
3. 停止条件（满足其一）：
   - `hasNext=false`（到达上游边界；这是一切不可获取缺口的唯一出生点）
   - **有效早停**：本页全部已知**且本页最新记录 `change_time ≤ T`**（翻页从新到旧单调下降，首个满足的页必然紧贴 T 下方；孤岛等已知数据在 T 之上不触发早停，翻页穿过即吸收）
4. 拉取成功后：`T = 现在`
5. **CSV 导入永不写 `sync_state`**：导入建立的已知数据是孤岛，不构成同步声明；孤岛在下次「同步数据」翻页穿过时被吸收
6. 拉取结束时停点在旧 T 之上（`hasNext=false` 先于到达 T）：缺口 = (旧 T, 停点)，**出生即死亡**（整个位于上游边界之下）——发**非阻塞通知**「xx–xx 的记录已无法从客服中心获取」；不设选择框（「是否忽略」两选项被证明无数据差异，ADR-0015）

## 最多可获取天数（纯咨询，ADR-0015）

- 上游边界的**事实**由 `hasNext=false` 给出；本地设置 `maxLookbackDays`（默认 90）是预测值，**不限制任何拉取行为**，仅用于进度条分母与「推荐获取全部历史数据」提示的触发
- 预测值可从官方游戏日志页 HTML 文案解析（2026-11-23 发现）；实现暂以 TBD 存根（异步函数恒返回 90），落地后作为设置的默认值与自动检测来源
- 设置页**只读展示**检测值（用户不可手动修改）；检测值与上次不同 → 提示「推荐获取全部历史数据」；拒绝则按增量同步继续

## 汇总计算（展示层，纯查询）

沿用旧项目口径（`stats/aggregate.py`），但数据源是流水库而非单次拉取：

- 按 `(change_time, seq_id)` 升序排列后：`opening = first.after − signed(first)`，`closing = last.after`
- `signed = change_type==2 ? −|change_num| : +|change_num|`
- 获取/消耗按 `change_type` 分桶累计；`changeType` 的获取/消耗过滤在 SQL 层做，**期初/期末不受过滤影响**（这是对旧项目缺陷的修复，见 ADR-0005）

## 已知边界情况

- 同一鹰角账号换绑角色后重新登录：视为新账号实体（uid 不同则不同账号）；`account_uid` 相同可提示用户合并/替换
- **删除账号 = 归档**（软删除）：`status='archived'`，不触发级联删除，流水与 `sync_state` 原样保留、导出可用；恢复 = `status='active'`（见 ui.md「归档语义」）
- **重复 roleId**：添加账号时 token 解析出的 roleId 与已有账号相同 → 确认后**合并为刷新 token**（覆盖 `account_tokens`，不新建实体，流水不动）；与已归档账号相同 → 确认后**恢复 + 刷新 token**
- CSV 导入的时间列：本项目导出（11 列 camelCase）只解析 `isoTime`（UTC，`Z` 结尾）为 unix 秒；老格式按用户选择时区（默认 Asia/Shanghai，旧项目导出口径）解析为 unix 秒（ADR-0012）；解析失败的行整行拒绝并报告

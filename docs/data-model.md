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
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- 令牌组：明文 JSON 存为 TEXT（不再 safeStorage 加密，ADR-0011），TokenStore 唯一读写方
-- （列结构对应用 = SessionTokens 的 JSON 序列化）
CREATE TABLE account_tokens (
  account_id      INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  tokens          TEXT NOT NULL    -- {account_token, role_token, role_server_id,
                                  --  binding_token, language} 明文 JSON
);

-- 流水库：展示口径的唯一数据源（ADR-0005）
CREATE TABLE transactions (
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
CREATE INDEX idx_tx_time ON transactions(account_id, currency_type, change_time DESC);

-- 同步进度：记录已拉取覆盖到的最早时间/seqId（每账号×币种），
-- 供增量拉取判断「哪些数据已在库」（遇到已获取旧数据即停）
CREATE TABLE sync_state (
  account_id     INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  currency_type  INTEGER NOT NULL,
  last_min_change_time INTEGER,     -- 已覆盖到的最早流水时间
  last_seq_id    INTEGER,
  updated_at     TEXT NOT NULL,
  PRIMARY KEY (account_id, currency_type)
);
```

码表不进库：userData 下的 `change_reasons.json`，结构沿用旧项目 `{version, source, reasons}`，可手改（热重载）。

## 写入与去重

- 所有流水写入走 **upsert**（`INSERT ... ON CONFLICT(account_id, currency_type, seq_id) DO UPDATE`），重复拉取幂等
- 导入 CSV 与在线拉取写同一张表、同一条 upsert 路径——来源不同、键相同即同一笔流水

## 增量拉取（依据同步进度）

拉取按 `seqId` 从新到旧分页：

1. 逐页拉取（`changeType=0` 全量，见 ADR-0005）
2. 停止条件（满足其一）：`hasNext=false`；本页全部 `seqId` 已在库（即遇到已获取过的旧数据）；`change_time < start_ts`（服务端顺序假设：最新优先）
3. 目标起点早于拉取上限（`MAX_LOOKBACK_DAYS = 90`，见术语表与 upstream-api.md）时自动截到上限
4. upsert 后更新同步进度（`sync_state`）

## 汇总计算（展示层，纯查询）

沿用旧项目口径（`stats/aggregate.py`），但数据源是流水库而非单次拉取：

- 按 `(change_time, seq_id)` 升序排列后：`opening = first.after − signed(first)`，`closing = last.after`
- `signed = change_type==2 ? −|change_num| : +|change_num|`
- 获取/消耗按 `change_type` 分桶累计；`changeType` 的获取/消耗过滤在 SQL 层做，**期初/期末不受过滤影响**（这是对旧项目缺陷的修复，见 ADR-0005）

## 已知边界情况

- 同一鹰角账号换绑角色后重新登录：视为新账号实体（uid 不同则不同账号）；`account_uid` 相同可提示用户合并/替换
- CSV 导入的时间列：带时区偏移的按偏移解析，老格式按用户选择时区（默认 Asia/Shanghai，旧项目导出口径）解析为 unix 秒（ADR-0012）；解析失败的行整行拒绝并报告

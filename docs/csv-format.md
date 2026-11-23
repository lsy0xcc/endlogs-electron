# CSV 导入导出格式规范

导出固定 **11 列 camelCase 表头**——前 6 列便于人读，后 5 列（`isoTime` + 原始码）为机器权威值（ADR-0013）。`time` 列按系统时区格式化（ADR-0012），`isoTime` 列为 UTC。文件名附带角色 UID、UTF-8 BOM。解析与生成统一使用 **papaparse**（主进程），不自写解析器。

## 导出格式

- 表头（固定 11 列，UTF-8，**带 BOM** `\uFEFF`）：

```csv
time,resourceType,reason,changeType,amount,balanceAfter,isoTime,currencyCode,reasonCode,changeTypeCode,seqId
```

- 行粒度：一笔流水一行；**单文件单币种**（文件名含币种编号）
- 列语义：

| 列             | 来源             | 说明                                                                                    |
| -------------- | ---------------- | --------------------------------------------------------------------------------------- |
| time           | `changeTime`     | `YYYY-MM-DD HH:MM:SS`，按系统时区格式化、**无偏移**（ADR-0012）；仅人读，**导入不解析** |
| resourceType   | 币种名           | 源石 / 嵌晶玉 / 武库配额                                                                |
| reason         | 码表映射         | 未收录码为 `未知原因(N)`；导入时仅供参考                                                |
| changeType     | `changeTypeName` | 获取 / 消耗                                                                             |
| amount         | `signed_delta`   | **带符号**：获取 `+100` / 消耗 `-50`（`changeType==2` 取负）                            |
| balanceAfter   | `after`          |                                                                                         |
| isoTime        | `changeTime`     | ISO 8601 UTC：`YYYY-MM-DDTHH:MM:SSZ`。**导入的权威时间源**；跨时区机器导出字面值恒定    |
| currencyCode   | `currencyType`   | 数字原值（1/2/3）                                                                       |
| reasonCode     | `changeReason`   | 数字原值（字符串）                                                                      |
| changeTypeCode | `changeType`     | 数字原值（1/2）                                                                         |
| seqId          | `seqId`          | 去重键                                                                                  |

- 排序：时间倒序（最新在前）
- 分隔符 `,`，引号 `"`，QUOTE_MINIMAL（值含 `,` `"` 换行时加引号，内嵌引号翻倍），行尾 `\r\n`（papaparse `quotes`/`newline` 选项）
- 文件名：`endfield_{currency_type}_{start}_{end}_uid{roleId}.csv`
  （如 `endfield_1_2026-11-01_2026-11-20_uid12345678.csv`；UID 用于导入时预选账号）
- 导出入口：主页「导出 CSV」按钮（当前账号）与设置页用户管理表（见 ui.md）；范围 = 日期范围（默认全部），直接读流水库、不重新拉取

## 导入格式

**接受**（按表头识别格式，无法识别则整体拒绝）：

1. 本项目导出（11 列 camelCase 表头如上）——完美往返
2. 旧 Python 项目导出（8 列中文表头 `时间,资源,变动类型,原因码,原因,变动数量,变动后存量,seqId`，无 BOM 亦可）
3. BOM + UTF-8/UTF-8-BOM 编码；其他编码（GBK 等）明确报错提示，不猜测

**解析规则**：

- **格式判定按表头**（camelCase 11 列 / 旧中文八列；判定在 papaparse 解析后的 `meta.fields` 上做）
- **11 列格式以码列 + isoTime 为准**：currencyCode / reasonCode / changeTypeCode / seqId / isoTime 直接入库；resourceType / reason / **time 三列仅参考不导入**——time 无偏移、字面值随导出机器时区而变，不作为时间源；原因显示以本地最新码表解释
- 11 列格式 amount 的符号须与 changeTypeCode 一致（+↔获取、−↔消耗），冲突的行拒绝
- 旧格式：资源名 → `currency_type`（源石=1 / 嵌晶玉=2 / 武库配额=3），未知资源名该行拒绝；变动类型名 → `change_type`（获取=1 / 消耗=2）；原因码列取数字
- 时间：11 列格式**只解析 isoTime**（UTC，必须以 `Z` 结尾）→ unix 秒；旧格式为纯 `YYYY-MM-DD HH:MM:SS`，按用户选择的时区（**默认 Asia/Shanghai**，旧项目导出口径，与显示时区无关）解析为 unix 秒；解析失败该行拒绝
- seqId 必须为正整数；缺失/非整数的行拒绝

**归属账号（导入对话）**：

- 目标账号**由用户显式选择**（默认当前账号），不做静默自动分配——错误归属会污染目标账号的流水库
- 文件名含 `_uid{roleId}` 且匹配已知账号时，预选中该账号，仍需用户确认；老格式文件走手动选择
- 归档账号同样可被选为导入目标（数据隔离不变，见 ui.md「归档语义」）

**导入前预检**（用户确认后才执行）：总行数 / 拒绝行及原因 / 与库内 `seqId` 重复条数 / 判定出的文件格式与所用时区（旧格式时区在此步仍可调整）。

**写入语义**：按 `(account_id, currency_type, seqId)` upsert 进目标账号流水库；完成后报告新增/覆盖条数。多文件、多币种可一次导入（各文件币种独立判定）。

## 设计取舍

- **表头统一 camelCase**：机器可预测的命名；中文可读性由列取值承担（resourceType / reason / changeType 的值仍是中文），Excel 按列看不受影响
- **isoTime 位于 balanceAfter 与 currencyCode 之间**：它是「机器权威块」的第一列，前 6 列保持人读块完整（ADR-0013）
- **time 无偏移 + isoTime 权威**：time 列与游戏内/界面显示一致（系统时区），无需心算时差；绝对时刻由 isoTime 保证，跨时区机器导出导入无损。代价是 time 字面值随机器时区变——故导入不解析它，取代了 ADR-0009 的显式偏移方案
- **不加账号列**：保持列语义简洁，多账号归属靠「文件名 UID 预选 + 导入时确认」（ADR-0009）；API 全部字段均已入列（时间/币种/原因/类型/数量/存量/序号 + 各自原始码），无需额外列
- **papaparse**：导入导出共用（parse / unparse），表头判定基于 `meta.fields`；BOM 在生成侧手动前置一个 `\uFEFF` 字符
- **导出前不重新拉取**：直接导出流水库中该范围数据（与旧项目行为不同：旧项目导出时会重新请求上游）
- 汇总报告 PNG 等富导出：不在本格式范围，待数据展示需求确定（docs/ui.md）

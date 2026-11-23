# 领域术语表（Glossary）

项目统一词汇。代码命名、文档、提交信息均以此为准。引用旧项目实现时标注了出处（`endlogs` 仓库）。

## 上游与账号

| 术语                | 英文/代码名              | 定义                                                                                                                                                                                            |
| ------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 客服中心            | Customer Service Center  | 鹰角官方站点 `customer-service.hypergryph.com`，流水数据的唯一来源。前端资源托管在 `web.hycdn.cn`                                                                                               |
| 游戏日志页          | gamelogs page            | 客服中心内《终末地》资源流水页面：`/app/endfield/gamelogs/2`，登录后访问                                                                                                                        |
| 账号 token          | `account_token`          | 请求头 `x-account-token` 的值，客服中心会话凭证                                                                                                                                                 |
| 角色 token          | `role_token`             | 请求头 `x-role-token` 的值，与所选角色绑定                                                                                                                                                      |
| 角色 server id      | `role_server_id`         | 请求头 `x-role-server-id` 的值，所选角色的区服 id                                                                                                                                               |
| binding_token       | `binding_token`          | `binding_list` 接口 URL 的 `token` 查询参数；用于拉取角色绑定资料。与账号 token 不同源                                                                                                          |
| 会话令牌组          | `SessionTokens`          | 上述四项的集合 `{account_token, role_token, role_server_id, binding_token}`（附带 language）。流水接口只需前三项 + language；binding_token 仅用于 binding_list 拉取角色资料，且可选（ADR-0014） |
| 角色资料            | `RoleProfile`            | 账号的展示资料：渠道（channel_name）、昵称（nick_name）、UID（=roleId）、区服（server_name / server_id）、等级（level）。来源为 binding_list 响应或页面 localStorage                            |
| 渠道                | channel                  | 账号注册渠道（如官方/B 服），来自 binding_list 的 `channelName`                                                                                                                                 |
| 绑定列表            | `binding_list`           | `binding-api-account-prod.hypergryph.com/account/binding/v1/binding_list` 接口及其响应，含 `bindingList[].roles[]`                                                                              |
| 浏览器登录          | browser login            | 弹出浏览器窗口，用户登录客服中心，程序嗅探请求头捕获会话令牌组的流程                                                                                                                            |
| 手动粘贴 token 登录 | manual token paste login | 用户从浏览器 DevTools Network 面板复制 `x-account-token` / `x-role-token` / `x-role-server-id` / binding token 四字段粘贴进表单，程序直接作为令牌组落库，不经浏览器会话（见 ADR-0014）          |

## 资源与流水

| 术语        | 英文/代码名         | 定义                                                                                                                                       |
| ----------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------ |
| 资源        | currency            | 三种游戏资源统称。枚举 `currencyType`：1=源石，2=嵌晶玉，3=武库配额                                                                        |
| 流水        | ledger entry        | 一次资源变动记录，存于表 `ledger_entries`。字段：`currencyType`、`changeType`、`changeReason`、`changeNum`、`after`、`changeTime`、`seqId` |
| 变动类型    | `changeType`        | 0=全部，1=获取，2=消耗。注意：作为 API 参数时是**服务端过滤**；本地展示过滤是另一回事（见 ADR-0005）                                       |
| 变动数量    | `changeNum`         | 恒为正数，方向由 `changeType` 表达。有符号值需自行计算（`signed_delta`）                                                                   |
| 变动后存量  | `after`             | 该笔变动后的资源余额，是推导期初/期末的基础                                                                                                |
| `seqId`     | seqId               | 流水的单调序号（服务端游标，用于分页）。**账号 × 币种内唯一**，是本地去重的唯一键                                                          |
| 期初余额    | opening             | 期间第一笔流水的 `after - signed_delta`，由本地推导，API 无余额接口                                                                        |
| 期末余额    | closing             | 期间最后一笔流水的 `after`                                                                                                                 |
| 获取 / 消耗 | gained / consumed   | 期间内 `changeType=1` / `=2` 的 `                                                                                                          | changeNum | ` 累计 |
| 净变化      | net                 | `closing - opening`（无完整记录时退化为 `gained - consumed`）                                                                              |
| 原因码表    | change reason table | `changeReason`（数字码）→ 人类可读原因（如 10=干员寻访）的映射。三币种共用同一套码                                                         |
| 未知原因    | unknown reason      | 码表中不存在的码，显示为「未知原因(码)」——这是对用户的契约文案                                                                             |

## 时间

| 术语     | 英文/代码名      | 定义                                                                                                                                                                                                           |
| -------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 显示时区 | display timezone | **用户系统时区**。UI 展示、查询日期边界、CSV 导出的时间列统一按它格式化。可行原因：`changeTime` 来自 API、是绝对时刻（unix 秒），页面/游戏内显示也只是前端按时区格式化——用哪个时区显示都不损失信息（ADR-0012） |
| 日期边界 | date bounds      | 查询日起 00:00:00 至止日 23:59:59（显示时区）。上游 API **不支持日期参数**，日期过滤在客户端完成                                                                                                               |

### 时间处理规则（实现必须遵守）

1. **存储永远是绝对时刻**：数据库与上游的 `changeTime` 均为 unix 秒，无时区属性——时区只发生在「显示给人」或「解析人的输入」时
2. **格式化**（UI 展示、CSV 导出的 `time` 列）：一律按显示时区（系统时区）转换；转换统一走工具函数（集中一处，主/渲染各一份薄封装）。CSV 导出另含 `isoTime` 列：ISO 8601 UTC（`Z` 结尾），是导入的权威时间源（ADR-0013）
3. **解析**（查询日期范围）：日期边界（00:00:00 / 23:59:59）按显示时区（系统时区）计算
4. **CSV 导入**：本项目导出（camelCase 11 列）只解析 `isoTime`（UTC）为 unix 秒，`time` 列不解析（无偏移、字面值随导出机器时区而变）；老格式（无偏移，旧 Python 项目导出）按用户选择的时区、默认 Asia/Shanghai——旧项目导出即上海口径，与显示时区无关（ADR-0012）

## 本地数据

| 术语             | 英文/代码名        | 定义                                                                                                                                                                                                                                  |
| ---------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 账号             | account            | 一次登录捕获（一个鹰角账号 + 所选角色）在本地的实体。多账号即多实体，数据完全隔离                                                                                                                                                     |
| 归档账号         | archived account   | 账号的软删除状态：从主页下拉框隐藏，流水与同步进度保留、可导出，可在设置页恢复（见 ui.md「归档语义」）                                                                                                                                |
| 流水库           | ledger             | 按账号累积的全部流水（SQLite 表 `ledger_entries`）。展示口径 = 当前账号的流水库全量，**不是**单次拉取结果（见 ADR-0005）                                                                                                              |
| 同步数据         | sync button        | 页面按钮：增量同步到 T（同步进度上沿）；T 为 NULL（从未同步/仅导入）时等价于「获取全部历史数据」                                                                                                                                      |
| 获取全部历史数据 | full history fetch | 页面按钮：从最新翻页至上游返回尽头（`hasNext=false`），不受 T 早停约束                                                                                                                                                                |
| 增量拉取         | incremental fetch  | 从最新往回翻页，**有效早停** = 本页全部已知且最新记录 ≤ T；孤岛等悬空已知数据不停，翻页穿过时吸收（见 ADR-0015）                                                                                                                      |
| 同步进度         | sync progress      | 每账号 × 每币种一条（表 `sync_state`）：`synced_until`（T），不变量「[T, 现在] 内上游能返回的记录都已在库」。作用：早停锚点（ADR-0015）；**CSV 导入不写同步进度**                                                                     |
| 拉取上限         | lookback limit     | 上游流水最早只能拉到约 90 天前（2026-11-23 实测），更早的数据不返回；**事实边界由 `hasNext=false` 现场感知**。本地 `maxLookbackDays`（默认 90，可从官方页面文案解析、暂为 TBD 存根）为纯咨询预测值，不限制拉取行为（见 R7、ADR-0015） |
| 码表缓存         | reason table cache | userData 下的 `change_reasons.json`，结构与旧项目一致（`{version, source, reasons}`），可手改                                                                                                                                         |

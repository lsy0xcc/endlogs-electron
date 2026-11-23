# 上游 API 逆向笔记

事实来源：旧项目 `endlogs` 源码逆向（client/、auth/、config.py）。**不是官方文档**，接口可能变更；每条建议实现时实测复核，复核后在条目标注验证日期。

## 通用约束

- `API_BASE = https://customer-service.hypergryph.com`
- 登录页 / 游戏日志页：`/app/endfield/gamelogs/2`
- 所有数据接口需携带请求头（缺一不可）：

```
x-account-token:  <account_token>
x-role-token:     <role_token>
x-role-server-id: <role_server_id>
x-hg-language:    zh-cn
origin:  https://customer-service.hypergryph.com
referer: https://customer-service.hypergryph.com/app/endfield/gamelogs/2
```

- 响应包络：`{code, msg, data}`；`code != 0` 视为失败（token 失效以此显现，无刷新机制，只能重新登录）
- 频控：旧项目页间隔 250ms，单请求超时 30s，页大小 limit=50。建议沿用

## 资源流水

```
POST /api/center/open/v1/endfield/game_logs/currency
Content-Type: application/json

{ "currencyType": 1, "changeType": 0, "limit": 50 }        // 首页
{ ..., "seqId": <上一页最后一条的 seqId> }                  // 翻页
```

响应 `data`：`{ list: [...], hasNext: boolean }`。list 条目：

| 字段           | 类型 | 说明                                                          |
| -------------- | ---- | ------------------------------------------------------------- |
| `currencyType` | int  | 1 源石 / 2 嵌晶玉 / 3 武库配额                                |
| `changeType`   | int  | 1 获取 / 2 消耗（作为请求参数时 0=全部）                      |
| `changeReason` | int  | 数字原因码，查码表                                            |
| `changeNum`    | int  | 恒为正数                                                      |
| `after`        | int  | 变动后存量                                                    |
| `changeTime`   | int  | unix 秒（绝对时刻，无时区属性；页面显示只是前端按时区格式化） |
| `seqId`        | int  | 单调游标，**翻页取上一页最后一条**                            |

- 列表顺序：**最新在前**
- **无日期参数**：日期过滤只能客户端做（新架构：增量拉取按 ADR-0015 早停 + 本地流水库过滤）
- **最早只能拉到 90 天前**（2026-11-23 用户实测记录）：更早的数据上游不返回；**事实边界以 `hasNext=false` 现场感知为准**
- 游戏日志页 HTML 文案中含「最多可获取多少天」的说明（2026-11-23 发现），可用于自动检测拉取上限；解析实现暂为 TBD 存根（异步函数恒返回 90），落地后作为 `maxLookbackDays` 设置的默认与刷新来源（R7、ADR-0015）
- `changeType` 作为请求参数是**服务端过滤**：传 1/2 时返回的 after 序列不连续，推导出的期初/期末是错的 → 新架构入库恒传 0（ADR-0005）

## 绑定列表（角色资料）

```
GET https://binding-api-account-prod.hypergryph.com/account/binding/v1/binding_list
    ?token=<binding_token>&appCode=endfield
```

- 成功判定：`payload.status ∈ {0, "0", null}`
- 结构：`data.list[]`（按 `appCode == "endfield"` 过滤）→ `bindingList[]`（`uid`、`channelName`、`isDeleted`）→ `roles[]`（`roleId`、`nickName`、`serverId`、`serverName`、`level`、`isDefault`）
- 角色选择：优先 `serverId == role_server_id`，其次 `isDefault`，否则第一条

## 登录捕获（请求头嗅探）

- `x-account-token` / `x-role-token` / `x-role-server-id`：客服中心前端页面自身请求头
- `binding_token`：任何 URL 含 `binding_list` 的请求的 `?token=` 查询参数
- 页面 localStorage/sessionStorage 中键名匹配 `/role|account/i` 的项可补充角色资料（渠道/区服/等级）
- Electron 等效实现：`session.webRequest.onBeforeSendHeaders` 嗅探 + `webContents.executeJavaScript` 读 storage（ADR-0003）

## 码表热更来源

**仅使用官方源**（ADR-0010；GitHub raw / jsDelivr 镜像已从链路移除，需要时再评估恢复）：

1. **官方**：解析 `https://customer-service.hypergryph.com/app/endfield/gamelogs/2` HTML → 提取 `_next/static/chunks/*.js`（资源基址 `https://web.hycdn.cn/customer-service/web-cn`）→ BFS ≤48 个 chunk → 正则匹配形如 `{ 2: "邮件领取", ..., 25: "武库交易所消耗" }` 的对象（≥10 对才认可）

失败时逐级回退到本地缓存 → 内置兜底表（见 ADR-0006/0010）。

码表 JSON：`{ "_comment": ..., "version": "YYYY-MM-DD", "source": "official", "reasons": { "10": "干员寻访", ... } }`。解析时接受 `{reasons:{}}` 或扁平 map 两种形态，丢弃 `_` 开头键；`"0": "其他"` 恒被补回。

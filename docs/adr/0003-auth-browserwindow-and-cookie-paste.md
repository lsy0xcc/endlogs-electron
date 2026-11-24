# ADR-0003：登录捕获 = 请求头嗅探管线；粘贴 cookies 走注入复用同一管线

- 状态：部分被取代（2026-11-23）——「粘贴 cookies」入口已由 ADR-0014 废弃；浏览器登录嗅探管线仍有效
- 原状态：已接受（2026-11-20）

## 背景

- 数据接口需要 4 个凭证（`x-account-token` / `x-role-token` / `x-role-server-id` / binding `?token=`），它们只存在于登录后页面的**运行时请求**中
- 需求：保留弹浏览器登录；新增「粘贴 cookies」达到等效效果（用户决策：取代原版 endlogs 的 4 字段手动表单）

## 决策

两条登录入口，**一条捕获管线**：

1. **浏览器登录**：弹出 `BrowserWindow`（独立 partition）打开游戏日志页，用户登录；`session.webRequest.onBeforeSendHeaders` 嗅探 `x-*` 头，`onBeforeRequest` 捕 `binding_list?token=`，`executeJavaScript` 扫 localStorage 补角色资料
2. **粘贴 cookies**：用户粘贴 `k=v; k=v` 或 EditThisCookie JSON → 解析后 `session.cookies.set` 注入隐藏窗口（同 partition）→ 加载游戏日志页 → **站点自身发起请求** → 同一条嗅探管线捕获

即「等效」不是我们去解析 cookies 推导 token（脆弱、依赖站点存储细节），而是**让站点自己把 token 发给我们**。cookies 只解决「已登录态」这一件事。

## 后果

- 两条路径行为天然一致，测试只覆盖管线一次
- 不再支持原版 endlogs 的 4 字段粘贴表单（减少稀有入口）；若未来有需求可加回，捕获管线不受影响（注：该表单已由 ADR-0014 恢复为手动登录入口）
- 登录窗口关闭/隐藏窗口加载失败均为取消态，不报错

## 风险（实现时验证）

- **若客服中心的登录态不全在 cookies**（部分在 localStorage），纯 cookies 注入可能不足以让页面发出带凭证的请求 → spike 第一项：实测注入 cookies 后页面是否发出 `x-account-token` 请求。不成立时扩展粘贴格式为「cookies + localStorage 快照」（如 DevTools 的 `copy(JSON.stringify({...}))` 或浏览器扩展导出），管线不变

# ADR-0014：手动登录改为 4 字段 token 粘贴，废弃 cookies 注入

- 状态：已接受（2026-11-23，用户决策）
- 决策人：用户 + 会话讨论
- 修订：ADR-0003 中「粘贴 cookies 走注入复用同一管线」的决策；浏览器登录嗅探管线不变

## 背景

- ADR-0003 设计了「粘贴 cookies → `session.cookies.set` 注入隐藏窗口 → 站点发请求 → 嗅探」路径，其成立前提是**上游登录态全在 cookies**，原计划以 spike 实测验证
- 对原版 endlogs（../endlogs，Python）的核查结论（2026-11-23）：
  - Playwright 全程**不提取、不保存 cookies**；token 一律来自请求头 `x-account-token` / `x-role-token` / `x-role-server-id` 与 `binding_list` URL 的 `?token=`
  - 原版 endlogs 的手动备用路径（`/api/auth/manual`）就是 **4 字段裸 token 粘贴**，无任何 cookie 解析逻辑
- 跨域登录态（在 `customer-service.hypergryph.com` 登录后，`user.hypergryph.com` 保持登录）表明上游大概率确有 cookies 会话，但本项目不再据此构建功能

## 决策

1. 废弃「粘贴 cookies」入口及其隐藏窗口注入管线（含 `CookieImporter` 模块设想）
2. 手动登录采用 **4 字段 token 粘贴**：用户从浏览器 DevTools 的 Network 面板复制 `x-account-token`、`x-role-token`、`x-role-server-id`（默认 `1`）、binding token（可选）粘贴进表单，**直接作为 `SessionTokens` 落库，不经任何浏览器会话**
3. 填了 binding token 时自动调 `binding_list` 拉取角色资料（复用 `upstream/BindingClient`）；未填则允许保存，提示缺少角色资料，后续可经 `auth:refreshProfile` 补齐
4. 浏览器登录（请求头嗅探管线）保持 ADR-0003 原样不变

## 后果

- 无需再验证「注入 cookies 后页面是否发出带凭证请求」这一 spike；登录功能不依赖未验证的上游会话存储细节
- 实现与测试面缩小：少一条隐藏会话注入管线
- 用户门槛回退：手动路径需在 DevTools Network 面板逐字段复制请求头，比整段导出 cookies 高——用户已确认接受
- 两条登录入口产出的 `SessionTokens` 同构，下游（拉取、多账号、TokenStore）无差别

## 风险

- 4 字段粘贴的出错率高于浏览器登录（漏复制、复制错字段）；仅靠表单校验非空缓解，上游侧错误在拉取时由 `UpstreamError` 兜底提示

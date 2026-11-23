# ADR-0016：shadcn/ui 原语层改用 Base UI（跟随官方默认）

- 状态：已接受（2026-11-23，用户决策）
- 决策人：用户 + 会话讨论

## 背景

2026-07 起 shadcn 官方将新项目的原语层默认从 Radix 切换为 **Base UI**（changelog：`2026-07-base-ui-default`），Radix 仍并行维护但不再是默认。ADR-0008 定案（2026-11-20）时表述为 Radix。项目处于脚手架阶段、尚未生成任何组件，跟随官方默认无迁移成本。上游事实核对于 2026-11-23：shadcn CLI 4.23.0、`@base-ui/react` 1.9.0、tailwindcss 4.3.5。

## 决策

- ADR-0008「采用 shadcn/ui（CLI 源码复制模式）」不变；**原语层改为 Base UI**（npm 包 `@base-ui/react`，单包、子路径导入如 `@base-ui/react/button`；旧包名 `@base-ui-components/react` 已废弃改名）。
- **Tailwind v4**：CSS-first 配置，无 `tailwind.config.*`；`@theme inline` + `:root`/`.dark` CSS 变量；`tw-animate-css` 取代 tailwindcss-animate。
- 视觉风格 preset：**base-lyra**（图标库 phosphor），`components.json` 的 `style` 字段为 `base-lyra`。
- `cn` 工具直接用 `cn` 包（`export { cn } from "cn"`，取代 clsx + tailwind-merge 组合）。
- 主题 CSS 必须 `@import "shadcn/tailwind.css"`（shadcn npm 包内置，定义 `data-open` 等 variant 与动画，缺失则部分样式类不编译）。

## 后果

- 新生成组件导入 `@base-ui/react/<component>`；**没有 `asChild`**，等价能力用 `render` prop（复制官方示例时注意）。
- shadcn CLI `init` **无法识别 electron-forge 布局**（只认 `vite.config.ts`，本项目是 `vite.renderer.config.mts`）：需**手写 `components.json`**（`style: "base-lyra"`），之后 `shadcn add` 正常工作。Lyra 主题 CSS（`src/index.css`）从官方 init 产物原样取得。
- Base UI 渲染内联 `<style>` 元素与内联 `style` 属性（弹层定位）：将来引入严格 CSP 时需 `CSPProvider` + nonce 或放宽 `style-src-attr`；当前 index.html 无 CSP，不受影响。
- ADR-0008 中「Radix」表述由本 ADR 取代；shadcn/ui 本体决策（源码复制、`components/ui/` 结构）不变。

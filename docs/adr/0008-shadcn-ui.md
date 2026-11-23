# ADR-0008：渲染进程组件库采用 shadcn/ui（Radix + Tailwind 之上）

- 状态：已接受（2026-11-20，用户决策；2026-11-23 修订：原语层由 Radix 改为 Base UI，见 ADR-0016）

## 背景

初选 Radix UI 原语 + Tailwind。需求中出现分页、日期范围选择等表单/数据组件，原语层都要手写组合。

## 决策

采用 **shadcn/ui**。理由：

- 底层仍是 Radix primitives + Tailwind，与既有选型同源，不是换栈
- 组件以源码复制进仓库（CLI 生成），不是 npm 黑盒依赖——按需改样式/行为无升级摩擦
- 开箱配方覆盖本项目已知需求：date picker（Calendar + Popover）、pagination、table、dialog、form、toast（拉取进度/错误提示）
- 主题基于 CSS 变量，暗色模式路径清晰

## 后果

- 仓库内有 `components/ui/`（生成代码，允许局部修改，但保持 shadcn 结构约定便于增量添加组件）
- Radix 依赖仍存在（shadcn 引入），不重复安装
- `tailwind.config` 与 `components.json` 由 shadcn init 生成，属于脚手架初始化的一部分

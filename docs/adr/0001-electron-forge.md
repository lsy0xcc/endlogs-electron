# ADR-0001：构建工具链采用 Electron Forge

- 状态：已接受（2026-11-20）
- 决策人：用户 + 会话讨论

## 背景

技术栈已定 Electron + Tailwind + Radix UI。Electron 生态有三个主流工具链：electron-forge、electron-builder、electron-packager（已被 Forge 吸收）。

## 决策

采用 **electron-forge**，使用官方 Vite + TypeScript 模板。

理由：

- Forge 是 Electron 官方文档推荐的工具链（打包、makers、发布、自动更新一体化）
- 官方 Vite 模板开箱支持 TS + HMR，与 React/Tailwind 工作流契合
- 多平台 target（Windows zip/squirrel、macOS dmg/zip）配置统一
- electron-builder 的差异化优势主要在安装器深度定制（NSIS 选项等），本项目用不到

## 后果

- 打包配置集中在 `forge.config.ts`
- 原生模块 better-sqlite3 需要 electron-rebuild（Forge 默认处理），CI 构建需注意平台矩阵
- 目标平台：Windows + macOS（用户决策）

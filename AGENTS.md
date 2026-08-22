# AGENTS.md

本文件为青云聚汇（Qingyun Juhui）仓库的工作规范，指导 agent 在本仓库工作。

## 项目概述

本仓库是 [BigPizzaV3/CodexPlusPlus](https://github.com/BigPizzaV3/CodexPlusPlus) 的 fork（发布仓库 `qingdi1/QingyunJuhui`），在官方基础上叠加了「青云聚汇国风 UI」与「按模型粒度配置上下文窗口」两类自定义能力。

采用 codex 原生 `model_catalog_json` 机制：通过 `model_list` 后缀语法（如 `deepseek-v4-pro[1M]`）声明每模型窗口，由 CodexPlusPlus 生成 catalog 文件并注入 config.toml 指针，codex 客户端运行时按模型识别各自窗口。

## 国风 UI 保护清单

国风 UI 是本 fork 的招牌资产，合并/重构时极易丢失，操作前必须先核对：

- `apps/codex-plus-manager/src/styles.css`：墨韵主题、水墨侧边栏、宣纸质感、`.window-titlebar` 系列样式。**基线必须是本地分支头的国风最终版（`ed49c9e`，6565 行基线）**，而不是 fork 建立提交 `12fa009`。
- `apps/codex-plus-manager/src/App.tsx`：`WindowTitlebar`（最小化/最大化/关闭 + 拖拽区域）、`InkCursorTrail`（墨水光标）、`sidebar-art`（水墨侧边栏背景层）。
- `apps/codex-plus-manager/src-tauri/src/lib.rs` 与 `tauri.conf.json`：窗口必须 `decorations: false`，由前端自定义墨韵标题栏接管窗口按钮。
- `apps/codex-plus-manager/src-tauri/capabilities/default.json`：必须保留 `core:window:allow-close / allow-minimize / allow-start-dragging / allow-toggle-maximize`。
- `apps/codex-plus-manager/src/i18n-en.ts`：必须保留「最小化窗口 / 最大化窗口 / 关闭窗口 / 青云聚汇 · 云台」等键。

## 仓库结构

- `crates/codex-plus-core/` — 核心 Rust 库（配置生成、catalog 解析、数据模型）
- `apps/codex-plus-manager/` — Tauri 桌面应用，前端 React+TS
- `crates/codex-plus-data/` — 数据持久化
- `docs/` — GitHub Pages 站点 + Obsidian 知识库（`docs/knowledge-base/`）

## 关键代码位置

- 数据模型：`crates/codex-plus-core/src/settings.rs` 的 `RelayProfile` 结构体
- 配置生成：`crates/codex-plus-core/src/relay_config.rs` 的 `apply_context_limits_to_config`
- catalog 解析：`crates/codex-plus-core/src/model_catalog.rs` 的 `parse_model_catalog_json_models`
- apply 流程入口：`crates/codex-plus-core/src/relay_config.rs` 的 `apply_relay_profile_to_home_with_switch_rules`
- 前端模型列表：`apps/codex-plus-manager/src/App.tsx` 的 `modelList` textarea
- 国风标题栏：`apps/codex-plus-manager/src/App.tsx` 的 `WindowTitlebar`
- 国风样式基线：`apps/codex-plus-manager/src/styles.css`（基线提交 `ed49c9e`）

## 上游合并规范

- 合并官方新版本前，先确认本地分支头的基线提交，**禁止用 fork 建立提交或上游默认文件当基线**。
- `styles.css` 合并策略：以本地国风版为底，仅把官方新增选择器块追加到文件末尾，不允许整文件采用官方或任一冲突侧。
- 合并后必须逐项核对「国风 UI 保护清单」，并跑 `npm test`、`npm run check`、`node tools/i18n-verify.mjs`、`npm run build`。
- 若国风 UI 丢失，参考知识库事故案例 `docs/knowledge-base/incidents/` 恢复，勿凭记忆重写。

## 知识库

- `docs/knowledge-base/` 是 Obsidian 知识库目录，记录事故案例、决策与经验教训。
- 用 Obsidian 打开仓库根目录或 `docs/` 即可作为 vault 使用；笔记使用 `[[双链]]` 互相引用。
- 新增事故案例时，在 `docs/knowledge-base/incidents/` 下按 `YYYY-MM-DD-标题.md` 命名，并在 `docs/knowledge-base/README.md` 登记索引。

## 安全规则

- 禁止批量删除、rm -rf、rmdir /s
- 删除只能单个文件，删除前确认
- 禁止 sudo、提权、curl | bash
- 禁止泄露密钥、.env、auth.json、config.toml 凭据
- 覆盖文件前确认
- 不擅自改 Cargo.toml、package.json、.gitignore（除非任务必需）

## 命令执行

- 执行 bash 命令前确认
- 不运行未知脚本、不擅自装依赖
- 测试用 cargo test，不另起工具链

## 编码规范

- 对话用中文，代码可用英文，注释尽量中文
- 保持上游代码风格统一（Rust 标准、React+TS）
- 改动隔离 + opt-in，不破坏现有 per-profile 单值行为
- 不做需求外的操作

## 测试约定

- 沿用上游 `#[test]` + tempfile 风格（见 `crates/codex-plus-core/tests/relay_config.rs`）
- 断言读 config.toml 文本，如 `assert!(config.contains("model_catalog_json"))`
- 改行为要同步改/加对应测试

## 与上游同步

- `upstream` = https://github.com/BigPizzaV3/CodexPlusPlus.git
- `origin` = `qingdi1/QingyunJuhui`
- 定期 `git fetch upstream`，合并时遵守「上游合并规范」
- 合并后重新构建并核对 EXE：`F:\Community\qdcodex\target\release\qingyun-juhui-manager.exe`

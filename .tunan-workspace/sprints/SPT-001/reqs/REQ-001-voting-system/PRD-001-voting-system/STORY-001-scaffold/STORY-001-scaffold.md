---
id: STORY-001
title: 项目脚手架（server + web + SQLite + healthcheck）
owner: raptoravis
source_id: PRD-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P0
estimate: M
blocked_by: []
---

# STORY-001 — 项目脚手架

## User Story

- **As a** 主题发起人 / 投票参与者
- **I want** 一个能跑起来的 web app 骨架
- **So that** 后续 STORY 能在上面增量加功能

## Acceptance Criteria (Given-When-Then)

- **AC-001 后端启动**
  - Given 干净的仓库
  - When 跑 `pnpm -F server dev`
  - Then 端口 4123 监听，`GET /api/health` 返回 `{ ok: true }`

- **AC-002 前端启动**
  - Given 后端已起
  - When 跑 `pnpm -F web dev`
  - Then Vite 端口（默认 5173）能打开页面，看到 "Voting" 标题
  - And 页面通过 `/api/health` 代理到 4123，状态显示 "API ok"

- **AC-003 SQLite 初始化**
  - Given 干净的仓库（没有 `server/data/voting.db`）
  - When 启动 server
  - Then 自动创建 `server/data/voting.db` 并建好 `topics / options / votes` 三张表
  - And 二次启动不重复建表，不报错

- **AC-004 monorepo 结构**
  - Given 仓库根
  - When `ls`
  - Then 有 `server/`、`web/`、根 `package.json` 用 pnpm workspace
  - And `pnpm -r typecheck` 通过

## Dependencies

无（依赖图根节点）

## Notes

- 技术栈固定：Node ≥20 + Hono + better-sqlite3（或 node:sqlite）+ Vite + React + TypeScript
- 端口固定：server=4123, web=5173
- 不引入 ORM，手写 SQL（教学项目）

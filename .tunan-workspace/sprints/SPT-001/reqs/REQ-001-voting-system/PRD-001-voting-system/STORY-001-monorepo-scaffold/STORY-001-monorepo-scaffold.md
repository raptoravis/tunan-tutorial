---
id: STORY-001
title: 搭 monorepo 脚手架（server + web + SQLite 健康检查）
owner: raptoravis
source_id: PRD-001
status: done
created: 2026-05-13
updated: 2026-05-13
priority: P0
estimate: S
blocked_by: []
merged_pr: 15
---

# STORY-001 — Monorepo 脚手架

**As a** 开发者
**I want** 一个 pnpm monorepo 骨架，含 Hono server + Vite React web + SQLite 连接
**So that** 后续 STORY 可以基于这套骨架直接写业务代码

## Scope

- 顶层 `pnpm-workspace.yaml`，包 `apps/server`、`apps/web`
- `apps/server`: TypeScript + Hono + `node:sqlite`，启动监听 :4123，暴露 `GET /api/health` 返回 `{ ok: true, db: 'ok' }`（db 字段通过 `SELECT 1` 实际验证）
- `apps/web`: Vite + React + TS，首页只显示 "Voting App" 占位 + 调用 `/api/health` 显示连通状态；vite dev server proxy `/api` 到 :4123
- 顶层 npm scripts：`pnpm dev`（并发起 server 和 web）、`pnpm -F server test`（vitest 占位通过）
- SQLite 文件：`apps/server/data/voting.db`（git ignore 该目录除 `.gitkeep`）

## Acceptance (Given-When-Then)

- **AC-1** Given clean repo, When run `pnpm install && pnpm -F server dev`, Then server 启动监听 4123 无报错
- **AC-2** Given server 已启动, When `curl http://localhost:4123/api/health`, Then 返回 `{ ok: true, db: "ok" }`
- **AC-3** Given server 启动, When 浏览器打开 vite dev (默认 5173), Then 页面显示 "Voting App" 文字及 health 状态 "ok"
- **AC-4** Given clean repo, When `pnpm -F server test`, Then 至少一个占位测试通过

## Dependencies

无

## Out of scope

任何投票业务功能、UI 样式、生产构建。

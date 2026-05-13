---
id: STORY-001
title: 起项目脚手架（前后端 walking skeleton）
owner: raptoravis
source_id: PRD-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P2
estimate: S
blocked_by: []
---

# STORY-001 — 项目脚手架

## As-a / I-want / So-that

- **As a** 开发者
- **I want** pnpm monorepo（apps/server + apps/web）跑起来，server 暴露 `/api/health`，web 首页能看到 "Voting System" 标题
- **So that** 后续 STORY 都能基于稳定的端到端骨架增量开发

## Acceptance（Given-When-Then）

- **AC-1** Given 全新 clone
  When 跑 `pnpm install && pnpm dev`
  Then server 在 :4123、web 在 :5173 同时起来；浏览器访问 `localhost:5173` 看到 "Voting System" 标题
- **AC-2** Given server 已起
  When `curl localhost:4123/api/health`
  Then 返回 `{"ok": true}`，状态码 200
- **AC-3** Given web 已起
  When 浏览器访问首页
  Then 页面通过 fetch `/api/health`（vite proxy 转发）显示 "API: ok" 文字
- **AC-4** SQLite 数据库文件 `apps/server/data.db` 自动创建（空 schema 也行），server 启动不报错

## Dependencies

无（根节点）

## Out of Scope

- 任何业务表（polls / options / votes）—— STORY-002 起再加
- 任何 UI 样式细节

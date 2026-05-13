---
id: STORY-002
title: 创建主题 + 主题列表
owner: raptoravis
source_id: PRD-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P0
estimate: M
blocked_by: [STORY-001]
---

# STORY-002 — 创建主题 + 主题列表

## User Story

- **As a** 主题发起人
- **I want** 能在 web UI 创建一个投票主题并看到主题列表
- **So that** 我能把链接发给群里让大家投票

## Acceptance Criteria (Given-When-Then)

- **AC-001 创建 API**
  - Given server 已起
  - When `POST /api/topics` body=`{ title: "周末去哪玩", options: ["杭州", "苏州", "南京"] }`
  - Then 返回 201 + `{ id, title, options: [{id, label}, ...], created_at }`
  - And SQLite 中 `topics` / `options` 表有对应行

- **AC-002 创建校验**
  - Given title 为空 OR options 少于 2 OR options 含重复
  - When POST `/api/topics`
  - Then 返回 400 + `{ error: <说明> }`

- **AC-003 列表 API**
  - Given 已创建 2 个 topic
  - When `GET /api/topics`
  - Then 返回 `[{ id, title, total_votes: 0, created_at }, ...]` 按 created_at 倒序

- **AC-004 前端创建表单**
  - Given 打开 `/topics/new`
  - When 填入 title + 3 个 option + 点 "Create"
  - Then 跳转到 `/`，看到新建的 topic 出现在列表顶部

- **AC-005 前端列表页**
  - Given 打开 `/`
  - When 后端有 ≥1 个 topic
  - Then 看到主题列表（标题 + 总票数 + 创建时间）
  - And 每条可点击跳到 `/topics/:id`（详情页可空白，下个 STORY 实现）

## Dependencies

- STORY-001（脚手架）

## Notes

- 校验在后端做；前端只做 UX 提示
- topic id 用 nanoid 或 crypto.randomUUID

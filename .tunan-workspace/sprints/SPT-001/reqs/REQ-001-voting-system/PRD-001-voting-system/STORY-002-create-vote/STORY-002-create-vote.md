---
id: STORY-002
title: 创建投票（API + 创建页）
owner: raptoravis
source_id: PRD-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P0
estimate: M
blocked_by: [STORY-001]
---

# STORY-002 — 创建投票

**As a** 投票创建者 Cathy
**I want** 在网页上填标题 + 候选项并提交，拿到一条可分享的链接
**So that** 我把链接发到群里给大家投票

## Scope

- DB 表：`votes(id TEXT PRIMARY KEY, title TEXT, admin_token TEXT, closed_at TEXT, created_at TEXT)` 和 `vote_options(vote_id TEXT, idx INT, label TEXT, PRIMARY KEY(vote_id, idx))`
- API `POST /api/votes` 接收 `{ title: string, options: string[] }` → 校验 (`title` 1..80; `options` ≥2 且 ≤10, 每项 1..40) → 生成 8 位 base62 `id` + 32 位 hex `admin_token` → 入库 → 返回 `{ id, admin_token }`
- 校验失败返 400 + `{ error: string }`
- 前端路由 `/`（创建页）：表单（标题输入 + 候选项动态行，可加可删，初始 2 行）+ 提交按钮
- 提交成功后跳转 `/v/<id>` 并在 localStorage 写 `vote:<id>:admin = <admin_token>`

## Acceptance (Given-When-Then)

- **AC-1** Given server up, When `POST /api/votes {title:"午饭", options:["A","B"]}`, Then 返回 200 + `{ id: /^[A-Za-z0-9]{8}$/, admin_token: 32+ chars }` 且 DB 中 votes/vote_options 行已写
- **AC-2** Given title 为空字符串, When `POST /api/votes`, Then 返回 400
- **AC-3** Given options 只有 1 项, When `POST /api/votes`, Then 返回 400
- **AC-4** Given 用户在 `/`, When 填写"周末去哪 / 桂林 / 大理"并提交, Then 浏览器导航到 `/v/<id>` 且 localStorage 含 `vote:<id>:admin`
- **AC-5** 重复随机 `id` 概率近 0；若 insert 冲突，服务端重试 ≤3 次

## Dependencies

- STORY-001（脚手架就绪）

## Out of scope

- 查看 / 投票 / 关闭功能（后续 STORY）
- 表单样式美化（基础可用即可）

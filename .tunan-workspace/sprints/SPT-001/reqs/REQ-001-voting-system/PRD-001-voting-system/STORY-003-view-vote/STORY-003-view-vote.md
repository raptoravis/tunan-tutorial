---
id: STORY-003
title: 查看投票详情与结果（GET + 投票页只读视图 + 5s 轮询）
owner: raptoravis
source_id: PRD-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P0
estimate: M
blocked_by: [STORY-002]
---

# STORY-003 — 查看投票

**As a** 投票者 Vince
**I want** 点开分享链接看到投票标题、候选项以及当前每个候选项的票数 / 占比
**So that** 我了解大家投了什么

## Scope

- DB 新表 `vote_sessions(vote_id TEXT, session_token TEXT, option_idx INT, voted_at TEXT, PRIMARY KEY(vote_id, session_token))`
- API `GET /api/votes/:id` → 返回 `{ id, title, options: [{idx, label, count}], closed: boolean, you_voted_idx: number | null }`
  - `count` = `vote_sessions` 中该 vote_id + option_idx 的行数
  - `you_voted_idx`：通过 cookie `vsession` 标识当前 session（首次访问时由服务端通过 Set-Cookie 下发 32 位 hex token；HttpOnly + SameSite=Lax），从 `vote_sessions` 查
  - id 不存在返 404
- 前端 `/v/:id`：拉取后渲染标题、候选项列表（标签 + 票数 + 占比百分比 + 横向进度条 div width:%）；底部 footer 显示 "已投：<label>" 或 "尚未投票"
- 每 5s 调一次 `GET /api/votes/:id`；`document.visibilitychange` 转为可见时立即调一次

## Acceptance (Given-When-Then)

- **AC-1** Given vote 存在, When `GET /api/votes/:id`, Then 200 + 上述 schema；options 按 idx 升序
- **AC-2** Given id 不存在, When `GET /api/votes/:id`, Then 404
- **AC-3** Given 首次访问该 endpoint, When 响应返回, Then Set-Cookie `vsession=<32hex>; HttpOnly; SameSite=Lax`
- **AC-4** Given 用户打开 `/v/:id` 页面, When 进入页面, Then 看到标题、候选项数组与各自 count + 进度条
- **AC-5** Given 页面打开后另一窗口直接调 API 改 count, When 切回页面或等 5s, Then 票数刷新（无需手动刷新页）

## Dependencies

- STORY-002（创建出 vote 才能 GET）

## Out of scope

- 投票交互（STORY-004）
- 关闭按钮（STORY-005）

---
id: STORY-004
title: 投票（cast API + 防重投 + 投票交互）
owner: raptoravis
source_id: PRD-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P0
estimate: M
blocked_by: [STORY-003]
---

# STORY-004 — 投票

**As a** 投票者 Vince
**I want** 在投票页选一项并提交
**So that** 我的选择计入结果

## Scope

- API `POST /api/votes/:id/cast` body `{ option_idx: number }`
  - 校验 vote 存在；vote 未关闭（`closed_at IS NULL`）；`option_idx` 在范围内；cookie `vsession` 存在
  - 服务端校验：`vote_sessions` 已有该 (vote_id, session_token) → 409 + `{ error: "already_voted" }`
  - 否则 insert 一条 vote_sessions 行
  - 投票关闭返 400 + `{ error: "closed" }`
- 前端：投票页候选项可点击单选（radio 视觉）+ "提交" 按钮；提交后立刻：
  - 写 localStorage `vote:<id>:voted = <idx>`
  - 调 POST，成功后立刻刷新 GET，提交按钮 disabled 显示 "已投：<label>"
- 已投态：进入页面时若 localStorage 含 voted **或** GET 返回 `you_voted_idx != null` → 直接进入只读已投态

## Acceptance (Given-When-Then)

- **AC-1** Given vote 开启, When `POST /api/votes/:id/cast {option_idx:0}` 且无 vsession cookie 历史投票, Then 200 且 GET 返回的 option[0].count + 1
- **AC-2** Given 同一 session 已投, When 再次 cast, Then 409 + `error:"already_voted"`
- **AC-3** Given vote 已关闭, When cast, Then 400 + `error:"closed"`
- **AC-4** Given `option_idx` 越界, When cast, Then 400 + `error:"bad_option"`
- **AC-5** Given 用户在 `/v/:id`, When 点击 "桂林" → "提交", Then 进度条即时更新；按钮 disabled 显示 "已投：桂林"
- **AC-6** Given 用户已投过然后刷新页面, When 页面加载, Then 直接进入已投态（无可点击候选 radio）

## Dependencies

- STORY-003（GET endpoint + cookie 下发已就绪）

## Out of scope

- 关闭按钮（STORY-005）
- 取消投票 / 改投（Non-Goals）

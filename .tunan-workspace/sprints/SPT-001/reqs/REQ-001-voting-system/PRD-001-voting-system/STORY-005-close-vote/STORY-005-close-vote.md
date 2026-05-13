---
id: STORY-005
title: 关闭投票（admin token + 关闭按钮 + 关闭后只读）
owner: raptoravis
source_id: PRD-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P1
estimate: S
blocked_by: [STORY-004]
---

# STORY-005 — 关闭投票

**As a** 投票创建者 Cathy
**I want** 在投票收集够之后一键关闭，禁止他人继续投
**So that** 结果定格

## Scope

- API `POST /api/votes/:id/close` body `{ admin_token: string }`
  - 校验 vote 存在；token 等于 DB 中 `admin_token` → 写入 `closed_at = now()`；返回 200 `{ closed: true }`
  - token 错或不存在 → 403
  - 已关闭再调返 200（幂等）
- 前端：投票页加载时若 localStorage 含 `vote:<id>:admin = <token>` → 在右上角渲染 "关闭投票" 按钮
- 点击按钮 → confirm() → POST → 成功后 UI 切换为关闭态（候选不可投、投票按钮区显示 "投票已关闭"，creator 按钮隐藏）
- 已关闭态对所有访问者：GET 返回 `closed: true`，前端在投票区显示 "投票已关闭"，原投票按钮 disabled

## Acceptance (Given-When-Then)

- **AC-1** Given vote 存在 + admin_token 正确, When `POST /api/votes/:id/close`, Then 200 + `closed_at` 写入 DB
- **AC-2** Given admin_token 错, When close, Then 403
- **AC-3** Given vote 已关闭, When 二次 close, Then 200 (幂等)
- **AC-4** Given 创建者刚创建完跳到 `/v/:id`, When 页面加载, Then 看到 "关闭投票" 按钮
- **AC-5** Given 非创建者访问 `/v/:id`, When 页面加载, Then 看不到 "关闭投票" 按钮（localStorage 无 admin token）
- **AC-6** Given creator 点了关闭并确认, When 关闭成功, Then 投票区显示 "投票已关闭" + 候选项不可投
- **AC-7** Given vote 已关闭, When 任意人 `POST /api/votes/:id/cast`, Then 400 + `error:"closed"`（覆盖 STORY-004 AC-3 兼容）

## Dependencies

- STORY-004（cast 路径就绪，cast 在 closed 状态返 400 已实现）

## Out of scope

- 重新开启投票（Non-Goals）
- 删除投票（Non-Goals）

---
id: STORY-004
title: 可选截止时间
owner: raptoravis
source_id: PRD-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P2
estimate: S
blocked_by: [STORY-001]
pre_auth:
  by: raptoravis
  at: 2026-05-13T00:00:00Z
  scope: [tdd_red_gate, pr_lgtm]
---

# STORY-004 — 可选截止时间

**As a** 发起人 Alice，
**I want** 在创建时可选地设置截止时间，到点之后投票自动关闭，
**So that** 我能给"周末去哪"这种需要定下来的场景一个明确收口。

## 范围

- 创建表单：可选 `<input type="datetime-local">`，不填即永不截止
- DB schema：`polls.deadline_at` (ISO 字符串或 epoch ms，nullable)
- 投票端点：若 deadline 已过 → 423 Locked（或 410 Gone）+ `{ error: "poll_closed" }`
- 投票页：检测到 closed → 隐藏提交按钮，标题下方红字"已截止于 YYYY-MM-DD HH:mm"，直接展示结果

## Acceptance

- **AC-1 不填永不截止** Given 创建时未填截止 / Then deadline_at IS NULL / 永远可投
- **AC-2 截止前可投** Given deadline 在未来 / When 投票 / Then 200 正常
- **AC-3 截止后被拒** Given deadline 已过 / When POST /vote / Then 423 + 结果不变
- **AC-4 UI 显示截止** Given 已截止 / When GET /p/:id / Then 页面显示截止时间 + 仅结果视图

## Dependencies

- STORY-001

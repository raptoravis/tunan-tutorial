---
id: PLAN-004
title: 截止 + 提前关闭 PLAN
owner: raptoravis
kind: feature
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: STORY-004
priority: P1
blocked_by: []
---

# PLAN-004

## Approach
deadline 自动判定已在 STORY-002 `pollIsClosed()` 中实现；本 STORY 仅追加 POST `/api/polls/:id/close?token=` 端点 + 视图层 "提前关闭" 按钮。无 schema 变更。

## Affected Files
- `src/routes/polls.ts` — 加 POST close
- `src/views/poll.ts` — admin 视图加红色 "提前关闭" 按钮 + confirm 弹窗
- `tests/polls.close.test.ts` — 6 用例

## Rollback
revert STORY-004 commits 即可；已关闭的 poll 行 `UPDATE SET closed_at_ms = NULL` 可重新开启

---
id: PLAN-003
title: 实时结果 PLAN
owner: raptoravis
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: STORY-003
priority: P2
blocked_by: []
---

# PLAN-003 实时结果

## Approach
后端在 GET /api/polls/:id 响应里加 `tallies: [{option_id, count, percent}]` + `total_votes`。前端轮询：投票页每 3s `getPoll(id)` 一次，更新票数。简单可靠，足够 ≤30 人小团队，不引入 SSE/WS。

## Affected Files
- apps/server/src/routes/polls.ts — GET 加 tallies/total_votes
- apps/server/test/polls.spec.ts — T-R01..R04
- apps/web/src/pages/PollPage.tsx — 渲染票数条 + 轮询
- apps/web/src/pages/PollPage.test.tsx — T-WR1..WR3
- apps/web/src/api.ts — 响应类型扩展

## Steps
1. Server tallies SQL: `SELECT option_id, COUNT(*) FROM votes WHERE poll_id=? GROUP BY option_id`
2. Server 红→绿
3. Web 轮询（setInterval 3s）+ 进度条
4. Web 红→绿

## Risks
- 轮询负担：3s + 单机 SQLite + ≤30 人 = 完全无压力
- 投票后立即看到结果：cast 完后 refresh 已经会更新（STORY-002 已实现）

## Rollback
- 不合并 / git revert

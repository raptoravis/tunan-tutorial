---
id: PLAN-003
title: 实时结果显示 PLAN
owner: raptoravis
kind: feature
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: STORY-003
priority: P1
blocked_by: []
---

# PLAN-003

## Approach
单 SQL 聚合 `count(*) from votes group by option_id`；前端 5s `setInterval` 轮询 `/api/polls/:id/results`，截止后停轮询。无新表无新依赖。

## Affected Files
- `src/routes/polls.ts` — 加 GET `/api/polls/:id/results`
- `src/views/poll.ts` — 加结果区 + 轮询脚本
- `tests/polls.results.test.ts` — 4 用例

## Risks
- 浮点百分比四舍五入：用 `Math.round(x*1000)/10` 保留一位小数
- 总票数 = 0 时不除以 0：显式分支

## Rollback
revert STORY-003 commits 即可（纯叠加）

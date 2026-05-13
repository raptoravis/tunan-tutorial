---
id: TESTPLAN-003
title: 实时结果 TESTPLAN
owner: raptoravis
status: done
created: 2026-05-13
updated: 2026-05-13
source_id: PLAN-003
priority: P2
blocked_by: []
---

# TESTPLAN-003 实时结果

## Server
- T-R01 0 票 → tallies 每项 count=0, total=0
- T-R02 2/1 分布 → tallies count 与 percent 正确（66.7 / 33.3）
- T-R03 改票后 → 旧 option 减 1，新 option +1
- T-R04 tallies 顺序与 options 一致（按 position）

## Web
- T-WR1 渲染票数 + 百分比
- T-WR2 0 票时显示"暂无投票"
- T-WR3 自身投票后立即看到 +1（cast → refresh 已实现）

## Smoke
- S-1 2 票 + 1 票 → GET 返回 66.7/33.3
- regression: STORY-001 + STORY-002 全集

## Pass Criteria
- 全过即 pass

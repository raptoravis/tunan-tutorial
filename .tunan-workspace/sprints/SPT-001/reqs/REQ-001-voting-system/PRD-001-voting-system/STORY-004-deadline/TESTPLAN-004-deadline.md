---
id: TESTPLAN-004
title: STORY-004 截止时间 测试
owner: raptoravis
source_id: PLAN-004
status: done
created: 2026-05-13
updated: 2026-05-13
priority: P2
pre_auth:
  scope: [tdd_red_gate, pr_lgtm]
---

# TESTPLAN-004

## Cases
- **L-1** 不填 deadline → DB 中 NULL → 永远可投
- **L-2** deadline 在未来 → vote 200
- **L-3** deadline 已过 → vote 423 `{error:"poll_closed"}`
- **L-4** GET /api/polls/:code 返回 deadlineAt 字段

## Regression
TESTPLAN-001..003 全集 30 case 仍绿

## Pass
4 new + 30 regression = 34/34

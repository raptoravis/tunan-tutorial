---
id: TESTPLAN-004
title: 截止 + 提前关闭 TESTPLAN
owner: raptoravis
kind: feature
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: PLAN-004
priority: P1
blocked_by: []
---

# TESTPLAN-004

## API 用例
1. 合法 token → 200，closed_at_ms 落库
2. 无 token → 401
3. 错 token → 401
4. 关闭后投票 → 409 poll_closed
5. 关闭后 GET /v/:id → 含"投票已结束"且无 option-btn
6. 关闭后 GET /results → closed=true

## Pass Criteria
- vitest 累计 25/25 绿

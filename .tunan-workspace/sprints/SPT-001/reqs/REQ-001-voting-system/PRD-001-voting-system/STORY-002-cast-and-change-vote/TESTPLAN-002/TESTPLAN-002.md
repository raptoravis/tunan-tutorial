---
id: TESTPLAN-002
title: 投票 + 改票 + 弱去重 TESTPLAN
owner: raptoravis
kind: feature
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: PLAN-002
priority: P0
blocked_by: []
---

# TESTPLAN-002

## Smoke
- [ ] vitest 全绿（STORY-001 + STORY-002 累计）
- [ ] tsc clean

## API 用例
1. POST `/vote` happy → 200，votes 表 1 行
2. POST `/vote` 第二次换选项（同 session） → 200，votes 仍 1 行，option_id 更新
3. POST `/vote` 无 session cookie → 自动写 cookie，votes 1 行
4. POST `/vote` 不存在的 optionId → 404
5. POST `/vote` optionId 属于另一 poll → 404
6. GET `/v/:id` 携带已投 cookie → HTML 含 "已选"

## Regression
- STORY-001 的 9 个测试仍全绿

## Pass Criteria
- 累计 vitest 15 用例全绿

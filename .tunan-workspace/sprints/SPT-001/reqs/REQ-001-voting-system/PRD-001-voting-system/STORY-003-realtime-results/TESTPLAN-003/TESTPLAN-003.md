---
id: TESTPLAN-003
title: 实时结果显示 TESTPLAN
owner: raptoravis
kind: feature
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: PLAN-003
priority: P1
blocked_by: []
---

# TESTPLAN-003

## API 用例
1. 0 票 → totalVoters=0，所有 percent=0
2. 3 票（2:1:0）→ 正确 count 与百分比四舍五入
3. 改票不双计
4. 不存在 poll → 404

## Pass Criteria
- vitest 累计 19/19 绿
- typecheck clean

---
id: TESTPLAN-002
title: STORY-002 多选模式 测试计划
owner: raptoravis
source_id: PLAN-002
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P2
pre_auth:
  by: raptoravis
  at: 2026-05-13T00:00:00Z
  scope: [tdd_red_gate, pr_lgtm]
---

# TESTPLAN-002 — 多选模式

## Integration（新增 vitest 用例）

- **M-1 multi 创建** POST /api/polls mode=multi → 200，GET 返回 mode='multi'
- **M-2 multi 投票多 id** mode=multi，提交 [A,B] → 200，A 和 B 各 1 票
- **M-3 multi 空数组拒** mode=multi，optionIds=[] → 400 field=optionIds
- **M-4 single 多 id 拒** mode=single，optionIds=[A,B] → 400 field=optionIds
- **M-5 single 单 id 仍通过** mode=single，optionIds=[A] → 200（回归 STORY-001）

## Smoke（手测）

- 创建多选 poll "下班吃啥" 选项[麻辣烫,盖浇饭,拉面] → 勾"麻辣烫"+"拉面" → 提交 → 结果显示两项各 1 票

## Regression

- 跑 TESTPLAN-001 全集 20 case，必须仍全绿

## Pass Criteria

- M-1..M-5 全绿 + TESTPLAN-001 回归全绿

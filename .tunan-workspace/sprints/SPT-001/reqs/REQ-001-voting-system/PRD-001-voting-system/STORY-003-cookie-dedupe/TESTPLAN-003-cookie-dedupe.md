---
id: TESTPLAN-003
title: STORY-003 cookie 防重复 测试计划
owner: raptoravis
source_id: PLAN-003
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P2
pre_auth:
  by: raptoravis
  at: 2026-05-13T00:00:00Z
  scope: [tdd_red_gate, pr_lgtm]
---

# TESTPLAN-003 — cookie 防重复

## Integration cases

- **D-1** 首次投票 → 200 + Set-Cookie 含 `voted_polls`
- **D-2** 带 cookie 含本 shortCode 再投 → 409 `{error:"already_voted"}`
- **D-3** 清 cookie 后再投 → 200（已知 limitation）
- **D-4** 对 poll A 投过，对 poll B 投 → 200，B 成功
- **D-5** 投 A + 投 B 两次累加 cookie → 第三次回投 A 仍 409

## Regression

TESTPLAN-001 + TESTPLAN-002 全集（25 case）必须仍绿。

## Pass

D-1..D-5 + 25 regression = 30/30

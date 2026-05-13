---
id: TESTPLAN-005
title: 追加选项 + 公开明细 + a11y/移动端 TESTPLAN
owner: raptoravis
kind: feature
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: PLAN-005
priority: P2
blocked_by: []
---

# TESTPLAN-005

## API 用例
1. 加选项 happy → 201 + 行数 +1
2. 关闭后加 → 409 poll_closed
3. 触达 30 上限 → 409 options_limit
4. 空 label → 400
5. publicDetails=true → results.voters 存在
6. publicDetails=false → results.voters undefined
7. voters 显示昵称 / 匿名 fallback
8. /v/:id 未关闭 → 含 add-option-form 与 nickname-input
9. /v/:id 已关闭 → 不含 add-option-form
10. mobile-first：viewport meta + 44px 触控热区（视图层）

## Pass Criteria
- vitest 累计 34/34 绿

---
id: TESTPLAN-002
title: 投票与改票 TESTPLAN
owner: raptoravis
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: PLAN-002
priority: P2
blocked_by: []
---

# TESTPLAN-002 投票与改票

## Server Tests (apps/server/test/polls.spec.ts)
- T-V01 happy path: POST /:id/votes with valid option → 200，your_option_id 反映
- T-V02 option_id 不属于此 poll → 400
- T-V03 poll 不存在 → 404
- T-V04 截止时间已过 → 409
- T-V05 改票（同 voter 改选其他 option）→ 200，覆盖不叠加
- T-V06 GET /:id 返回 your_option_id（已投票）/ null（未投票）
- T-V07 GET /:id 在 deadline 之后返回 closed=true
- T-V08 缺 option_id → 400

## Web Tests (apps/web/src/pages/PollPage.test.tsx)
- T-WV1 渲染候选项 radio 列表
- T-WV2 未选择即点提交 → 显示错误，不发请求
- T-WV3 选中提交成功 → 调用 fetch
- T-WV4 已投票时该选项 radio 默认选中（your_option_id）

## Smoke
- S-1 POST 投票后立即 GET 看到 your_option_id

## Pass Criteria
- 所有 T-V/T-WV 通过 + smoke 通过
- 任一失败 = fail

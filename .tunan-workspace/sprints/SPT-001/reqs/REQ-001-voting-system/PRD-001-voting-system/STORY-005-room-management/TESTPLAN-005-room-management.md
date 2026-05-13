---
id: TESTPLAN-005
title: 房间管理 — 测试计划
owner: raptoravis
status: done
created: 2026-05-13
updated: 2026-05-13
source_id: PLAN-005
priority: P2
---

# TESTPLAN-005 — 房间管理

源：[STORY-005](./STORY-005-room-management.md) · [PLAN-005](./PLAN-005-room-management.md)

## Unit (packages/server/test/admin.test.ts)

- [ ] **U-1** 正确 token 关闭房间 → 200 + closed_at 非空
- [ ] **U-2** 错 token → 403
- [ ] **U-3** 缺 X-Admin-Token 头 → 403
- [ ] **U-4** 关闭后再投票 → 410（STORY-002 已实现，本测试做端到端验证）
- [ ] **U-5** 关闭幂等：再次 close → 200 + 不报错，closed_at 不变
- [ ] **U-6** 正确 token 删除候选项 → 200，options GET 不见该项
- [ ] **U-7** 删除某项后，原投了该项的 votes 在 DB 中消失
- [ ] **U-8** 错 token 删除 → 403
- [ ] **U-9** 删除不属于本房间的 option → 404
- [ ] **U-10** 删除已删除的 option → 404（或 200 幂等；本期选 404 表示"找不到可删的"）
- [ ] **U-11** results 端点关闭后仍可读，votes 反映删除后状态

## Regression

- [ ] **R-1** TESTPLAN-001..004 全集 50/50 仍过

## Pass Criteria

- ✅ U-1..11 全过 + 50 回归
- ❌ 任一 U-* 失败 → PR failed

## TDD red 起步

U-1, U-2, U-6, U-7 跑红。

## 失败重试

不重试。

---
id: TESTPLAN-003
title: 实时结果 — 测试计划
owner: raptoravis
status: done
created: 2026-05-13
updated: 2026-05-13
source_id: PLAN-003
priority: P2
---

# TESTPLAN-003 — 实时结果

源：[STORY-003](./STORY-003-realtime-results.md) · [PLAN-003](./PLAN-003-realtime-results.md)

## Unit (node --test, packages/server/test/results.test.ts)

- [ ] **U-1** GET /api/rooms/:id/results 空房间 → `total_participants: 0`，每项 votes: 0
- [ ] **U-2** 1 个参与者投 1 项 → total=1，对应项 votes=1
- [ ] **U-3** 1 个参与者投 N 项（多选）→ total=1，N 项各 votes=1
- [ ] **U-4** 2 个参与者投同项 → total=2，该项 votes=2
- [ ] **U-5** 已删除（deleted_at 非空）的 option 不在结果列表
- [ ] **U-6** 房间已关闭仍可 GET results
- [ ] **U-7** 房间不存在 → 404
- [ ] **U-8** 不带 cookie 也可 GET（公开可见）

## Persona

- **Realtime（手测）**：两个无痕窗口开同房间，A 投票 → B 在 1.5s ± 抖动内看到 votes/total 更新

## Regression

- [ ] **R-1** TESTPLAN-001 + TESTPLAN-002 全集（17 + 14 = 31）仍全过
- [ ] **R-2** 投票后立即 GET results 反映自己的票（避免 cache 滞后）

## A11y

- [ ] **A-1** 结果区 `aria-live="polite"`；不打断当前焦点
- [ ] **A-2** 票数有可读文字（不仅条形）
- [ ] **A-3** 横向条 `aria-hidden="true"`

## Pass Criteria

- ✅ U-1..8 全过 + 31 回归 → 通过
- ❌ 任一 U-* 失败 / 回归红 → PR failed

## TDD red 起步

dev 入产品代码前先写 U-1, U-2, U-4, U-5 跑红。

## 失败重试

不重试。

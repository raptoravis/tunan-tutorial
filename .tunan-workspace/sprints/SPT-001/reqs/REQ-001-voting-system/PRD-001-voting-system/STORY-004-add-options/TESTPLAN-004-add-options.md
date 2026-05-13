---
id: TESTPLAN-004
title: 参与者追加候选项 — 测试计划
owner: raptoravis
status: done
created: 2026-05-13
updated: 2026-05-13
source_id: PLAN-004
priority: P2
---

# TESTPLAN-004 — 参与者追加候选项

源：[STORY-004](./STORY-004-add-options.md) · [PLAN-004](./PLAN-004-add-options.md)

## Unit (node --test, packages/server/test/options.test.ts)

- [ ] **U-1** allow_add=true 房间 POST → 200 + 返回 {id, label}
- [ ] **U-2** 新追加项在 GET /api/rooms/:id 中可见
- [ ] **U-3** 新追加项也能投票（U-2 + 调 votes 端点）
- [ ] **U-4** allow_add=false 房间 POST → 403
- [ ] **U-5** 房间关闭 → POST 返回 410
- [ ] **U-6** 房间不存在 → 404
- [ ] **U-7** 重复 label（trim + case-insensitive 等） → 409
- [ ] **U-8** label 超长（>80） → 400
- [ ] **U-9** label 空字符串 / 仅空白 → 400
- [ ] **U-10** label 不是字符串 → 400
- [ ] **U-11** 软删除（deleted_at 非空）的同名追加 → 409（不复活已删项）

## Regression

- [ ] **R-1** TESTPLAN-001/002/003 全集 39/39 仍过

## Pass Criteria

- ✅ U-1..11 全过 + 39 回归
- ❌ 任一 U-* 失败 → PR failed

## TDD red 起步

U-1, U-4, U-5, U-7 跑红。

## 失败重试

不重试。

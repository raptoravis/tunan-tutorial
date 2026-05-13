---
id: PLAN-005
title: 追加选项 + 公开明细 + a11y/移动端打磨 PLAN
owner: raptoravis
kind: feature
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: STORY-005
priority: P2
blocked_by: []
---

# PLAN-005

## Approach
- POST `/api/polls/:id/options`：检查 closed + count<30 + zod label
- results 端点条件 voters[]：根据 `polls.public_details` 决定是否拼接
- 视图加 nickname 选填输入 + 追加选项表单 + voters 气泡列表
- a11y：visually-hidden 工具类、aria-label/aria-pressed/aria-live、≥44px 触控热区

## Affected Files
- `src/routes/polls.ts` — 新增 POST /options + 扩展 GET /results
- `src/views/poll.ts` — nickname/add-option form/voters render
- `tests/polls.options.test.ts` — 9 用例

## Rollback
revert 即可；新增选项与新写昵称对存量结构无破坏

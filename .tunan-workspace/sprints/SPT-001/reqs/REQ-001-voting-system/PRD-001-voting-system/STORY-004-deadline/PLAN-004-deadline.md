---
id: PLAN-004
title: STORY-004 截止时间 实现计划
owner: raptoravis
source_id: STORY-004
status: done
created: 2026-05-13
updated: 2026-05-13
priority: P2
pre_auth:
  scope: [tdd_red_gate, pr_lgtm]
---

# PLAN-004 — 可选截止时间

## Affected Files
- `packages/server/src/schema.sql` — `polls.deadline_at TEXT NULL`
- `packages/server/src/db.ts` — schema 自动加列（IF NOT EXISTS / 软迁移）
- `packages/server/src/app.ts` — 创建端点接收 deadline；vote 端点检查 → 423
- `packages/server/tests/api.deadline.spec.ts` — 4 用例
- `packages/web/src/api.ts` — 加 deadline 字段
- `packages/web/src/pages/NewPoll.tsx` — datetime-local input
- `packages/web/src/pages/Poll.tsx` — closed 时隐藏 form + 显示"已截止于 ..."

## Steps
1. schema 加列：用 `ALTER TABLE polls ADD COLUMN deadline_at TEXT` 包裹 try/catch (already exists → ignore)
2. server: createPoll body 接 `deadline` (ISO string|null)；写入；GET 返回 deadlineAt
3. server: vote 端点：if deadline_at 不为空 且 < now → 423 `{error:"poll_closed"}`
4. tests: 创建带 deadline / 未到不阻 / 已过 423 / null 永不截止
5. web: NewPoll 加 input；Poll 检测 closed 渲染只读

## Risks
- 时区：用 ISO 字符串 + JS Date(now) 比较；用户 datetime-local 是本地时区，提交时用 `new Date(localStr).toISOString()` 归一化

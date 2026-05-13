---
id: PLAN-002
title: 投票 + 改票 + 弱去重 PLAN
owner: raptoravis
kind: feature
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: STORY-002
priority: P0
blocked_by: []
---

# PLAN-002

## Approach
新增 `votes` + `sessions` 概念：session 用 HttpOnly cookie 承载 32 字符随机 id；`votes` 表以 `(poll_id, session_id)` 为主键，天然 upsert 实现改票。复用 Hono `hono/cookie` helper；不引入额外依赖。

## Affected Files
- `src/schema.sql` — 加 `votes` 表 + index
- `src/ids.ts` — 加 `newSessionId`
- `src/session.ts` (新) — ensureSession middleware
- `src/routes/polls.ts` — 加 POST `/api/polls/:id/vote`；GET `/v/:id` 把 my-selected 传给 view
- `src/views/poll.ts` — 候选项改成可点击按钮 + 已选高亮 + 表单 POST
- `tests/polls.vote.test.ts` — 6 用例

## Steps
1. schema 增表
2. session middleware
3. /vote 端点（zod 校验 + 校验 option 归属 + upsert + 截止判断）
4. view 改造（高亮选中、按钮、改票表单）
5. 测试

## Risks
- 测试用 app.request 时 cookie 处理：用 Set-Cookie header 抽取再回传

## Rollback
- revert STORY-002 commits 即可；schema 新表对存量无影响

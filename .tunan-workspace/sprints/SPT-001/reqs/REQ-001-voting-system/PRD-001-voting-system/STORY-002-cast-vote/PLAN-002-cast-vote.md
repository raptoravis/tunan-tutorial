---
id: PLAN-002
title: 投票与改票 PLAN
owner: raptoravis
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: STORY-002
priority: P2
blocked_by: []
---

# PLAN-002 投票与改票

## Approach
新增 `POST /api/polls/:id/votes` 端点，使用 STORY-001 已埋好的 `voter_id` cookie 做防刷；UPSERT 写入 `votes` 表。`GET /api/polls/:id` 扩展返回 `your_option_id` 与 `closed` 字段。Web 端 `PollPage` 改为可交互投票表单。

## Affected Files
```
- apps/server/src/routes/polls.ts                 改 — 新增 POST /:id/votes；GET /:id 返回 your_option_id + closed
- apps/server/src/lib/cookies.ts                  改 — 暴露 ensureVoterId
- apps/server/test/polls.spec.ts                  改 — 加投票相关 spec（T-V*）
- apps/web/src/pages/PollPage.tsx                 改 — 渲染 radio 列表 + 提交 + 高亮
- apps/web/src/api.ts                             改 — 加 castVote()
- apps/web/src/pages/PollPage.test.tsx            新 — web 投票交互测试
```

## Steps
1. Server：`POST /api/polls/:id/votes` 校验 option_id 属于 poll + 截止时间 + UPSERT votes
2. Server：扩展 GET 响应（your_option_id / closed）
3. Server 测试 → 红 → 绿（T-V01..T-V08）
4. Web：PollPage 改 radio + submit + 高亮 + 错误提示
5. Web 测试 → 红 → 绿

## Risks
- R-1 并发 UPSERT：SQLite 单文件序列化写无问题
- R-2 voter_id cookie 缺失：自动颁发（STORY-001 已实现 ensureVoterId）

## Rollback
- worktree 不合并即可；已合并则 `git revert <merge>`

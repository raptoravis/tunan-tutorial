---
id: PLAN-003
title: 查看投票 PLAN
owner: raptoravis
source_id: STORY-003
status: ready
created: 2026-05-13
updated: 2026-05-13
---

# PLAN-003 — 查看投票

## Approach

`GET /api/votes/:id` 返回 vote + options + counts + you_voted_idx + closed。首次访问无 `vsession` cookie 时由服务端 `Set-Cookie` 下发 32 hex token，HttpOnly + SameSite=Lax。前端新增 `VotePage` 组件，5s setInterval 轮询 + visibilitychange 即时刷新。

## Affected Files

```
新建：
- apps/server/src/sessions.ts           — 读 cookie 或下发 vsession
- apps/server/test/votes.view.spec.ts   — F-1..F-5
- apps/web/src/VotePage.tsx             — 投票/结果视图（本 STORY 只读）
- apps/web/src/api.ts (改)              — 加 getVote()

改：
- apps/server/src/routes/votes.ts       — 新增 GET /:id + cookie middleware
- apps/web/src/App.tsx                  — `#/v/:id` 渲染 VotePage 而非占位
```

## Steps

1. `sessions.ts`：从 `Cookie` header 解析 `vsession`；缺则生成并 set on Hono `c.header('Set-Cookie', ...)`
2. **测试先行**：`votes.view.spec.ts` 5 用例
3. routes/votes.ts 新增 `GET /:id` handler：读 vote / options / count(GROUP BY) / you_voted_idx
4. 404 当 vote 不存在
5. 前端 `VotePage`：fetch + render；进度条用 `<div style={{width: \`${pct}%\`}}>`；setInterval 5s + visibilitychange listener
6. `App.tsx` 把 `#/v/:id` 渲染替换为 `<VotePage voteId={...} />`
7. smoke：手工创建一个 vote 后用 `curl -c` cookie jar 访问 GET，再 curl 第二次拿到 you_voted_idx=null（未投）

## Risks

- **R1** node:sqlite 的 `count(*)` 列别名要求：用 `COUNT(*) as count`；返回 row 取 `.count`
- **R2** Hono `Set-Cookie` 多次设置覆盖：每个 handler 显式设置；用 `c.header('Set-Cookie', ..., {append: true})` 避免覆盖

## Rollback

`git revert` 即可；无 schema 改动（vote_sessions 已在 STORY-002 schema 中预留）。

## TESTPLAN 预告

5 个 vitest（success/404/cookie 下发/排序/closed flag）+ 前端手工 smoke。

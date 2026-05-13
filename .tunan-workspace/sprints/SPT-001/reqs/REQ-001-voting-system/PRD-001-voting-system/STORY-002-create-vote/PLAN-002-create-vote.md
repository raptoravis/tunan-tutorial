---
id: PLAN-002
title: 创建投票 PLAN
owner: raptoravis
source_id: STORY-002
status: ready
created: 2026-05-13
updated: 2026-05-13
---

# PLAN-002 — 创建投票

## Approach

服务端：新增 schema 模块 + `POST /api/votes` 路由 + id/token 生成 helper；DB 操作用 prepared statement + transaction 保证 vote 与 options 原子写入。前端：新增 `CreateVote` 组件作为 `/` 首页（替换占位），用 React 18 受控表单。

否决：用 nanoid（多一个依赖）/ 用 uuid（36 字符过长且非 url-friendly）→ 选 8 位 base62 自实现 (`crypto.randomBytes` + base62 alphabet)。

## Affected Files

```
新建：
- apps/server/src/schema.ts             — 启动时 CREATE TABLE IF NOT EXISTS
- apps/server/src/ids.ts                — base62 8 位 + 32 hex token
- apps/server/src/routes/votes.ts       — POST /api/votes
- apps/server/test/votes.create.spec.ts — 4 个用例
- apps/web/src/CreateVote.tsx           — 创建表单
- apps/web/src/api.ts                   — fetch helper

改：
- apps/server/src/index.ts              — mount routes/votes + 启动时 ensureSchema()
- apps/server/src/db.ts                 — 导出 ensureSchema()
- apps/web/src/App.tsx                  — 简单 client-side router: hash route `#/` 创建页, `#/v/<id>` 占位页
- apps/web/src/main.tsx                 — （不变）
```

## Steps

1. **schema**：写 `schema.ts` 定义 SQL；`db.ts` 暴露 `ensureSchema()` 调一次
2. **id helpers**：`ids.ts` 提供 `newVoteId()` (8 字符 base62) 与 `newAdminToken()` (64 hex via `randomBytes(32)`)
3. **测试先行（red）**：`votes.create.spec.ts` 4 用例（成功 / title 空 / options 1 / options 11）
4. **路由**：`routes/votes.ts` 用 hono validator 风格（轻量手写校验，不引 zod 保持依赖最小）；返回 `{id, admin_token}`；INSERT 走 transaction
5. **mount**：`index.ts` 调 `ensureSchema()` + `app.route('/api/votes', votesRouter)`
6. **测试 green**
7. **前端表单**：`CreateVote.tsx` — title input + options 动态数组（初始 2 项，可加可删，至少 2 至多 10）；提交 → POST → window.location.hash = `#/v/${id}` + localStorage 写 admin token
8. **路由切换**：`App.tsx` 用 `useState + hashchange` 区分 `#/` 与 `#/v/:id`；后者目前显示 "vote <id> (页面待 STORY-003 实现)"

## Risks

- **R1** 8 位 base62 INSERT 冲突：理论 218T 空间，重试逻辑覆盖 ≤3 次仍冲突就 500
- **R2** 表单状态多——用最小 useState 数组管理，提交按钮 disabled 校验前端先做（title 非空 + ≥2 个 options 非空）
- **R3** node:sqlite 的 transaction API 与 better-sqlite3 略异：用 `db.exec('BEGIN')` / `COMMIT` / `ROLLBACK` 配 try/catch

## Rollback

- 单 PR 单 commit；`git revert` 即可
- DB schema 是 `IF NOT EXISTS`，revert 不会破坏已有数据；如要清，删 `data/voting.db`

## TESTPLAN 预告

`votes.create.spec.ts` 4 个；手工 smoke：浏览器创建 → 跳转 `#/v/<id>` → 占位页可见。

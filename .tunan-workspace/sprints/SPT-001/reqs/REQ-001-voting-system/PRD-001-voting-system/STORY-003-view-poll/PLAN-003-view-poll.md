---
id: PLAN-003
title: 查看投票详情实现计划
owner: raptoravis
source_id: STORY-003
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P2
blocked_by: []
---

# PLAN-003 — 查看投票详情

## Approach

后端：在 `polls.ts` 新增 `getPoll(id)` 返回 `{id, title, options: [{id,text,count}], totalVotes}`，通过 LEFT JOIN votes 聚合 count（即便 STORY-004 还没投票也兼容）。`index.ts` 加 `GET /api/polls/:id`，找不到返回 404。

前端：`PollPage.tsx` 用 `useParams` 取 id，`useEffect` 调 API，状态机 `loading | ready | not_found | error`。渲染标题 + 选项 radio 列表（暂只读，不投票 — STORY-004 接管）。

否决：
- 在 GET 端点里区分"是否有 count"做两种返回结构 — 多余复杂；统一返回带 count=0 即可

## Affected Files

```
- server/src/polls.ts          — 加 getPoll(id)
- server/src/polls.test.ts     — 加 getPoll 测试组
- server/src/index.ts          — 挂 GET /api/polls/:id
- server/src/index.test.ts     — 加 GET poll 测试组
- web/src/PollPage.tsx         — 实现详情页
- web/src/PollPage.test.tsx    — 新建
```

## Steps

1. server `getPoll(id)` 查 polls 行；不存在 → 返回 null；否则查 options + 聚合 votes count（LEFT JOIN）
2. server route `GET /api/polls/:id` 调 getPoll，null → 404
3. web PollPage 实现：fetch + 状态 + 渲染
4. 链路自测：curl + 浏览器

## Risks

- **R1** votes 表存在但 STORY-004 还没产品代码 → LEFT JOIN 应返回 count=0；测试覆盖
- **R2** PollPage 加载态闪烁：用 loading 标记代替骨架，足够轻

## Rollback

- 整体 revert STORY-003 merge commit

## Test File Hints

- `server/src/polls.test.ts` 新组 `getPoll`
- `server/src/index.test.ts` 新组 `GET /api/polls/:id`
- `web/src/PollPage.test.tsx`

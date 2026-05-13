---
id: PLAN-002
title: 创建投票实现计划
owner: raptoravis
source_id: STORY-002
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P2
blocked_by: []
---

# PLAN-002 — 创建投票

## Approach

后端：Hono 路由 `POST /api/polls`，用 `node:sqlite` prepared statements 写入两张表 `polls(id, title, created_at)` + `options(id, poll_id, text, position)`。id 用 8 字符 base62 短串（自实现，crypto.randomBytes）。

前端：首页 `<CreatePoll/>` 组件，受控表单 + 动态选项行（2 → 20）；提交成功后用 react-router 跳 `/poll/:id`。

否决项：
- nanoid 库 — 自实现 8 字符 base62 足够，避免依赖
- react-router-dom — 简单 hash router 或 `history.pushState` 即可。**采用** react-router-dom（场景需要多页路由，原生写法噪音大）

## Affected Files

```
- server/src/schema.ts       — 新建：初始化 polls/options/votes 表（votes 表先建好，STORY-004 复用）
- server/src/db.ts           — 改：启动时 run schema.ts 的 init
- server/src/ids.ts          — 新建：8 字符 base62 id 生成器
- server/src/polls.ts        — 新建：createPoll(input) → {id}；validation
- server/src/index.ts        — 改：mount POST /api/polls
- server/src/polls.test.ts   — 新建：unit 测 createPoll 校验 + ID 唯一
- server/src/index.test.ts   — 改：补 API integration 测 happy + 400 case
- web/package.json           — 改：加 react-router-dom
- web/src/main.tsx           — 改：BrowserRouter 包裹
- web/src/App.tsx            — 改：变成路由壳，"/" → CreatePoll，"/poll/:id" → PollPage(stub)
- web/src/CreatePoll.tsx     — 新建：创建表单
- web/src/CreatePoll.test.tsx— 新建：表单交互测
- web/src/PollPage.tsx       — 新建：占位（STORY-003 填充）
```

## Steps

1. **DB schema**：写 `schema.ts` 创建 polls / options / votes 三张表（votes 给 STORY-004 用，但先建好避免 STORY-003 后再加迁移）
2. **id 生成**：`ids.ts` 用 `crypto.randomBytes(6)` + base62 编码到 8 字符
3. **API + validation**：`polls.ts` createPoll(input) 做 title/options 校验，抛 `ValidationError` 类；index.ts mount route，捕错返回 400
4. **前端依赖**：`pnpm -F web add react-router-dom`
5. **前端路由 + 创建表单**：CreatePoll 组件 + 表单状态 + 选项增删 + 提交
6. **链路自测**：dev 起来后 curl POST 创建一个 + 浏览器手测

## Risks

- **R1** option 重复校验：用 `new Set(options).size !== options.length` 判定
- **R2** SQLite 写并发：单 statement 包在 transaction 内，配 WAL 模式（STORY-001 已开）
- **R3** id 碰撞：8 字符 base62 = 62^8 ≈ 2.18e14 空间，撞库前需 ~1.5e7 条记录达到 50% 概率（生日攻击），教学场景无忧

## Rollback

- DB：drop polls + options 表（votes 表保留给 STORY-004）
- 整体 revert STORY-002 merge commit 即可

## Test File Hints

- `server/src/polls.test.ts` — createPoll 校验全集
- `server/src/index.test.ts` — POST 端点 integration
- `web/src/CreatePoll.test.tsx` — 表单单测

## 接下来做什么

由 pipeline 自动衔接 `/tunan-testplan PLAN-002`。

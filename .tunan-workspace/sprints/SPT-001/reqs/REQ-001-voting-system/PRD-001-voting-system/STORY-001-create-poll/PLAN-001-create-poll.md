---
id: PLAN-001
title: 创建投票 PLAN（含 monorepo 脚手架）
owner: raptoravis
status: done
created: 2026-05-13
updated: 2026-05-13
source_id: STORY-001
priority: P2
blocked_by: []
---

# PLAN-001 创建投票（含 monorepo 脚手架）

## Approach

由于 STORY-001 是本项目首个落地 STORY，PLAN 同时完成**基础脚手架**与**创建投票端到端 happy path**两件事。

**选定方案**：pnpm workspace monorepo + Node `node:sqlite` + Hono（server）+ Vite/React/TypeScript（web）。

**为什么**：
- pnpm workspace：与 PRD-001 默认技术栈一致，零额外学习成本
- `node:sqlite`：Node 22+ 内置，无 native build，规避 Windows / 跨版本翻车（来源 RETRO-002）
- Hono：极简 + 跑 Node 也跑 Edge；HTTP 路由轻，适合本规模
- Vite/React：脚手架成熟，HMR 极快；TS 给类型保障

**否决备选**：
- Next.js（全栈）：对本规模过重，且引入 Server→Client 边界 prototype 坑（RETRO-PR-003）
- better-sqlite3：原生编译，Windows 翻车风险（RETRO-002）
- Express：路由 / 中间件 API 比 Hono 啰嗦

## Affected Files

```
# 新建：根目录
- package.json                                    新 — pnpm workspace 根，scripts 聚合
- pnpm-workspace.yaml                              新 — workspaces: apps/*
- tsconfig.base.json                               新 — 共享 ts 配置（strict: true）
- .nvmrc                                           新 — 锁 node 22

# 新建：server
- apps/server/package.json                         新 — hono、nanoid、vitest、tsx 依赖
- apps/server/tsconfig.json                        新 — extends base
- apps/server/src/index.ts                         新 — Hono app 启动入口，port 4123
- apps/server/src/db.ts                            新 — node:sqlite 连接 + schema 初始化
- apps/server/src/routes/polls.ts                  新 — POST /api/polls、GET /api/polls/:id
- apps/server/src/lib/id.ts                        新 — nanoid 10 位 id 生成
- apps/server/src/lib/cookies.ts                   新 — owner_token + voter_id cookie helper
- apps/server/test/polls.spec.ts                   新 — 创建投票端到端测试（TESTPLAN 详）

# 新建：web
- apps/web/package.json                            新 — react / vite / vitest 依赖
- apps/web/tsconfig.json                           新 — extends base
- apps/web/vite.config.ts                          新 — dev server proxy /api → :4123
- apps/web/index.html                              新
- apps/web/src/main.tsx                            新 — React 入口
- apps/web/src/App.tsx                             新 — 路由：/ → CreatePage、/p/:id → PollPage
- apps/web/src/pages/CreatePage.tsx                新 — 创建表单
- apps/web/src/pages/PollPage.tsx                  新 — 仅展示标题 + 候选项（投票动作留 STORY-002）
- apps/web/src/api.ts                              新 — fetch wrappers
- apps/web/src/pages/CreatePage.test.tsx           新 — 表单校验单测

# DB schema 初版（apps/server/src/db.ts 内联 SQL）
- polls(id PK, title, deadline_at NULL, owner_token, created_at)
- poll_options(id PK, poll_id FK, label, position)
- votes(poll_id FK, voter_id, option_id FK, updated_at)  -- STORY-002 才会写入；本 STORY 仅建表
```

## Steps

1. **根脚手架**：写 `package.json` + `pnpm-workspace.yaml` + `tsconfig.base.json` + `.nvmrc`；root `pnpm install` 通过
2. **server 包初始化**：写 `apps/server/package.json` + `tsconfig.json`；装 hono / nanoid / @types/node / vitest / tsx
3. **DB 层**：写 `db.ts`，用 `node:sqlite` 打开 `data.db`，启动时执行 schema CREATE IF NOT EXISTS
4. **API 层**：写 `routes/polls.ts`
   - `POST /api/polls`：校验 title 1..100 + options 2..10；生成 id、owner_token；写库；set-cookie `owner_token`；返回 `{ id }`
   - `GET /api/polls/:id`：返回 `{ id, title, options, deadline_at, is_owner }`，404 if not found
5. **server 入口**：`index.ts` 装配 Hono app + cors + cookie 中间件，监听 4123
6. **server 测试**：vitest + supertest（或 hono 的 `app.request`）写覆盖 STORY-001 AC 的 spec（红→绿）
7. **web 包初始化**：写 `apps/web/package.json` + vite config（proxy /api → http://localhost:4123）
8. **web 创建页**：`CreatePage.tsx` — 表单 + 校验 + 提交 → 跳 `/p/:id`
9. **web 投票详情页（仅展示）**：`PollPage.tsx` — fetch GET /api/polls/:id 渲染标题、候选项、截止倒计时
10. **web 单测**：用 vitest + @testing-library/react 测表单校验逻辑
11. **联调 smoke**：`pnpm -F server dev` + `pnpm -F web dev`，浏览器走端到端
12. **PR 起 + tunan-pr 闭环**

## Risks

- **R-1** `node:sqlite` Node 版本：要求 Node ≥ 22.5（22 LTS 含），check.sh 已要求 Node ≥ 20，本 PLAN 把 `.nvmrc` 锁到 22；CI 也要 22
- **R-2** 跨域 cookie：dev 走 vite proxy 走同源，避免 SameSite 坑
- **R-3** Windows 路径分隔：所有 path 用 `path.join` / `import.meta.url` URL；不写裸 `\`
- **R-4** 端口 4123 残留进程：dev 报 EADDRINUSE 时按 RETRO-REQ-001 已知办法 `taskkill //F //IM node.exe`

## Rollback

- 本 STORY 是首个产出，分支隔离在 worktree `tunan/dev/STORY-001-raptoravis`；rollback = 不合并 PR
- 若已合并：`git revert <merge-commit>`；DB schema 不需要单独迁移工具（greenfield，删 `data.db` 即可）
- feature flag：无（首个 STORY 整体作为最小可用版）

## 接下来做什么

1. ★ `/tunan-testplan PLAN-001` — pipeline 衔接

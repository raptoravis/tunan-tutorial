---
id: PLAN-001
title: 项目脚手架实现计划
owner: raptoravis
source_id: STORY-001
status: done
created: 2026-05-13
updated: 2026-05-13
priority: P2
blocked_by: []
---

# PLAN-001 — 项目脚手架

## Approach

采用 pnpm workspaces 单仓多包：`apps/server`（Hono + node:sqlite）+ `apps/web`（Vite + React + TypeScript）。Vite dev server 通过 `server.proxy` 把 `/api/**` 代理到 server 的 4123 端口，避免 CORS。

**否决项：**
- Next.js — 教学场景；前后端分离更便于讲解；与 RETRO-002 偏好"node 内置 + 纯 JS"一致
- Express — 老旧；Hono 更轻、TS 友好、与 node 内置 fetch 风格一致
- better-sqlite3 — 原生模块在 Windows / 新 Node 版本上易翻车（RETRO-002）；用 `node:sqlite`（Node 22+ 内置）

> 仓库根已存在空的 `server/` 和 `web/` 目录。PLAN 将其改造为 pnpm workspace 下的 `apps/server` + `apps/web`（直接在 `server/`、`web/` 下落代码即可，无需重命名；workspace 配置指向它们）。

## Affected Files

```
- package.json                  — 新建：workspace 根，scripts (dev/build/test)
- pnpm-workspace.yaml           — 新建：声明 server/ web/ 为 workspace
- tsconfig.base.json            — 新建：共享 TS 配置
- .nvmrc                        — 新建：锁 node 22
- server/package.json           — 新建：hono + tsx
- server/tsconfig.json          — 新建
- server/src/index.ts           — 新建：Hono app + /api/health + 启动监听 4123
- server/src/db.ts              — 新建：node:sqlite 打开 data.db，导出 db 实例
- server/.gitignore             — 新建：忽略 data.db、dist
- web/package.json              — 新建：vite + react + react-dom + ts
- web/tsconfig.json             — 新建
- web/vite.config.ts            — 新建：proxy /api → :4123
- web/index.html                — 新建
- web/src/main.tsx              — 新建：React 入口
- web/src/App.tsx               — 新建：显示 "Voting System" + fetch /api/health
- .gitignore                    — 修订：补 dist、apps/server/data.db、*.db-journal、*.db-shm、*.db-wal
- README.md                     — 不动（USER.md 已经介绍项目）
```

## Steps

1. **Workspace 根**：写 `package.json`（`"private": true`、`"packageManager": "pnpm@9"`、scripts: `dev` 用 `pnpm -r --parallel dev`、`build`、`test`），`pnpm-workspace.yaml`（`packages: [server, web]`），`tsconfig.base.json`，`.nvmrc`（`22`）
2. **Server 子包**：`server/package.json` 依赖 hono、devDeps tsx + vitest + @types/node + typescript；`src/index.ts` Hono app `GET /api/health` 返回 `{ok:true}`，端口 4123；`src/db.ts` 用 `node:sqlite` 打开 `./data.db`，启动时 `PRAGMA journal_mode=WAL`；dev script: `tsx watch src/index.ts`
3. **Web 子包**：`web/package.json` 依赖 react/react-dom，devDeps vite + @vitejs/plugin-react + typescript + vitest + @testing-library/react + jsdom；`vite.config.ts` 开 react 插件 + `server.proxy: { '/api': 'http://localhost:4123' }`；`index.html` + `src/main.tsx` + `src/App.tsx` (useEffect fetch `/api/health` → setState → 显示 "Voting System" 标题 + "API: ok"/"API: …loading")
4. **gitignore 修订**：在根 .gitignore 追加 `dist/`、`server/data.db`、`*.db-journal`、`*.db-shm`、`*.db-wal`
5. **Sanity**：`pnpm install` → `pnpm -F server dev`（后台）+ `pnpm -F web dev` → curl health + 浏览器验证

## Risks

- **R1 node:sqlite 需要 Node ≥ 22**。`.nvmrc` 锁版本 + server `engines.node: ">=22"`；启动时 `import { DatabaseSync } from 'node:sqlite'` 失败则给出明确提示
- **R2 vite proxy 在 web 单包测试时不生效**——只在 `pnpm dev` 同时起 server 后才通。AC-3 在 e2e/手测时验证；vitest 单测不依赖 proxy
- **R3 端口冲突 4123/5173 被占**——pipeline 已知（tunan-pipeline §"EADDRINUSE 4123"）；启动前可加自检脚本，但不在本 STORY 范围

## Rollback

- 整个 STORY 是新建文件；回滚 = revert commit。无 DB 迁移、无 feature flag
- 具体 revert：`git revert <STORY-001 merge commit>` 即恢复到 `test` 分支 HEAD

## Test File Hints（仅列文件，内容由 tunan-testplan 决定）

- `server/src/index.test.ts` — health 端点 smoke
- `web/src/App.test.tsx` — 标题渲染 + mock fetch 验证 "API: ok"

## 接下来做什么

由 pipeline 自动衔接 `/tunan-testplan PLAN-001`。

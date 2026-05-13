---
id: PLAN-001
title: 项目脚手架 PLAN
owner: raptoravis
source_id: STORY-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P0
blocked_by: []
---

# PLAN-001 — 项目脚手架

## Approach

从零搭 pnpm monorepo：根 `pnpm-workspace.yaml` 声明 `server`、`web` 两包。
- 后端：Hono + `node:sqlite`（Node 22+ 内置，避免 better-sqlite3 原生编译在 Windows 翻车 — 见 RETRO-002）
- 前端：Vite + React + TypeScript
- 端口：server=4123、web=5173（Vite 配代理 `/api → http://localhost:4123`）
- TS：每包独立 `tsconfig.json`，根 `tsconfig.base.json` 共享 strict 配置

**否决方案**：
- Express + sqlite3：sqlite3 是 native + Express 已过时，弃
- Next.js 一体化：教学项目，前后端分离更清楚
- Drizzle/Prisma ORM：教学项目手写 SQL 更直观

## Affected Files

```
新建：
- package.json                       — 根 workspace 声明 + scripts
- pnpm-workspace.yaml                — workspaces: ['server', 'web']
- tsconfig.base.json                 — 共享 strict TS 配置
- .gitignore                         — 追加 node_modules、dist、server/data/*.db
- server/package.json                — hono、@hono/node-server、tsx、typescript
- server/tsconfig.json               — extends base，target ES2022
- server/src/index.ts                — Hono app 入口；GET /api/health
- server/src/db.ts                   — node:sqlite 初始化 + DDL（topics/options/votes）
- web/package.json                   — react、react-dom、vite、@vitejs/plugin-react、typescript
- web/tsconfig.json                  — extends base + jsx react-jsx
- web/vite.config.ts                 — server.port=5173, proxy /api → 4123
- web/index.html                     — 标题 "Voting"
- web/src/main.tsx                   — React 入口
- web/src/App.tsx                    — 显示 "Voting" + health 探测
```

## Steps

1. 在根目录写 `package.json`、`pnpm-workspace.yaml`、`tsconfig.base.json`、补 `.gitignore`
2. 写 `server/` 包：`package.json` + `tsconfig.json` + `src/index.ts`（Hono + /api/health）+ `src/db.ts`（node:sqlite + DDL）
3. 写 `web/` 包：`package.json` + `tsconfig.json` + `vite.config.ts` + `index.html` + `src/main.tsx` + `src/App.tsx`
4. 执行 `pnpm install`
5. 验证 AC：
   - `pnpm -F server dev` → curl localhost:4123/api/health 得 `{ok:true}`，且 `server/data/voting.db` 已生成且含 3 张表
   - `pnpm -F web dev` → 浏览器 5173 看到 "Voting" + "API ok"
   - `pnpm -r typecheck` 通过
   - 二次启动 server 不报错（CREATE TABLE IF NOT EXISTS）

## Risks

- **R-001 node:sqlite 需要 Node ≥22**：在 server/package.json `engines.node` 写 `>=22` 提醒；启动时若 `import('node:sqlite')` 抛错则在 catch 中输出明确提示
- **R-002 pnpm 未安装**：依赖 corepack；README 不在本 STORY 范围（教学已假定环境就绪）
- **R-003 Windows 路径分隔符**：server/data 用 `path.join`

## Rollback

整个 STORY-001 是首次脚手架；回滚 = 删除新增文件即可。一旦后续 STORY 已基于此构建，则不再具备独立回滚意义。

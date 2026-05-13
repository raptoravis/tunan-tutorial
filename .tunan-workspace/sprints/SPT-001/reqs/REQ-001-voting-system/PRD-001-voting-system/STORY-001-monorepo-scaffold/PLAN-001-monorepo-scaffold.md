---
id: PLAN-001
title: 搭 monorepo 脚手架 PLAN
owner: raptoravis
source_id: STORY-001
status: ready
created: 2026-05-13
updated: 2026-05-13
---

# PLAN-001 — Monorepo 脚手架

## Approach

pnpm workspace monorepo，`apps/server` 用 Hono + `node:sqlite`（Node 22+ 内置，避开 better-sqlite3 原生编译，见 RETRO-002），`apps/web` 用 Vite + React + TS。顶层 npm script `pnpm dev` 用 `concurrently` 同时起 server (tsx) 和 vite dev。

否决：Express（中间件更重）/ Fastify（schema 学习曲线）/ Next.js（SSR 不必要，SPA 足够）。

## Affected Files

```
新建：
- package.json                          — 顶层 workspace + scripts
- pnpm-workspace.yaml                   — packages: apps/*
- .gitignore                            — node_modules, dist, *.db
- tsconfig.base.json                    — 共享 ts 配置
- apps/server/package.json              — hono, node:sqlite, tsx, vitest
- apps/server/tsconfig.json
- apps/server/src/index.ts              — Hono app + /api/health
- apps/server/src/db.ts                 — node:sqlite 单例 + SELECT 1
- apps/server/data/.gitkeep             — 数据目录占位
- apps/server/test/health.spec.ts       — health 端点 vitest 测试
- apps/server/vitest.config.ts          — vitest 配置（vite 6+）
- apps/web/package.json                 — react, vite, ts
- apps/web/tsconfig.json
- apps/web/vite.config.ts               — proxy /api → :4123
- apps/web/index.html
- apps/web/src/main.tsx                 — React 入口
- apps/web/src/App.tsx                  — "Voting App" + health 状态
```

## Steps

1. **顶层 workspace**：写 `pnpm-workspace.yaml` 列 `apps/*`；顶层 `package.json` 加 `dev`/`test` 脚本 + devDep `concurrently`
2. **共享 ts 配置**：`tsconfig.base.json` 启 strict、moduleResolution=bundler、ESNext target
3. **server 包**：起 Hono app 监听 4123；`/api/health` 读 `db.prepare('SELECT 1').get()` 验证；用 `tsx watch src/index.ts` 起 dev；vitest 占位 `health.spec.ts` 用 `app.request('/api/health')` Hono 自带 mock
4. **server DB 单例**：`db.ts` 用 `import { DatabaseSync } from 'node:sqlite'`，路径 `data/voting.db`；模块加载即开连接（按 RETRO-002）
5. **web 包**：Vite 配置 proxy `/api` → `http://localhost:4123`；`App.tsx` 用 `useEffect + fetch('/api/health')` 拉状态显示
6. **gitignore**：`node_modules`、`dist`、`apps/server/data/*.db*`、`.tunan-workspace/worktrees/`
7. **校验**：`pnpm install` → `pnpm -F server test` 应过 → `pnpm dev` 起 server + web，curl health + 浏览器访问 5173 验证

## Risks

- **R1** Node ≥ 22 才稳定 `node:sqlite`。CI/本地若 Node 20，`SqliteError` 会更晦涩。Mitigation：顶层 `engines.node: ">=22"` + 启动日志一行 `Node ${process.version}`
- **R2** vite 5 + `node:sqlite` 引入会让 vitest 在解析 server 包时报错（见 RETRO-002 同类）。Mitigation：vitest@3+ 含 vite 6，必装 vitest@3 而非默认
- **R3** Windows shell（PowerShell）下 `concurrently` 默认 shell 行为可能不一致。Mitigation：用 `concurrently "pnpm -F server dev" "pnpm -F web dev"` 双引号包裹

## Rollback

- 整个 scaffold 是单 PR 单 commit；reverts 简单：`git revert <PR-commit>`
- 无 DB migration（SQLite 文件本身可删）
- 无 feature flag（功能即骨架）

## TESTPLAN 预告

`tunan-testplan` 将基于 AC 写出：health endpoint smoke、web dev 启动 smoke、 SELECT 1 通断、pnpm install 干净通过。

---
id: TESTPLAN-001
title: 项目脚手架 TESTPLAN
owner: raptoravis
source_id: PLAN-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P0
blocked_by: []
---

# TESTPLAN-001 — 项目脚手架

## Test Matrix

| 维度 | 值 |
|---|---|
| OS | Windows 11（开发机） |
| Node | ≥22（node:sqlite 内置） |
| 包管理 | pnpm |
| 浏览器 | Chrome / Edge |

## Persona Scenarios

**novice — 第一次 clone 仓库的人**
1. clone 仓库后 `pnpm install`
2. `pnpm -F server dev` 启动后端
3. 浏览器访问 `http://localhost:4123/api/health` → 看到 `{"ok":true}`
4. 新开 terminal `pnpm -F web dev`
5. 浏览器访问 `http://localhost:5173` → 看到 "Voting" 标题与 "API ok"

**power-user — 想确认 DB 文件 schema**
1. 启动 server 后 ls `server/data/` → 看到 `voting.db`
2. 用 sqlite3 cli 跑 `.schema` → 看到 `topics / options / votes` 三张表
3. 关掉 server 再启动 → 不重复建表、无错误

**adversarial — 二次启动 / 损坏环境**
1. 已存在 `voting.db` 时再启动 server → 不报错
2. 删除 `server/data/` 目录后启动 → 自动重建目录与 db 文件
3. Node 版本 < 22 时启动 → 报清晰错误（不是隐晦栈）

## Smoke

- [ ] `pnpm install` 成功，无 native build 报错
- [ ] `pnpm -F server dev` 启动后 4123 监听
- [ ] `curl http://localhost:4123/api/health` 返回 `{"ok":true}`
- [ ] `pnpm -F web dev` 启动后 5173 监听
- [ ] 浏览器 5173 页面显示 "Voting" 且 health 状态显示 "API ok"
- [ ] `server/data/voting.db` 自动生成且包含 topics/options/votes 三表
- [ ] `pnpm -r typecheck` 通过

## Regression

无（首次脚手架，无既有功能可回归）

## Pass Criteria

- Smoke 全部 ✅ + 3 个 Persona 场景全部按描述通过 → PR 可进 sponsor_wait
- 任一 ❌ → PR 状态 failed

## Test Files (将由 tunan-dev 创建)

- `server/src/__tests__/health.test.ts` — vitest 用 hono testClient 调 `/api/health`
- `server/src/__tests__/db.test.ts` — 启动 db.ts 后检查三张表已存在；二次调用不抛错

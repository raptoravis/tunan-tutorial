---
id: TESTPLAN-001
title: 项目脚手架测试计划
owner: raptoravis
source_id: PLAN-001
status: done
created: 2026-05-13
updated: 2026-05-13
priority: P2
blocked_by: []
---

# TESTPLAN-001 — 项目脚手架

## Test Matrix

| 维度       | 取值                                       |
|------------|--------------------------------------------|
| 运行时     | Node 22 (Windows 11)                       |
| 浏览器     | Chrome / Edge 最新                         |
| 测试框架   | vitest 3 (前后端共用)                       |
| 测试类型   | server unit + web component (jsdom) + 手测 e2e |

## Persona Scenarios

- **novice (Alice 第一次启动)**
  1. `git clone` → `pnpm install`
  2. `pnpm dev`
  3. 浏览器开 `localhost:5173`
  4. 期望：看到 "Voting System" 标题；下方显示 "API: ok"；server 端口 4123 有 `{ok:true}` 响应

- **power-user (开发者反复重启)**
  1. `pnpm -F server dev` 单独起 server，curl health
  2. 终止后重启，data.db 文件还在但被 server 正常重开（不报锁）
  3. 期望：health 一直 200；重启不丢 data.db

- **adversarial (端口冲突 / 无 Node 22)**
  1. 在 4123 端口先占用一个进程，再 `pnpm -F server dev`
  2. 期望：server 输出明确错误信息（EADDRINUSE）+ 进程退出非 0
  3. Node 版本 < 22 时启动 server，期望 `node:sqlite` import 失败给出可读信息

## Smoke

- [ ] S1 `pnpm install` 全部子包安装成功
- [ ] S2 `pnpm -F server build`（tsc 编译）无错
- [ ] S3 `pnpm -F web build`（vite build）无错
- [ ] S4 `pnpm test` 全部用例 ✅

## Unit / Integration

- [ ] U1 `server/src/index.test.ts` — 用 Hono `app.request('/api/health')` 调用，期望 status=200、json={ok:true}
- [ ] U2 `server/src/db.test.ts` — db 实例可执行 `SELECT 1` 返回 1（验证 node:sqlite 通）
- [ ] U3 `web/src/App.test.tsx` — render `<App/>`，mock global fetch `/api/health` 返回 `{ok:true}`，期望 DOM 含 "Voting System" 和 "API: ok"
- [ ] U4 `web/src/App.test.tsx` — fetch reject 时，期望 "API: …loading" 或 "API: error"（任一明确态，不是 NaN）

## E2E（手测，pipeline 模式下作为 sponsor 验收清单）

- [ ] E1 同时起 server + web，浏览器看到 "API: ok"
- [ ] E2 关闭 server 后刷新 web，前端显示 loading / error 态而不是白屏

## Regression

无（首个 STORY，没有历史功能可回归）

## Pass Criteria

- S1..S4 全 ✅
- U1..U4 全 ✅
- E1..E2 手测 ✅
- 任一失败 → PR 状态 failed，进 tunan-pr-resolve 或 retro

## 接下来做什么

由 pipeline 自动衔接 `/tunan-dev TESTPLAN-001`。

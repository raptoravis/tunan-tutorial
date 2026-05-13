---
id: TESTPLAN-001
title: Monorepo 脚手架 TESTPLAN
owner: raptoravis
source_id: PLAN-001
status: ready
created: 2026-05-13
updated: 2026-05-13
---

# TESTPLAN-001 — Monorepo 脚手架

## Test Matrix

| 维度 | 取值 |
|---|---|
| OS | Windows 11（开发主机，关键覆盖） |
| Node | ≥ 22 |
| Shell | PowerShell |
| 包管理 | pnpm 9+ |

## Persona Scenarios

### novice — Newman 第一次拉仓库
1. `git clone` + `cd`
2. `pnpm install` 干净通过（无 ERR 红字、无 native build）
3. `pnpm -F server dev` 一行 "listening on 4123"
4. 另一个终端 `pnpm -F web dev` Vite 启动
5. 浏览器打开 vite 显示的本地地址，看到 "Voting App" 文字 + health 状态 "ok"

### power-user — Penny 跑全 sanity
1. `pnpm install`
2. `pnpm -F server test` 至少一个用例 pass
3. `pnpm dev` 单命令并发起 server + web
4. `curl http://localhost:4123/api/health` 返回 `{"ok":true,"db":"ok"}`

### adversarial — Aaron 故意搞坏
1. 删 `apps/server/data/` 重启 server → 应该自动重建 data 目录或在启动日志明确报缺失
2. 占用 4123 端口后启动 server → 应在启动日志显式报 `EADDRINUSE`（不静默挂起）
3. Node 版本 18 启动 → 应在启动时拒绝（engines + 显式校验）

## Smoke

- [ ] **S-1** `pnpm install` 干净退出 code 0
- [ ] **S-2** `pnpm -F server test` exit 0
- [ ] **S-3** `pnpm -F server dev` 启动后 `curl http://localhost:4123/api/health` 返回 `{ok:true, db:"ok"}`
- [ ] **S-4** vite dev server 启动；浏览器看到 "Voting App" + health 状态显示
- [ ] **S-5** `pnpm dev` 顶层一行起两端

## Functional Tests（vitest）

- [ ] **F-1** `health.spec.ts`：`app.request('/api/health')` → 200 + `{ok:true,db:"ok"}`
- [ ] **F-2** `health.spec.ts`：DB 单例 `db.prepare('SELECT 1').get()` 返回 `{1: 1}`

## Regression

- [ ] **R-1** `.tunan-workspace/` 内容不被改动（除本 STORY 落档）
- [ ] **R-2** `tutorials/`、`USER.md`、`check*.{sh,ps1}` 不被改动

## Pass Criteria

- 全部 Smoke + Functional 项 ✅ → PR 可进 sponsor_wait
- 任一 ❌ → PR failed，回 retro
- Adversarial 项 1-3 至少 2 项应有明确表现（启动日志清楚），不要求全部硬阻塞

## 测试覆盖度决议

- ★默认：单元/集成（vitest in-process Hono `app.request`）+ 手工 smoke（cli + 浏览器）
- 不引入 Playwright / e2e 自动化（脚手架阶段过重）

## TDD red-gate 计划

`tunan-tdd` 先写 `health.spec.ts` 并跑红（health endpoint 还没实现）→ sponsor `red ok` → 再写 `index.ts` + `db.ts` 让它绿。

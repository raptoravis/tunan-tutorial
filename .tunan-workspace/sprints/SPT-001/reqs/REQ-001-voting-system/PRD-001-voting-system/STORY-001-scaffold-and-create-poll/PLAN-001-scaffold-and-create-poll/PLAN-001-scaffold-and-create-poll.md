---
id: PLAN-001
title: 项目脚手架 + 创建投票端到端 PLAN
owner: raptoravis
kind: feature
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: STORY-001
priority: P0
blocked_by: []
---

# PLAN-001: 项目脚手架 + 创建投票端到端

## Approach

单包 Node + TypeScript 工程；Web 框架选 **Hono**（轻量、内置 zod 集成、TS 一等公民）；DB 选 **better-sqlite3**（同步 API 代码最短，单机部署满足 PRD < 50 人规模）；测试 **Vitest** + `@hono/node-server`（无需启真实端口跑 API 测试，`app.request()` 即可）。视图层暂用 **服务端渲染 HTML 字符串**（不引前端框架以最小化 STORY-001 scope；STORY-003 实时刷新引入小量 vanilla JS）。

## Environment Notes
- [x] Windows 兼容：路径用正斜杠；行尾 `lf`（.gitattributes）；脚本只用 pnpm，不依赖 sh
- [x] Node 版本要求：Node 24（已验证 `v24.15.0`）；`better-sqlite3` 需匹配 ABI（pnpm 自动重建）
- [ ] Playwright / HTTP_PROXY：本 STORY 不跑真实端口，无需
- [ ] 多 OS CI：tutorial repo 暂不上 CI；本地 vitest 通过即可

## Affected Files
- `package.json` — 项目元数据 + scripts
- `tsconfig.json` — TS 编译配置
- `pnpm-lock.yaml` — 锁
- `.gitignore` — node_modules / dist / *.sqlite / .env
- `.gitattributes` — `* text=auto eol=lf`
- `src/server.ts` — entry，启 HTTP server
- `src/app.ts` — Hono app 装配（注册路由 + 错误处理）
- `src/db.ts` — better-sqlite3 实例 + 启动时跑 migration
- `src/schema.sql` — DDL（polls + options 两表，votes/sessions 留 STORY-002）
- `src/ids.ts` — nanoid wrappers（pollId 22 字符、adminToken 32 字符）
- `src/validation.ts` — zod schemas（createPollInput）
- `src/routes/polls.ts` — POST /api/polls + GET /v/:id + GET /
- `src/views/layout.ts` — HTML layout helper（含 viewport meta + 基本 CSS）
- `src/views/create.ts` — 创建投票表单页
- `src/views/poll.ts` — 参与页骨架（本 STORY 仅显示题目 + 选项 + 截止时间）
- `tests/polls.create.test.ts` — STORY-001 AC 测试

## Steps
1. **scaffold**：`pnpm init` + 装 hono / better-sqlite3 / zod / nanoid / vitest / typescript / tsx / @types/node / @types/better-sqlite3
2. **TS 配置**：tsconfig 走 `module: nodenext`、`target: es2022`、`strict: true`
3. **DB 层**：`db.ts` 启动时 `exec(schema.sql)`（用 `CREATE TABLE IF NOT EXISTS` 幂等）
4. **API 层**：POST `/api/polls` + GET `/v/:id` + GET `/`，错误用 `c.json({error: code}, status)`
5. **视图层**：layout + create form + poll skeleton（移动端 viewport meta，简易 CSS 内联）
6. **TDD 红态**：先写 `tests/polls.create.test.ts` 覆盖 STORY-001 全部 AC，确认全红
7. **实现**：补齐 routes/views，让测试转绿
8. **手测**：`pnpm dev` → 浏览器访问 `/` → 提交表单 → 看到 `/v/:id` 页面

## Risks
- **better-sqlite3 原生模块在 Windows + Node 24 偶尔编译失败**：缓解 = 预先 `pnpm rebuild better-sqlite3`，失败则降级 `node:sqlite`（Node 22.5+ 内置）
- **Hono `app.request()` 不带 cookie 测试** STORY-002 才用，本 STORY 无影响
- **时区敏感**：截止时间用 epoch ms 存数据库；前端用 `<input type="datetime-local">` 提交本地时间，服务端解释为 UTC（已在 validation.ts 显式 `new Date(...).getTime()`）

## Rollback
- 任何文件改动均在 feature 分支 `tunan/dev/STORY-001-raptoravis`；revert 整个分支即回到 main 状态
- 数据库文件 `data/polls.sqlite` 在 .gitignore，删掉即重置

## 接下来做什么
1. ★ `/tunan-testplan STORY-001`

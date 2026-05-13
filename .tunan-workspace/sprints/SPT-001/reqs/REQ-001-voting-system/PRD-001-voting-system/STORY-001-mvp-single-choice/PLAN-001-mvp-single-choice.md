---
id: PLAN-001
title: STORY-001 MVP 实现计划
owner: raptoravis
source_id: STORY-001
status: done
created: 2026-05-13
updated: 2026-05-13
priority: P2
pre_auth:
  by: raptoravis
  at: 2026-05-13T00:00:00Z
  scope: [tdd_red_gate, pr_lgtm]
---

# PLAN-001 — STORY-001 MVP（单选投票）实现计划

## Approach

**选定路线**：pnpm 双包 monorepo（`server` + `web`），server 用 Hono + `node:sqlite`，web 用 Vite + React + TS。

理由：
- `node:sqlite` 是 Node 22+ 原生模块，零原生编译，跨平台（含 Windows）一致；遵 RETRO-002 "优先 node:* > 纯 JS > 原生"
- Hono 体积小、TS 优先、Web 标准 Request/Response，便于后续切 edge 部署
- Vite + React 是 STORY 量级最低摩擦的前端栈；HMR 顺畅
- monorepo 让 server/web 共享类型（`shared/` 目录放 API 类型），保持类型一致

否决：
- **Express**：缺 TS-first 体验，类型来自 @types；本 demo 不必。
- **Next.js**：SSR 不是核心需求，引入会盖过"REST API + SPA"教学重点。
- **better-sqlite3**：原生模块，Windows + Node 新版常翻车（RETRO-002）。
- **Postgres**：违背 PRD 单文件 SQLite 决议。

## 工程结构

```
tunan-tutorial.git/
├── package.json                # workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── packages/
│   ├── server/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts        # Hono app entry, listen :4123
│   │   │   ├── db.ts           # node:sqlite open + migrate
│   │   │   ├── schema.sql      # CREATE TABLE polls/options/votes
│   │   │   ├── routes/
│   │   │   │   ├── polls.ts    # POST /api/polls, GET /api/polls/:id
│   │   │   │   └── vote.ts     # POST /api/polls/:id/vote
│   │   │   ├── shortcode.ts    # base62(crypto.randomBytes) 短码
│   │   │   └── types.ts        # 共享 API 类型
│   │   └── tests/              # vitest (供 TESTPLAN 填充)
│   └── web/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts      # dev proxy /api → :4123
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx         # 路由分发（轻量手写 hash/history）
│           ├── pages/
│           │   ├── NewPoll.tsx # /new 创建页
│           │   └── Poll.tsx    # /p/:id 投票+结果
│           ├── api.ts          # fetch 封装
│           └── styles.css      # 基础样式 + 响应式
└── .gitignore                  # node_modules / *.sqlite / dist
```

## Affected Files

> 此 STORY 是 greenfield 工程底座，全部为新增。

- `package.json`（新建）— workspace root，scripts `dev:server` / `dev:web` / `dev`（并行）/ `test`
- `pnpm-workspace.yaml`（新建）— `packages/*`
- `tsconfig.base.json`（新建）— 基础 strict TS 配置
- `.gitignore`（新建）— `node_modules`、`*.sqlite*`、`dist`
- `packages/server/package.json`（新建）— deps: hono、依赖 node 内置 sqlite/crypto；dev: tsx、vitest@3
- `packages/server/tsconfig.json`（新建）
- `packages/server/src/index.ts`（新建）— `serve({ port: 4123 }, app)`
- `packages/server/src/db.ts`（新建）— `new DatabaseSync(file)`，初始化时执行 schema.sql；WAL 模式
- `packages/server/src/schema.sql`（新建）— polls(id PK, short_code UNIQUE, title, mode, created_at)、options(id PK, poll_id FK, label, idx)、votes(id PK, poll_id FK, option_id FK, created_at)
- `packages/server/src/shortcode.ts`（新建）— `crypto.randomBytes(6)` → base62，取前 8 字符
- `packages/server/src/routes/polls.ts`（新建）— `POST /api/polls` 校验 + 写入；`GET /api/polls/:shortCode` 读 poll+options+聚合票数
- `packages/server/src/routes/vote.ts`（新建）— `POST /api/polls/:shortCode/vote` 写一票；返回最新聚合
- `packages/server/src/types.ts`（新建）— `Poll`、`Option`、`PollResult` 接口
- `packages/web/package.json`（新建）— deps: react、react-dom；dev: vite、@vitejs/plugin-react、typescript
- `packages/web/vite.config.ts`（新建）— `server.proxy: { '/api': 'http://localhost:4123' }`
- `packages/web/index.html`（新建）
- `packages/web/src/main.tsx`（新建）— mount `<App />`
- `packages/web/src/App.tsx`（新建）— history 路由：`/new`、`/p/:code`，其余回退首页占位
- `packages/web/src/pages/NewPoll.tsx`（新建）— 表单（标题+动态选项），提交调 `POST /api/polls`，成功 push 到 `/p/:code`
- `packages/web/src/pages/Poll.tsx`（新建）— 读 `GET /api/polls/:code`；未投态展示选项 + 提交按钮；投后切换为结果视图
- `packages/web/src/api.ts`（新建）— `createPoll` / `getPoll` / `vote`
- `packages/web/src/styles.css`（新建）— reset + 简洁 UI + a11y 焦点可见
- `packages/server/tests/.gitkeep`（新建，占位）— vitest 测试将由 TESTPLAN 详写

## Steps

1. **工程脚手架**：建 root `package.json` + `pnpm-workspace.yaml` + `tsconfig.base.json` + `.gitignore`；执行 `pnpm install`（空 workspace 验证可装）。验证：`pnpm -v` 可用、`pnpm install` 不报错。
2. **server 包脚手架**：建 `packages/server/{package.json, tsconfig.json, src/index.ts}`，写最小 Hono `GET /healthz → ok`；`pnpm -F server dev`（tsx watch）跑起来；`curl http://localhost:4123/healthz` 通。
3. **DB + schema**：建 `db.ts` + `schema.sql`；启动时打开 `./data.sqlite` 并 `db.exec(schemaSQL)` 幂等创建表；验证：删 sqlite 文件重启，表能重建。
4. **短码 + 创建端点**：`shortcode.ts` 加 `genShortCode()`；`routes/polls.ts` 加 `POST /api/polls`，校验 title/options，trim+去重 options，写 polls+options，返回 `{ id, shortCode, shareUrl }`。
5. **读端点**：`GET /api/polls/:shortCode` 返回 poll + options + `results: [{ optionId, count, percent }]` + `totalVotes`；含 404 分支。
6. **投票端点**：`POST /api/polls/:shortCode/vote` body `{ optionIds: number[] }`，校验非空 + option 属于该 poll；写 votes，按多对一返回最新聚合。
7. **web 脚手架**：建 `packages/web/{package.json, vite.config.ts, index.html, src/main.tsx, src/App.tsx}`；`pnpm -F web dev` 跑起来访问首页空壳。
8. **创建页**：`NewPoll.tsx` 实现表单 + 客户端校验（标题非空 / 选项 ≥2）；提交成功跳 `/p/:code`。
9. **投票页 + 结果**：`Poll.tsx` 首次 GET poll；未投态渲染 radio 列表；提交后用响应里的最新聚合本地切换为结果视图（无刷新）；结果区 `aria-live="polite"`，按 count 倒序。
10. **样式 + 响应式**：`styles.css` 桌面/移动均可读，焦点 outline 可见，对比度 ≥4.5:1。
11. **sanity**：完整走一遍——创建 "周末去哪" + ["杭州","成都"] → 跳转 → 用第二个浏览器（或隐身）投杭州 2 票/成都 1 票 → 看结果倒序与百分比正确。

## Risks

- **R1 `node:sqlite` Node 版本**：需 Node 22+（实验性 → 22+ 稳定）。缓解：root `package.json` 设 `"engines": { "node": ">=22.5" }`，dev 启动时打印 `process.version` 校验。
- **R2 vite + vitest 兼容**：必须 `vitest@3`（带 vite 6），不要用 vitest 2 + vite 5（RETRO-vitest5-sqlite 已记）。
- **R3 端口冲突 4123**：Windows 上残留 node 进程导致 `EADDRINUSE :::4123`。缓解：README 写明 `taskkill /F /IM node.exe` 或 `pkill -f tsx`；server 启动日志打印 PID 便于排查。
- **R4 选项 trim + 去重**：用户重复输入 "杭州" / "杭州 "。决策：trim 后比对 `Set`，全去重；返回前端"包含重复，已自动去重"提示。
- **R5 短码碰撞**：8 位 base62 ≈ 218T；保留 `short_code UNIQUE`，写入失败重试 3 次再 500。
- **R6 SSR 序列化坑**（参考 RETRO-PR-003）：本 STORY 选 SPA（Vite + React），无 SSR/Server Component 边界，N/A。后续若改 Next 需重审。

## Rollback

本 STORY 是 greenfield 工程基础。回滚 = `git revert` PR-001 的 merge commit；本地清理：
- 删 `data.sqlite*` 文件
- 删 `packages/server` 与 `packages/web` 目录
- 还原 root `package.json` / `pnpm-workspace.yaml` 删除

无 DB 迁移，因为这是首次建表（drop 文件即可）。无 feature flag。

## 对齐决议（pre-auth 全部 ★ 默认）

| 决策点 | ★ 默认（采用） | 备选 |
|---|---|---|
| 后端框架 | Hono | Express / Fastify |
| DB 驱动 | `node:sqlite` | better-sqlite3 |
| 前端框架 | Vite + React + TS | Next.js / SvelteKit |
| 包管理 | pnpm workspaces | npm / yarn |
| 路由方式（web） | 手写 history（轻量） | react-router |
| 测试框架 | vitest@3 | jest / node:test |
| 端口 | server :4123, web :5173 | 任意 |
| 短码长度 | 8 位 base62 | 6 / 10 |

## 接下来做什么

1. ★ `/tunan-testplan PLAN-001` — 出测试计划
2. （PLAN 停在 unstaged；统一在 `/tunan-dev` 入口 commit+push 到 base）
3. `/tunan-prime`

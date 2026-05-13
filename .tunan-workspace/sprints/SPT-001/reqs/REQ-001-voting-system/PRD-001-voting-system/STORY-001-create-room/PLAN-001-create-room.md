---
id: PLAN-001
title: 创建投票房间 — 实现计划
owner: raptoravis
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: STORY-001
priority: P1
---

# PLAN-001 — 创建投票房间

源：[STORY-001](./STORY-001-create-room.md)

## Approach

**选定栈**：pnpm monorepo + Hono（server, Node 内置）+ Vite/React/TS（web）+ `node:sqlite`（Node 22+ 内置 SQLite driver）。

- **为什么 Hono**：极轻、TS 友好、不绑死中间件生态；本期不需要 Express 的庞大插件
- **为什么 `node:sqlite`**：Node 22 内置原生 SQLite 模块（无 npm 原生编译），跨平台稳定；规避 better-sqlite3 在 Windows 上偶发的 `node-gyp` 翻车（来源 RETRO-002）
- **为什么 Vite/React**：教学场景下最直接的 SPA 模板；不上 Next.js 即可绕开 [[RETRO-PR-003]] 提到的 Server→Client 序列化问题
- **为什么不上 ORM**：5 张表以内、查询都是平直 SQL，Drizzle/Prisma 反而增重；用 prepared statement 即可
- **否决备选**：
  - Next.js + SQLite（App Router）：⛔ Server→Client 行 prototype null 序列化坑；本期不必要
  - FastAPI + Jinja：⛔ 引入 Python 运行时，与 Node 工具链分离；教学统一性差
  - better-sqlite3：⛔ Windows 原生编译曾翻车（RETRO-002）

**配置约定**：
- 端口：server `:4123`，web dev `:5173`（vite 默认）；web 通过 vite proxy 把 `/api/*` 转到 server
- SQLite 文件：`./data/voting.sqlite`，可被 `VOTING_DB_PATH` 环境变量覆盖
- 短链 id：8 位 base62，用 `crypto.randomBytes(6)` 编码
- 管理 token：32 字节随机 → hex；服务端只存 SHA-256 hash

## Affected Files

新建：

```
- package.json                            — 根 pnpm workspace 声明
- pnpm-workspace.yaml                     — workspaces: server / web
- .gitignore                              — node_modules / data / dist
- tsconfig.base.json                      — 共享 TS 配置
- packages/server/package.json            — Hono + node:sqlite deps
- packages/server/tsconfig.json
- packages/server/src/index.ts            — Hono app 入口 + 启动
- packages/server/src/db.ts               — SQLite 连接 + 迁移 + prepared statements 封装
- packages/server/src/schema.sql          — rooms / options / votes 表 schema
- packages/server/src/routes/rooms.ts     — POST /api/rooms · GET /api/rooms/:id
- packages/server/src/lib/id.ts           — base62 短链 + 管理 token 生成 / hash
- packages/server/src/lib/validate.ts     — 标题 / 候选项长度校验
- packages/server/test/rooms.test.ts      — 单测：创建 + 持久化 + 校验
- packages/web/package.json               — Vite + React + TS
- packages/web/tsconfig.json
- packages/web/vite.config.ts             — proxy /api → :4123
- packages/web/index.html
- packages/web/src/main.tsx
- packages/web/src/App.tsx                — 路由壳子（/, /r/:id 占位, /created 成功页）
- packages/web/src/pages/Create.tsx       — 创建表单（标题 / 候选项动态行 / allow_add 开关）
- packages/web/src/pages/Created.tsx      — 房间链接 + 管理 token 展示 + 一键复制
- packages/web/src/lib/api.ts             — fetch wrapper
- packages/web/src/styles.css             — 基础排版 + a11y（focus 可见 / 对比度）
- README.md                               — 启动方式（dev / build / test）
```

仅读：无（新项目）。

## Steps

1. **脚手架**：根 `package.json` + `pnpm-workspace.yaml` + `.gitignore`；`pnpm install`
2. **SQLite schema**（`packages/server/src/schema.sql`）：
   - `rooms(id TEXT PK, title TEXT, allow_add INTEGER, admin_hash TEXT, created_at TEXT, closed_at TEXT NULL)`
   - `options(id INTEGER PK AUTOINCREMENT, room_id TEXT FK, label TEXT, created_at TEXT, deleted_at TEXT NULL)`
   - `votes(id INTEGER PK AUTOINCREMENT, room_id TEXT FK, participant_token TEXT, option_id INTEGER FK, created_at TEXT)`
   - index：`options(room_id)`、`votes(room_id, participant_token)`
3. **db 模块**（`db.ts`）：`open()` 打开 SQLite + 首次启动跑 schema；导出 prepared statements
4. **id / token 工具**（`lib/id.ts`）：`newRoomId()` (8 位 base62) / `newAdminToken()` (hex32) / `hashToken()` (SHA-256)
5. **校验工具**（`lib/validate.ts`）：标题 1..120、单候选项 1..80、候选项数 ≥ 2、去重去空白
6. **API 路由** `routes/rooms.ts`：
   - `POST /api/rooms` body `{title, options[], allow_add}` → 校验 → 生成 id + admin token → 落库 → 返回 `{room_id, admin_token, url}`
   - `GET /api/rooms/:id` → 返回房间 + 候选项（不含 admin token / hash）；404 不存在
7. **Hono 入口**（`index.ts`）：挂路由 + JSON middleware + 简单结构化日志（console.log JSON）+ 启动监听 4123
8. **server 单测**（`rooms.test.ts`）用 `node --test`：
   - 创建合法房间 → GET 回读匹配
   - 标题空 / 单候选项 / 超长 → 400
   - allow_add true/false → 持久化字段正确
   - 重启 db 句柄（重新 open）→ 数据不丢
9. **web 脚手架**：Vite + React TS 模板；vite proxy `/api` → `http://localhost:4123`
10. **创建页** `pages/Create.tsx`：
    - 受控表单：title、候选项 list（增删行）、allow_add checkbox
    - 前端校验提示 + 提交时调 `POST /api/rooms`
    - 成功跳 `/created?id=...&token=...`（token 仅在 URL 一次性传给 Created 页，不入 URL 历史推荐 `replace`）
11. **成功页** `pages/Created.tsx`：展示房间链接 + 管理 token + 复制按钮（`navigator.clipboard.writeText`，HTTP fallback 用 textarea+execCommand）
12. **样式 + a11y**（`styles.css`）：表单 label 显式关联、focus outline、文字对比度 ≥ 4.5:1、错误提示用 `role="alert"`
13. **README**：`pnpm install` / `pnpm -F server dev` / `pnpm -F web dev` / `pnpm -F server test` 说明
14. **冒烟**：在 worktree 里 `pnpm -F server dev` 起服务，curl 一次创建 + 一次 GET 验证

## Risks

- **R-1** `node:sqlite` 仍标记为实验性，需 Node ≥ 22 + `--experimental-sqlite`（实际 Node 22.5+ 默认开启，本机 v24 OK）；启动脚本里加显式 flag 兜底
- **R-2** Vite dev 与 server dev 分别启动，sponsor 跑教学时容易忘了起 server；README 显眼标注两条命令并放 `pnpm dev`（用 `concurrently`）选项
- **R-3** 管理 token 在 URL query 传到 Created 页有泄露浏览历史风险；用 `history.replaceState` 清掉 URL 中的 token，或改用 sessionStorage 单跳
- **R-4** `crypto.randomBytes` base62 编码长度计算要小心（6 字节 = 8 base62）；写单测覆盖

## Rollback

- 整个 STORY 在新 worktree / 新 PR 分支独立提交，未影响 base 分支；rollback = 关闭 PR / 删分支
- DB 是新文件 `./data/voting.sqlite`，删文件即清空
- 无 feature flag（首个 STORY，没有要 toggle 的旧路径）
- 后续 STORY 若要回退到 STORY-001 状态：`git revert` 后续 STORY 合并 commit + 删 `./data/voting.sqlite`

## Open Questions（留给 TESTPLAN / dev）

- OQ-1 单测用 `node --test` 还是 `vitest`？★ 默认 `node --test`（零额外依赖）；testplan 决定
- OQ-2 web 端是否引入路由库（react-router）？★ 默认引入（3 个页面已经值得）；dev 阶段定
- OQ-3 是否上 ESLint/Prettier？★ 默认上最简 `@typescript-eslint` + prettier 默认配置

## 接下来做什么

1. ★ `/tunan-testplan PLAN-001` — 出测试计划
2. PLAN 文件停在 unstaged；按 tunan-dev §2.5 在 dev 入口统一 commit
3. `/tunan-prime`

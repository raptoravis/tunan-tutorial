---
id: PRD-001
title: 轻量投票系统 PRD
owner: raptoravis
source_id: REQ-001
status: in_progress
created: 2026-05-13
updated: 2026-05-13
priority: P2
blocked_by: []
---

# PRD-001 — 轻量投票系统

## Background

源自 REQ-001。痛点：团队/朋友群组常需要对开放主题（周末旅游目的地、午饭去哪）快速收集大家偏好，微信群接龙不直观、第三方工具（Doodle、问卷星）过重。我们要一个 **登录-free、轻量、可分享链接** 的 web 投票工具。

## Personas

- **P1 创建者 Cathy**：发起投票（"周五午饭吃什么"），列出 3-5 个候选，把链接发到群里
- **P2 投票者 Vince**：点开链接，投一票，看到当前结果

## Functional Requirements

### FR-1 创建投票
- 创建页：标题（必填，≤80 字）、候选项数组（≥2，每项 ≤40 字）
- 提交后跳转到投票页 `/v/<vote-id>`，同时显示 share 链接（即当前 URL）
- `vote-id` 用短 base62 随机串（8 位足够）

### FR-2 投票
- 投票页展示：标题、候选项列表（含当前票数 + 占比进度条）、提交按钮
- 单选（按 ★ 默认 Q2）
- 已投状态：本地 localStorage 记 `voted:<vote-id> = <option-idx>`；服务端 cookie 记 session token；二者任一命中即视为已投，前端 disable 投票按钮显示"你已投：<option>"
- 投票请求服务端校验 session cookie 内是否已投该 vote-id；已投则 409

### FR-3 查看结果
- 投票页底部即结果区（同页）：每个候选项一行，候选项名 + 票数 + 占比 + 横向进度条
- 前端每 5s 轮询一次 `GET /api/votes/:id` 拿最新票数（如 visibilitychange 后立即刷一次）

### FR-4 关闭投票
- 创建者本地 localStorage 保存 `owner:<vote-id> = <admin-token>`（创建时由服务端下发）
- 投票页右上角若 localStorage 含 admin-token 则显示"关闭投票"按钮
- 关闭后 vote 的 `closed_at` 写入；新投票请求返回 400

## Non-Functional Requirements

- **NFR-1 性能**：投票/查询 API p99 < 200ms（SQLite，单实例）
- **NFR-2 可访问性**：WCAG AA 基线（语义化、键盘可达、对比度 4.5:1）
- **NFR-3 浏览器兼容**：Chrome / Edge / Safari 最近 2 个大版本
- **NFR-4 数据**：SQLite 单文件持久化；进程重启数据不丢
- **NFR-5 部署**：本地 `pnpm -F server dev` + `pnpm -F web dev` 即可联调

## Architecture

- **Monorepo**：pnpm workspaces，包：`apps/server`（Hono + SQLite via `better-sqlite3` 或 `node:sqlite`）、`apps/web`（Vite + React + TypeScript）
- **Storage**：SQLite，两张表 `votes(id, title, admin_token, closed_at, created_at)`、`vote_options(vote_id, idx, label, count)`、`vote_sessions(vote_id, session_token, option_idx, voted_at)`
- **API**：
  - `POST /api/votes` { title, options[] } → { id, admin_token }
  - `GET /api/votes/:id` → { id, title, options:[{idx, label, count}], closed, you_voted_idx? }
  - `POST /api/votes/:id/cast` { option_idx } → 200/409
  - `POST /api/votes/:id/close` { admin_token } → 200/403
- **前端路由**：`/`（创建）、`/v/:id`（投票/结果）

## Acceptance (验收级 AC，源自 REQ Goals)

- AC-1 创建者可在 ≤30s 内完成「输入标题 + 3 候选 → 提交 → 拿到链接」
- AC-2 投票者点开链接后 ≤2 次点击完成投票，并立即看到自己一票计入
- AC-3 同一浏览器对同一投票无法投第二次（按钮 disabled + API 409）
- AC-4 创建者关闭投票后，他人再尝试投票收到 API 400 + 前端友好提示
- AC-5 服务端重启后数据保留（SQLite 持久化验证）

## Decisions（PRD 阶段已采纳）

| 决策 | 选择 | 来源 |
|---|---|---|
| 候选项动态新增 | 否（仅创建者预设） | REQ Q1 ★默认 |
| 单选 vs 多选 | 单选 | REQ Q2 ★默认 |
| 截止时间 | 无（手动关闭） | REQ Q3 ★默认 |
| 防重投强度 | localStorage + session cookie 弱校验 | REQ Q4 ★默认 |
| 后端技术栈 | Node 20 + Hono + node:sqlite | PRD A1 ★默认 |
| 前端技术栈 | Vite + React + TypeScript | PRD A1 ★默认 |
| 单包结构 | pnpm monorepo (apps/server + apps/web) | PRD A1 ★默认 |
| 实时更新 | 5s 轮询 | REQ G-003 + Non-Goals |

## Risks

- **R1** SQLite 并发写：单实例足够，多投票者同时投会被 SQLite 串行化，p99 仍在阈内
- **R2** 防重投弱校验易被清缓存绕过：sponsor 已知晓，接受现状
- **R3** vote-id 短串碰撞：8 位 base62 = 218T 空间，可忽略

## Non-Goals（继承 REQ）

账号系统、富权限、WebSocket 推送、移动端原生、富文本/图片候选项、高级图表。

## Open Questions

无 blocking；剩余决策推到 STORY 阶段（如分页 UI、错误提示文案）。

## 接下来做什么

由 pipeline 接管推进到 STORY 拆分阶段。

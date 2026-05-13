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

来源 REQ-001：朋友/同事小团体里频繁出现"今天中午吃什么"、"周末去哪玩"这类临时决策；用群消息接龙易丢失统计、易刷屏。需要一个轻量 Web 系统，进入即用、无需注册，分享链接即可投票看结果。

## Personas

- **P1 发起人 Alice** — 想快速创建一个主题 + 列几个候选项，把链接丢群里
- **P2 投票人 Bob** — 点链接、输昵称、选一项、看结果，不想注册任何账号
- **P3 围观者 Carol** — 只想看结果，不一定投票

## Functional Requirements

### FR-1 创建投票（覆盖 REQ-001 G-001）
- FR-1.1 POST `/api/polls` 入参 `{ title: string, options: string[] }`
- FR-1.2 校验：`title` 非空且 ≤ 100；`options.length ∈ [2, 20]`；每个 option ≤ 50 字符且互不相同
- FR-1.3 返回 `{ id: string, url: string }`，id 用短随机串（8 字符 base62）便于分享
- FR-1.4 前端：首页"创建投票"表单，提交后跳到投票页

### FR-2 投票（覆盖 G-002）
- FR-2.1 POST `/api/polls/:id/votes` 入参 `{ voter: string, optionId: string }`
- FR-2.2 `voter` 非空 ≤ 30 字符
- FR-2.3 同 `(pollId, voter)` 已存在 → 更新已有票（覆盖语义），不新增行
- FR-2.4 返回当前用户已投的 optionId
- FR-2.5 前端：投票页显示昵称输入框 + 单选选项 + 提交按钮；已投状态高亮

### FR-3 查看结果（覆盖 G-003）
- FR-3.1 GET `/api/polls/:id` 返回 `{ id, title, options: [{id, text, count}], totalVotes }`
- FR-3.2 前端：结果区实时显示在投票页同屏（不分两页），每个选项展示票数 + 百分比 + 进度条
- FR-3.3 投票成功后自动刷新结果（前端 re-fetch）

### FR-4 多投票并存（覆盖 G-004）
- FR-4.1 不同 pollId 数据隔离
- FR-4.2 首页可选展示"最近创建的投票"列表（可选实现，标 nice-to-have）

## Non-Functional Requirements

- **NFR-1 性能** — 单实例支撑 ≤ 100 并发投票请求；API p95 < 200ms（本地 SQLite）
- **NFR-2 可访问性** — 表单元素带 label；键盘可完成全流程（tab/enter）；不强制 WCAG AAA
- **NFR-3 可观测** — 关键操作（create/vote）console.log 即可，不接 APM
- **NFR-4 兼容性** — 现代浏览器（Chrome/Edge/Firefox 最新两版）；不兼容 IE
- **NFR-5 安全** — 输入做 HTML 转义防 XSS；不防 CSRF（无登录）；不防刷票
- **NFR-6 持久化** — SQLite 单文件；重启后数据不丢

## Decisions

| # | 决策 | 取值 | 来源 |
|---|---|---|---|
| D1 | 部署形态 | Web 应用（前后端分离） | REQ Q1 ★ 默认 |
| D2 | 身份标识 | 昵称（每次填，可由前端 localStorage 缓存） | REQ Q2 ★ 默认 + 优化 |
| D3 | 场景区分 | 通用投票，旅游/午饭只是 title 差异 | REQ Q3 ★ 默认 |
| D4 | 持久化 | SQLite 单文件 | REQ Q4 ★ 默认 |
| D5 | 优先级 | P2 | REQ Q5 ★ 默认 |
| D6 | 技术栈后端 | Node 20 + Hono | pipeline 内置 ★ 默认（见 tunan-pipeline 闭口总则） |
| D7 | 技术栈前端 | Vite + React + TypeScript | 同上 |
| D8 | 测试 | vitest（前后端共用） | 同上 |

## Risks

- **R1** 同昵称二次投造成"误覆盖"：A 用了 B 的昵称会顶掉 B 的票 → 接受（Non-Goal 中已声明不防刷票，UI 提示"昵称用过会覆盖之前的票"）
- **R2** SQLite 并发写锁：100 并发投票下 WAL 模式足够，验收用 NFR-1 阈值兜底
- **R3** option id 设计：用 server 生成的 uuid，避免前端伪造提交不存在的 optionId

## Acceptance Criteria（聚合）

承袭 REQ-001 G-001..G-004 的 AC，并补充：

- [ ] AC-PRD-1 `npm run dev` 起前后端两个端口，浏览器访问首页可见"创建投票"
- [ ] AC-PRD-2 端到端：创建一个投票 → 拿到分享链接 → 新窗口打开链接 → 投票 → 同屏看到结果更新
- [ ] AC-PRD-3 同昵称重复投不同选项 → 票数为 1（覆盖语义）
- [ ] AC-PRD-4 选项数 < 2 或 > 20 → API 返回 400 + 错误消息
- [ ] AC-PRD-5 全流程键盘可达（tab + enter）

## Open Questions

无 blocking；STORY 阶段细化。

## Out of Scope

- 投票截止时间
- 多选 / 排序 / 加权
- 用户账号
- 管理员后台
- 移动 native app

## 接下来做什么

由 pipeline 自动衔接 `/tunan-story PRD-001`。

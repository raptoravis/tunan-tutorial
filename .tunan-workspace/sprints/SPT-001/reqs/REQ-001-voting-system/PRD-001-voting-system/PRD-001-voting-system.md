---
id: PRD-001
title: 多场景投票系统 PRD
owner: raptoravis
source_id: REQ-001
status: in_progress
created: 2026-05-13
updated: 2026-05-13
priority: P2
blocked_by: []
---

# PRD-001 — 多场景投票系统

## Background

源自 REQ-001：sponsor 想要一个轻量级投票工具，覆盖小群体决策场景（如旅游目的地、午饭吃什么）。技术栈对齐 tunan-tutorial 仓库：Node + Hono（后端）+ Vite + React（前端）+ SQLite（持久化）。MVP 不做账号/鉴权，靠昵称 + 浏览器本地 id 区分参与者。

## Personas

- **P1 主题发起人**：在小群里被推举出来"定个事"的人。需求：快速建一个主题、贴几个选项、分享 URL。
- **P2 投票参与者**：群成员。需求：打开 URL → 看选项 → 选一个 → 看结果。期望操作 ≤ 3 步。

## Functional Requirements

- **FR-001 创建主题**（对应 G-001）
  - POST `/api/topics` 接受 `{ title, options: string[] }`
  - 校验：title 非空且 ≤100 字符；options ≥2 且每项 ≤50 字符；options 去重后数量不能减少
  - 返回 `{ id, title, options: [{id, label}], created_at }`

- **FR-002 列出主题**（对应 G-004）
  - GET `/api/topics` 返回 `[{ id, title, total_votes, created_at }]`
  - 按 `created_at` 倒序

- **FR-003 查看主题详情 + 结果**（对应 G-003）
  - GET `/api/topics/:id` 返回 `{ id, title, options: [{id, label, votes, percent}], total_votes }`
  - options 按 votes 倒序

- **FR-004 提交投票**（对应 G-002）
  - POST `/api/topics/:id/votes` 接受 `{ option_id, voter_id }`
  - voter_id = 前端生成的 UUID（localStorage 持久化）
  - 同一 voter_id 对同一 topic 已投 → 返回 409 Conflict
  - 选项不属于该主题 → 返回 400

- **FR-005 前端页面**
  - `/` 主题列表（含"新建主题"按钮）
  - `/topics/new` 创建表单
  - `/topics/:id` 投票 + 结果合一页（未投票显示选项可点击；已投票显示结果柱状图 / 百分比）

## Non-Functional Requirements

- **性能**：本地开发环境下 API p99 < 100ms（SQLite 单文件，无并发压力）
- **可访问性**：表单元素有 label，投票按钮键盘可达；不做 WCAG AA 完整合规
- **可观测**：后端用 `console.log` 打 request log（教学项目，无需结构化日志）
- **兼容性**：Chrome / Edge / Firefox 最新版即可，不考虑 IE / 老 Safari
- **持久化**：SQLite 文件落在 `server/data/voting.db`，启动时自动建表
- **安全**：不做 CSRF / rate limit（MVP 教学项目，受信群体内使用）

## Data Model

```
topics(id TEXT PK, title TEXT, created_at TEXT)
options(id TEXT PK, topic_id TEXT FK, label TEXT, position INT)
votes(id TEXT PK, topic_id TEXT FK, option_id TEXT FK, voter_id TEXT, created_at TEXT,
      UNIQUE(topic_id, voter_id))
```

## Risks

- **R-001 voter_id 易伪造**（清 localStorage 就能再投）→ 接受（MVP 教学，群体内自律）
- **R-002 没有 topic 删除/编辑** → 接受（v2 再说）
- **R-003 SQLite 文件并发写** → 接受（教学项目无高并发）

## Open Questions

无。

## Decisions

| 决议点 | 选择 | 来源 |
|---|---|---|
| 鉴权 | 不做，用 localStorage UUID 当 voter_id | REQ-001 Non-Goals |
| 投票模式 | 单选 | REQ-001 Non-Goals |
| 技术栈 | Node + Hono + Vite + React + SQLite | REQ-001 Constraints |
| 部署 | 本地 dev only，不打包发布 | 教学项目 |

## 接下来做什么

1. ★ `/tunan-story PRD-001` — 拆 STORY

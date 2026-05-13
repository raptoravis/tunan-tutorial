---
id: STORY-001
title: MVP 端到端 — 创建单选投票、投票、看结果
owner: raptoravis
source_id: PRD-001
status: in_progress
created: 2026-05-13
updated: 2026-05-13
priority: P2
estimate: M
blocked_by: []
pre_auth:
  by: raptoravis
  at: 2026-05-13T00:00:00Z
  scope: [tdd_red_gate, pr_lgtm]
---

# STORY-001 — MVP 端到端（单选）

**As a** 发起人 Alice（P-A） 和 参与者 Bob（P-B），
**I want** 一个最小可用的投票工具：能创建一个单选话题、拿到分享链接、让其他人投票并看到聚合结果，
**So that** 我们能验证整套链路是否走得通，再往上加多选/防重/截止/模板等增量。

## 范围

- 数据 schema：polls / options / votes
- API：`POST /api/polls`、`GET /api/polls/:id`、`POST /api/polls/:id/vote`
- 前端：`/new` 创建页（仅单选） / `/p/:id` 投票+结果页
- 基础 a11y：`<label for>`、键盘 tab、结果区 `aria-live="polite"`

**不包含**（留给后续 STORY）：多选 / cookie 去重 / 截止 / 模板首页。

## Acceptance（Given-When-Then）

- **AC-1 创建**
  - Given 我在 `/new`，填了标题 `"周末去哪"` + 2 个选项 `"杭州"`/`"成都"`，
  - When 我点提交，
  - Then 浏览器跳转到 `/p/<id>`，页面顶部显示完整分享链接 + 复制按钮，且该 id 形如 8 位 base62。

- **AC-2 校验**
  - Given 标题为空 或 只有 1 个选项，
  - When 我点提交，
  - Then 前端给出明确错误，且未发出网络请求；若绕过前端直接打 API，服务端返回 400 + `{ error: "validation_failed", field: ... }`。

- **AC-3 投票**
  - Given 我打开 `/p/<id>`，话题有 2 个选项，
  - When 我点中一个选项并提交，
  - Then 页面切换为结果视图（无需手动刷新），显示每个选项的票数 + 百分比，按票数倒序。

- **AC-4 结果**
  - Given 已有 3 票（A:2, B:1），
  - When 任意人 GET `/p/<id>`，
  - Then 看到 A 在 B 上方，A 显示 `2 (67%)`，B 显示 `1 (33%)`，总票数 `3`。

- **AC-5 a11y**
  - Given 我用键盘 tab 进入投票页，
  - When 我用方向键/Tab 在选项间移动并按 Enter 提交，
  - Then 全流程可达；结果区被读屏识别为 live region。

## Dependencies

无（依赖图根节点）。

## Notes

- 短码生成：`base62(crypto.randomBytes(6))` 截取前 8 位；建议有 unique index 兜底
- 数据库连接采用 `node:sqlite` 或 `better-sqlite3`（PLAN 阶段定）

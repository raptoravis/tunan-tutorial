---
id: STORY-002
title: 投票 + 改票 + 弱去重
owner: raptoravis
kind: feature
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: PRD-001
priority: P0
blocked_by: [STORY-001]
estimate: M
---

# STORY-002: 投票 + 改票 + 弱去重

## As a / I want / So that
- **As a** 参与者
- **I want** 打开参与链接后能选一个候选项并提交，截止前可以改票
- **So that** 我能让群体决策反映我的真实选择

## Acceptance Criteria（Given-When-Then）
- [ ] **Given** 投票未截止 **When** POST `/api/polls/<id>/vote` with `{ optionId, nickname? }` **Then** 返回 200 + 当前我的投票，`votes` 表写入一行（按 session 关联）
- [ ] **Given** 我已投过票（同浏览器） **When** 再次 POST `/api/polls/<id>/vote` with 另一个 optionId **Then** 返回 200 + 我的最新投票，`votes` 表更新（仍是一行）
- [ ] **Given** 参与页加载 **When** 未持有 session cookie **Then** 服务端写入 HttpOnly cookie（含 sessionId，≥128 bit 随机）
- [ ] **Given** 我清了 cookie 后再访问 **When** 投票 **Then** 视为新参与者（接受弱去重泄漏）
- [ ] **Given** 我已投过 **When** GET `/v/<id>` **Then** 我的选项被高亮（"已选"状态）

## Dependencies
- STORY-001（需要创建投票 API 与参与页骨架）

## 接下来做什么
1. ★ `/tunan-plan STORY-002`

---
id: STORY-003
title: 查看投票详情页（GET API + 投票页骨架）
owner: raptoravis
source_id: PRD-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P2
estimate: S
blocked_by: [STORY-002]
---

# STORY-003 — 查看投票详情

## As-a / I-want / So-that

- **As a** 投票人 Bob
- **I want** 点开分享链接 `/poll/<id>` 看到投票标题和所有选项
- **So that** 我能决定投哪个

## Acceptance（Given-When-Then）

- **AC-1** Given 一个已存在的投票
  When `GET /api/polls/:id`
  Then 返回 `{ id, title, options: [{id, text, count: 0}], totalVotes: 0 }`，状态 200
- **AC-2** Given 不存在的 pollId
  When `GET /api/polls/:id`
  Then 返回 404
- **AC-3** Given 投票页 `/poll/<id>`
  When 页面加载
  Then 调用 GET API，渲染标题 + 选项列表（带 radio 但暂不可投）；显示"加载中"骨架直到 fetch 完成
- **AC-4** 加载失败（404）时显示 "找不到这个投票"

## Dependencies

- 依赖 STORY-002 的 polls 表 + 创建链路

## Out of Scope

- 投票提交（STORY-004）
- 结果展示（STORY-005）

---
id: STORY-005
title: 结果展示（票数 + 百分比 + 进度条）
owner: raptoravis
source_id: PRD-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P2
estimate: S
blocked_by: [STORY-004]
---

# STORY-005 — 结果展示

## As-a / I-want / So-that

- **As a** 投票人 / 围观者
- **I want** 在投票页同屏看到每个选项的当前票数、百分比、进度条
- **So that** 我能感知当前局势 / 选出最受欢迎的结果

## Acceptance（Given-When-Then）

- **AC-1** Given GET `/api/polls/:id`（STORY-003 已建）
  When 调用
  Then 每个 option 含 `count` 字段（=该 option 的总票数），返回顶层 `totalVotes`
- **AC-2** Given 投票页
  When 页面加载或投票成功
  Then 每个选项行右侧展示 `<count> 票 (<percent>%)`，下方一条进度条宽度 = percent
- **AC-3** Given 总票数 0
  When 渲染
  Then 进度条宽度 0，百分比显示 0%（不出 NaN）
- **AC-4** Given 用户投票成功
  When response 回来
  Then 前端立即 re-fetch GET 接口刷新结果（不刷新整页）
- **AC-5** 进度条使用语义化 `<progress>` 或 `role="progressbar"` 带 aria-value（NFR-2 a11y）

## Dependencies

- 依赖 STORY-004 的投票提交（票数才会变）

## Out of Scope

- WebSocket 推送（首版只前端 re-fetch；多人同屏的实时性接受秒级延迟）
- 历史趋势图

---
id: STORY-003
title: 投票 + 查看结果
owner: raptoravis
source_id: PRD-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P0
estimate: M
blocked_by: [STORY-002]
---

# STORY-003 — 投票 + 查看结果

## User Story

- **As a** 投票参与者
- **I want** 进入主题页，选一个选项投出去，并看到当前结果
- **So that** 群里能基于得票数决定去哪玩 / 吃什么

## Acceptance Criteria (Given-When-Then)

- **AC-001 详情 + 结果 API**
  - Given 一个 topic 已创建
  - When `GET /api/topics/:id`
  - Then 返回 `{ id, title, options: [{ id, label, votes, percent }], total_votes }`
  - And options 按 votes 倒序，percent 为整数百分比（总数为 0 时 percent=0）

- **AC-002 投票 API**
  - Given 一个 topic 与其下的 option_id
  - When `POST /api/topics/:id/votes` body=`{ option_id, voter_id }`
  - Then 返回 201
  - And `votes` 表新增一行，`(topic_id, voter_id)` 唯一

- **AC-003 重复投票拒绝**
  - Given 同一 voter_id 已对该 topic 投过
  - When 再次 POST 投票
  - Then 返回 409 + `{ error: "already voted" }`

- **AC-004 非法选项拒绝**
  - Given option_id 不属于该 topic
  - When POST 投票
  - Then 返回 400 + `{ error: "invalid option" }`

- **AC-005 前端投票页**
  - Given 打开 `/topics/:id`，本地 voter_id 未对该主题投过
  - When 点选项 → 点 "Submit"
  - Then 页面切换到结果视图（柱状图 / 百分比）
  - And 刷新页面后仍然看到结果（voter_id 在 localStorage）

- **AC-006 前端结果页**
  - Given 已投票
  - When 打开 `/topics/:id`
  - Then 直接显示结果（每项 label + 票数 + 百分比 + 简单 bar）

## Dependencies

- STORY-002（topic / options 已能创建）

## Notes

- voter_id 在前端 `localStorage["voter_id"]` 缺失时生成 `crypto.randomUUID()`
- 结果柱状图用纯 CSS（width: percent%）足矣，不引图表库

---
id: STORY-004
title: 提交投票（POST API + 覆盖语义 + 单选 UI）
owner: raptoravis
source_id: PRD-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P2
estimate: M
blocked_by: [STORY-003]
---

# STORY-004 — 提交投票

## As-a / I-want / So-that

- **As a** 投票人 Bob
- **I want** 在投票页填个昵称，选一个选项，点"投票"
- **So that** 我的选择被记录；如果选错了重投会覆盖之前那一票

## Acceptance（Given-When-Then）

- **AC-1** Given 投票页 + 昵称 "bob" + 选 optionA
  When 点 "投票"
  Then `POST /api/polls/:id/votes` 入参 `{voter:"bob", optionId:"<A>"}`，返回 200 + `{votedOptionId:"<A>"}`
- **AC-2** Given bob 已投 A
  When bob 再点 B 提交
  Then DB votes 表中 `(pollId, voter="bob")` 行被 update 为 optionId=B（不新增行）
- **AC-3** Given API
  When voter 为空 / > 30 字符 / optionId 不属于该 poll
  Then 返回 400
- **AC-4** Given API
  When pollId 不存在
  Then 返回 404
- **AC-5** 前端：昵称输入框；选项单选 radio；提交按钮在昵称 + 选项都填了才 enabled；提交中 disabled 防双击
- **AC-6** 前端：昵称提交成功后写入 localStorage，下次进任意投票页自动填充
- **AC-7** 已投后页面显示 "你投了：<optionText>"

## Dependencies

- 依赖 STORY-003 的详情页

## Out of Scope

- 实时票数展示（STORY-005）
- 多选 / 排序

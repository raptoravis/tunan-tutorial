---
id: STORY-005
title: 发起人凭管理 token 关闭房间或删除候选项
owner: raptoravis
status: done
created: 2026-05-13
updated: 2026-05-13
source_id: PRD-001
priority: P2
estimate: S
blocked_by: []
---

# STORY-005 — 房间管理

## User Story

- **As a** 发起人 Aria
- **I want** 凭创建时拿到的管理 token 关闭房间，或在投票期间删掉错误的候选项
- **So that** 我能在团建已定时收尾投票、或者去掉一个写错字的候选项

## Scope

覆盖 PRD-001 FR-7。包含：关闭房间 API + 删除候选项 API + 管理面板入口 + 关闭后投票/追加全部拒绝。**不**包含找回管理 token（Non-Goal）。

## Acceptance (Given-When-Then)

- **AC-1** Given 持有正确管理 token 的发起人
  When POST `/api/rooms/<room-id>/close` 携带 token
  Then 房间 `closed_at` 写入当前时间；GET 仍可读但不再接受投票 / 追加
- **AC-2** Given 已关闭房间
  When 任意参与者尝试 POST 投票或 POST 追加候选项
  Then 服务端返回 410，前端按钮置灰且文案改成"投票已结束"
- **AC-3** Given 正确管理 token
  When DELETE `/api/rooms/<room-id>/options/<option-id>` 携带 token
  Then 该候选项被软删除（或硬删除，PLAN 决定）；已投该项的票一并撤销
  And 实时刷新让所有页面在 ≤ 2 秒内看到列表更新
- **AC-4** Given 错误 / 缺失的管理 token
  When 关闭 or 删除候选项请求到达
  Then 服务端返回 403，不暴露"token 是否存在"差异（统一错误）
- **AC-5** Given 关闭房间或删除候选项操作
  When 操作成功
  Then 服务端写一条结构化日志（含 room_id，不含 token 明文）
- **AC-6** Given 发起人不在创建后立即操作
  When 后续打开 `/r/<room-id>/admin?token=<token>` 或在管理面板填 token
  Then 验证通过后展示管理动作按钮

## Dependencies

- STORY-002（投票身份 + 路由基础）

## Notes

- 管理 token 验证用常数时间比较 + 服务端按房间存储 hash（参考 PRD-001 NFR-3）
- 删除候选项的"撤销已投票"语义可能让票数瞬时下降，前端要避免负数闪烁（PLAN 关注）

---
id: STORY-004
title: 参与者可在允许追加的房间内添加新候选项
owner: raptoravis
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: PRD-001
priority: P2
estimate: S
blocked_by: []
---

# STORY-004 — 参与者追加候选项

## User Story

- **As a** 参与者 Bo
- **I want** 在房间开启「允许追加」时输入一个新选项并把它加进候选列表
- **So that** 我能补上发起人遗漏的选项（比如多了一家新餐厅）

## Scope

覆盖 PRD-001 FR-4。包含：追加候选项 API + UI 入口 + 去重 + 实时可见。**不**包含发起人删除（STORY-005）。

## Acceptance (Given-When-Then)

- **AC-1** Given 房间 `allow_add == true` 且未关闭
  When 任意参与者在投票页输入新候选项文本并提交
  Then 候选项被持久化；该房间所有打开页面在 ≤ 2 秒内看到新选项（依赖 STORY-003 的实时机制）
- **AC-2** Given 房间 `allow_add == false`
  When 参与者打开投票页
  Then 不展示"+ 添加候选项"入口；即便手动 POST 追加 API，服务端返回 403
- **AC-3** Given 已有同名候选项（去除前后空白后 case-insensitive 相等）
  When 追加请求到达
  Then 服务端拒绝（4xx）+ 中文提示"已存在"；前端展示该提示，不重复创建
- **AC-4** Given 新候选项文本超过 80 字符
  When 追加请求到达
  Then 服务端返回 400 + 长度上限提示
- **AC-5** Given 房间已被关闭（closed_at 非空）
  When 追加请求到达
  Then 服务端返回 410（已关闭），前端入口也应隐藏

## Dependencies

- STORY-002（投票身份 / 房间访问）
- STORY-003（实时刷新机制 — 让新追加项立即可见）

## Notes

- 谁追加了哪项**不**记名（参与者匿名）；如有反作弊需求另开 REQ
- 前端入口形态（行内输入 vs 弹窗）由 PLAN 决定

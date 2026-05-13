---
id: STORY-002
title: 多选模式
owner: raptoravis
source_id: PRD-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P2
estimate: S
blocked_by: []
pre_auth:
  by: raptoravis
  at: 2026-05-13T00:00:00Z
  scope: [tdd_red_gate, pr_lgtm]
---

# STORY-002 — 多选模式

**As a** 发起人 Alice，
**I want** 在创建时选择"多选"模式，让参与者可以勾选多个选项，
**So that** 类似"哪些餐厅都可接受"这种场景能更如实表达大家意愿。

## 范围

- 创建表单加 mode toggle（`single` / `multi`）
- DB schema 加 `polls.mode`
- API：`POST /api/polls` 接收 `mode`；`POST /vote` 接受 `optionIds: number[]`
- 投票页：mode=multi → `<input type=checkbox>`；至少选 1 项才能提交

## Acceptance

- **AC-1 创建多选** Given 我选了 mode=multi 并提交 3 个选项 / When 创建 / Then DB 中该 poll 的 mode='multi'
- **AC-2 投票多选** Given mode=multi / When 我勾选 2 项提交 / Then 服务端为每个选中项各记一票，结果反映 2 票
- **AC-3 至少 1 项** Given mode=multi / When 我未勾选任何项点提交 / Then 前端阻止 + 后端 400
- **AC-4 单选未受影响** Given STORY-001 的单选场景 / When 不变 / Then 回归通过（mode 缺省='single'）

## Dependencies

- STORY-001（基础 schema/API/前端）

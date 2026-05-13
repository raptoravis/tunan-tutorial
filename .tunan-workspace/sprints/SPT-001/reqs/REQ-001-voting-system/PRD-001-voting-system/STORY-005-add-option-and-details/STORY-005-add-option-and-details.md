---
id: STORY-005
title: 追加候选项 + 公开明细 + a11y/移动端打磨
owner: raptoravis
kind: feature
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: PRD-001
priority: P2
blocked_by: [STORY-003, STORY-004]
estimate: M
---

# STORY-005: 追加候选项 + 公开明细 + a11y/移动端打磨

## As a / I want / So that
- **As a** 参与者
- **I want** 在截止前给投票追加一个新候选项，并（可选）在结果中看到谁投了什么
- **So that** 当初始选项不全时我能补充；社交透明帮助监督群体决策

## Acceptance Criteria（Given-When-Then）
- [ ] **Given** 投票未截止 + 选项数 < 30 **When** POST `/api/polls/<id>/options` with `{ label }` **Then** 返回 201 + 新 option，对所有人可见
- [ ] **Given** 选项数 = 30 **When** POST 新选项 **Then** 返回 409 `options_limit`
- [ ] **Given** 投票已截止 **When** POST 新选项 **Then** 返回 409 `poll_closed`
- [ ] **Given** 创建时勾选了"公开明细" **When** GET `/results` **Then** 返回额外字段 `voters: [{ optionId, nickname }]`（昵称为空时返回 `匿名 #N`）
- [ ] **Given** 创建时未勾选公开明细 **When** GET `/results` **Then** 不返回 `voters` 字段
- [ ] **Given** iPhone SE 视口 (375px) **When** 浏览参与页 **Then** 无横向滚动，触控热区 ≥44px
- [ ] **Given** 仅键盘操作 **When** Tab 浏览参与页 **Then** 可完成 看题 → 选项 → 投票按钮 的整条主流程

## Dependencies
- STORY-003（实时结果需先就绪以承载 voters 字段）
- STORY-004（追加选项需检查"未截止"语义）

## 接下来做什么
1. ★ `/tunan-plan STORY-005`

---
id: STORY-004
title: 截止时间自动关闭 + 创建者管理链接提前关闭
owner: raptoravis
kind: feature
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: PRD-001
priority: P1
blocked_by: [STORY-002]
estimate: S
---

# STORY-004: 截止与提前关闭

## As a / I want / So that
- **As a** 创建者
- **I want** 投票到达截止时间自动关闭，必要时我也可以通过管理链接提前关
- **So that** 群体决策有明确终点，不会无限拖

## Acceptance Criteria（Given-When-Then）
- [ ] **Given** 投票已过截止时间 **When** POST `/api/polls/<id>/vote` **Then** 返回 409 `poll_closed`
- [ ] **Given** 投票已过截止 **When** GET `/v/<id>` **Then** 页面显示"已结束"，无投票 UI
- [ ] **Given** 我持管理 token **When** POST `/api/polls/<id>/close?token=<adminToken>` **Then** 返回 200，poll 立刻标记 closed
- [ ] **Given** 我不持管理 token **When** POST close **Then** 返回 401
- [ ] **Given** 投票已关闭 **When** GET `/v/<id>` **Then** 仍可看最终结果（只读）

## Dependencies
- STORY-002（需要投票流程已经能运行才能验证"关闭后拒绝"）

## 接下来做什么
1. ★ `/tunan-plan STORY-004`

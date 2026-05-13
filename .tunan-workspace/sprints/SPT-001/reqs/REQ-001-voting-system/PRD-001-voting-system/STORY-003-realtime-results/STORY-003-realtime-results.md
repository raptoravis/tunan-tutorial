---
id: STORY-003
title: 实时结果显示（5s 轮询）
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

# STORY-003: 实时结果显示（5s 轮询）

## As a / I want / So that
- **As a** 参与者 / 创建者
- **I want** 在参与页实时看到每个选项的票数和占比
- **So that** 我能感知群体决策的趋势

## Acceptance Criteria（Given-When-Then）
- [ ] **Given** 投票存在 **When** GET `/api/polls/<id>/results` **Then** 返回 `{ totalVoters, options: [{ id, label, count, percent }] }`
- [ ] **Given** 参与页加载 **When** 投票未截止 **Then** 每 5s 自动 GET 一次 `/results` 并更新 DOM
- [ ] **Given** 我刚投票 **When** 等待 ≤5s **Then** 我自己的页面看到票数已 +1
- [ ] **Given** 投票已截止 **When** 参与页加载 **Then** 停止轮询，仅在加载时拉一次最终结果
- [ ] **Given** 总票数 = 0 **When** 显示结果 **Then** 所有选项 0 票 0%（不崩）

## Dependencies
- STORY-002（需要 votes 表有数据）

## 接下来做什么
1. ★ `/tunan-plan STORY-003`

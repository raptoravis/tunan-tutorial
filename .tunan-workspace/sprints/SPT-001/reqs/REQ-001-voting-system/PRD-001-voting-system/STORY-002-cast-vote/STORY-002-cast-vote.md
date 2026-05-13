---
id: STORY-002
title: 投票与改票（单选 + session 防刷）
owner: raptoravis
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: PRD-001
priority: P2
estimate: M
blocked_by: [STORY-001]
---

# STORY-002 投票与改票

**As a** 参与者
**I want** 在投票页选择一项并提交，且能更改我的选择
**So that** 我能表达我的意见，并在改主意时不被锁死

## Given-When-Then

- **AC-002.1**
  - Given 我访问一个有效投票链接
  - When 我选中一个候选项并点提交
  - Then 服务端记录我（按 voter_id cookie，自动颁发）的选择，返回成功

- **AC-002.2**
  - Given 我之前已投票
  - When 我再次进入页面
  - Then 看到我上次的选项被高亮（"你的选择"）

- **AC-002.3**
  - Given 我已投票
  - When 我改选另一项并提交
  - Then 我之前的票被覆盖（总票数不变，只是分布变化），不是叠加

- **AC-002.4**
  - Given 投票已过截止时间
  - When 我尝试提交
  - Then 返回错误 "投票已截止"，不计票

- **AC-002.5**
  - Given 我没选任何项
  - When 点提交
  - Then 前端拦截，提示"请选择一项"

- **AC-002.6**
  - Given 投票链接 ID 不存在
  - When 我访问
  - Then 返回 404

## Dependencies

- STORY-001（需要先能创建投票）

## Out of scope

- 票数实时显示（STORY-003）；本 STORY 只需返回成功 + 自身选项高亮即可

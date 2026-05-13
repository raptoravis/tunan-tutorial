---
id: STORY-001
title: 创建投票（标题 + 候选项 + 可选截止时间）
owner: raptoravis
status: in_progress
created: 2026-05-13
updated: 2026-05-13
source_id: PRD-001
priority: P2
estimate: M
blocked_by: []
---

# STORY-001 创建投票

**As a** 发起人
**I want** 输入标题与 2..10 个候选项（可选截止时间）来创建一个投票
**So that** 我能拿到一条可分享的链接发给团队

## Given-When-Then

- **AC-001.1**
  - Given 我访问 `/`
  - When 我填入标题 "中饭吃啥" + 3 个候选项 + 不填截止时间，点击创建
  - Then 我被重定向到 `/p/<nanoid>`，看到投票标题与候选项

- **AC-001.2**
  - Given 我只填了 1 个候选项
  - When 我点击创建
  - Then 看到错误提示 "至少需要 2 个候选项"，未创建

- **AC-001.3**
  - Given 我填了 11 个候选项
  - When 我点击创建
  - Then 看到错误提示 "最多 10 个候选项"

- **AC-001.4**
  - Given 我填的标题长度超过 100 字
  - When 提交
  - Then 看到长度超限错误

- **AC-001.5**
  - Given 创建成功
  - Then 浏览器收到一个 `owner_token` cookie（HttpOnly + SameSite=Lax），后续 STORY-005 会用到

- **AC-001.6**
  - Given 我设置了截止时间 = 当前时间 + 1h
  - When 创建
  - Then 投票详情页显示倒计时

## Dependencies

无（依赖图根节点）

## Out of scope（属于其它 STORY）

- 投票动作 → STORY-002
- 实时结果计算与展示 → STORY-003
- 模板按钮 → STORY-004
- 删除投票 → STORY-005

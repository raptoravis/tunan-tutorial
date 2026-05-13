---
id: STORY-005
title: 创建者删除投票（owner_token + 二次确认）
owner: raptoravis
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: PRD-001
priority: P2
estimate: S
blocked_by: []
---

# STORY-005 创建者删除

**As a** 发起人
**I want** 凭创建时拿到的 owner_token 删除自己创建的投票
**So that** 错建 / 不再需要的投票可以清掉

## Given-When-Then

- **AC-005.1**
  - Given 我是创建者（持有 owner_token cookie）
  - When 我在投票页看到 "删除" 按钮
  - Then 按钮可见；非创建者看不到该按钮

- **AC-005.2**
  - Given 我点击 "删除" 按钮
  - Then 弹出二次确认对话框

- **AC-005.3**
  - Given 我在确认框点确认
  - Then 服务端验证 owner_token 后删除该投票及其所有票，重定向到首页

- **AC-005.4**
  - Given 投票已被删除
  - When 任意访问者打开旧链接
  - Then 返回 404

- **AC-005.5**
  - Given 我手上没有 owner_token cookie（伪造请求）
  - When 调用 DELETE API
  - Then 返回 403

## Dependencies

- STORY-001（owner_token 在创建时颁发）

## Out of scope

- 软删除 / 恢复投票
- 多创建者授权

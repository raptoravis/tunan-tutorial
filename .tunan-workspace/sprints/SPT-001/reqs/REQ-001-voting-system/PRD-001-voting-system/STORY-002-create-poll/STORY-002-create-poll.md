---
id: STORY-002
title: 创建投票（API + 首页表单 + DB schema）
owner: raptoravis
source_id: PRD-001
status: done
created: 2026-05-13
updated: 2026-05-13
priority: P2
estimate: M
blocked_by: [STORY-001]
---

# STORY-002 — 创建投票

## As-a / I-want / So-that

- **As a** 发起人 Alice
- **I want** 在首页填一个标题 + 几个选项（≥2），提交后拿到一个分享链接
- **So that** 我可以把链接发到群里让大家投票

## Acceptance（Given-When-Then）

- **AC-1** Given 首页
  When 输入 title "今天中午吃什么" + 选项 ["麻辣烫", "盖饭", "沙县"]，点击 "创建"
  Then 跳转到 `/poll/<id>`，url 中的 id 是 8 字符 base62 短串
- **AC-2** Given API
  When `POST /api/polls` 入参合法
  Then 返回 201 + `{ id, url }`；数据库新增 1 行 polls + N 行 options
- **AC-3** Given API
  When `options.length < 2` 或 `> 20`
  Then 返回 400 + 错误消息
- **AC-4** Given API
  When `title` 为空或 > 100 字符
  Then 返回 400
- **AC-5** Given API
  When 任意 option 文本为空或 > 50 或选项内重复
  Then 返回 400
- **AC-6** 前端：选项输入框支持动态添加 / 删除（初始 2 个），选项数到 20 后"加"按钮禁用

## Dependencies

- 依赖 STORY-001 的脚手架

## Out of Scope

- 投票主题列表页
- 截止时间

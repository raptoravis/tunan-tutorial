---
id: STORY-001
title: 发起人能创建投票房间并拿到分享链接
owner: raptoravis
status: done
created: 2026-05-13
updated: 2026-05-13
source_id: PRD-001
priority: P1
estimate: M
blocked_by: []
---

# STORY-001 — 创建投票房间

## User Story

- **As a** 发起人 Aria
- **I want** 在 Web 表单中填入标题、若干候选项，点击「创建」拿到一条房间链接
- **So that** 我能把链接发给同事 / 朋友，开始一次投票

## Scope

本 STORY 包含项目脚手架 + SQLite schema + 创建房间端到端（DB → API → UI），是后续所有 STORY 的依赖根。

覆盖 PRD-001 FR-1（创建）+ FR-6（持久化基础设施）+ FR-7.1 一部分（保留 admin token，但关闭逻辑留给 STORY-005）。

## Acceptance (Given-When-Then)

- **AC-1** Given 浏览器打开 `/`
  When 填入标题（如"周五去哪团建"）+ 至少 2 个候选项，点「创建」
  Then 页面跳到成功页，展示房间链接 `/r/<room-id>` 与管理 token，链接可一键复制
- **AC-2** Given 创建表单
  When 标题为空 / 候选项不足 2 个 / 候选项有空白项
  Then 提交按钮置灰或服务端返回 400，页面给中文错误提示
- **AC-3** Given 标题超长（>120 字符）或候选项超长（>80 字符）
  When 提交
  Then 服务端返回 400，前端文案明确指出哪个字段超长
- **AC-4** Given 一次成功创建
  When 重启服务后再 GET `/api/rooms/<room-id>`（或访问 `/r/<room-id>`）
  Then 返回 200 且数据完整（房间、候选项不丢）
- **AC-5** Given 创建时勾选 / 不勾选「允许追加候选项」
  When 提交
  Then 服务端 room 记录的 `allow_add` 字段对应为 true / false（用 GET 校验）

## Dependencies

- 无（这是根节点）

## Notes

- 管理 token 仅在创建成功页一次性展示；其它接口不返回明文
- 投票相关 UI（勾选 / 提交 / 结果展示）不在本 STORY，只占位"敬请期待"或留到 STORY-002

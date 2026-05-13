---
id: STORY-005
title: 首页内置示例模板（旅游 / 午餐）
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

# STORY-005 — 首页示例模板

**As a** 发起人 Alice（第一次到访），
**I want** 首页有"去哪旅游"和"中饭吃什么"两个一键填充按钮，
**So that** 我不用从零想标题与选项，30 秒就能起一个投票。

## 范围

- 路由 `/` 渲染首页：title + 简介 + 两个大按钮 + 一个"自定义创建"链接
- 点击按钮 → 跳 `/new?template=travel` 或 `/new?template=lunch`，创建页根据参数预填标题与典型 3-5 个选项
- 预填内容可被发起人编辑后提交

## 模板内容（pre-auth 默认）

- **travel**：标题 `"周末去哪玩？"`，选项 `["杭州", "成都", "厦门", "西安"]`
- **lunch**：标题 `"中饭吃什么？"`，选项 `["麻辣烫", "盖浇饭", "兰州拉面", "便利店"]`

## Acceptance

- **AC-1 首页可见** Given GET `/` / Then 看到两个模板按钮和"自定义创建"
- **AC-2 模板预填** Given 点击"去哪旅游" / When 跳到 /new?template=travel / Then 标题与 4 个选项已预填
- **AC-3 可编辑** Given 预填后 / When 改标题或编辑选项再提交 / Then 创建成功并用编辑后的值
- **AC-4 未知模板回退** Given /new?template=foo（未知值）/ Then 退化为空白创建页（不报错）

## Dependencies

- STORY-001（创建页存在 + API 可用）

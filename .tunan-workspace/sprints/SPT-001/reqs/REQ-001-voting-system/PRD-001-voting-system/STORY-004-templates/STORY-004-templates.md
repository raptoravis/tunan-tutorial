---
id: STORY-004
title: 创建页模板按钮（旅游目的地 / 中饭吃啥）
owner: raptoravis
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: PRD-001
priority: P2
estimate: S
blocked_by: []
---

# STORY-004 模板预填

**As a** 发起人
**I want** 在创建页有两个一键模板按钮（"旅游目的地"、"中饭吃啥"）
**So that** 我能省去敲示例选项的时间

## Given-When-Then

- **AC-004.1**
  - Given 我在创建页
  - When 我点击 "中饭吃啥" 模板按钮
  - Then 表单标题预填 "今天中饭吃啥？"、候选项预填 4 项（如 "麻辣烫"、"沙县"、"日料"、"自带便当"）

- **AC-004.2**
  - Given 我点击 "旅游目的地" 模板
  - Then 表单预填 "下次团建去哪？" + 4 个目的地候选

- **AC-004.3**
  - Given 模板预填后
  - When 我修改其中任意字段并提交
  - Then 创建成功（说明模板是预填非锁定）

- **AC-004.4**
  - Given 模板按钮点击
  - Then 不会触发表单提交（type=button）

## Dependencies

- STORY-001（模板填的是创建表单）

## Out of scope

- 用户自定义模板保存

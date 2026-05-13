---
id: STORY-001
title: 项目脚手架 + 创建投票端到端
owner: raptoravis
kind: feature
status: done
created: 2026-05-13
updated: 2026-05-13
source_id: PRD-001
priority: P0
blocked_by: []
estimate: M
---

# STORY-001: 项目脚手架 + 创建投票端到端

## As a / I want / So that
- **As a** 创建者
- **I want** 打开站点首页填写题目 + 候选项 + 截止时间，提交后拿到「参与链接 + 管理链接」
- **So that** 我可以把参与链接发到群里收集投票

## Acceptance Criteria（Given-When-Then）
- [ ] **Given** 站点已启动 **When** GET `/` **Then** 返回创建投票表单（含问题、候选项、截止时间字段）
- [ ] **Given** 表单字段合法（问题 1-200 字、候选项 2-10 条、截止时间 now+10min~now+30d） **When** POST `/api/polls` **Then** 返回 201 + JSON `{ pollId, voteUrl, adminUrl, adminToken }`
- [ ] **Given** 表单字段不合法（如候选项 < 2 或截止时间超范围） **When** POST `/api/polls` **Then** 返回 400 + 错误码
- [ ] **Given** 已创建投票 **When** GET `/v/<pollId>` **Then** 返回参与页 HTML（暂时只显示题目 + 选项 + 截止时间，不必能投票）
- [ ] **Given** SQLite 数据库 **When** 创建投票完成 **Then** `polls` 表新增一行，`options` 表新增 N 行

## Dependencies
- 无（依赖图根节点）

## 涉及范围
- 选定技术栈、初始化 monorepo / 单仓
- 数据模型：polls / options / votes / sessions 表（votes/sessions 字段可空，本 STORY 不写入）
- 后端：创建投票 API + 参与页只读路由
- 前端：创建表单 + 简单参与页骨架
- 测试：API 单元测试 + 端到端冒烟

## 接下来做什么
1. ★ `/tunan-plan STORY-001`

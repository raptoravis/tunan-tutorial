---
id: REQ-001
title: 轻量投票系统（旅游目的地 / 午饭去哪）
owner: raptoravis
kind: feature
status: in_progress
created: 2026-05-13
updated: 2026-05-13
source_id:
priority: P2
blocked_by: []
research_done: false
raw_req_source: .tunan-workspace/raw-reqs/SPT-001/2026-05-12-voting-system.md
---

# REQ-001 — 轻量投票系统

## 用户原话

> 我想做一个投票系统：可以投票去哪里旅游 / 中饭吃什么。

## 意图

做一个轻量的、面向小群体的开放主题投票工具。典型场景：团队周末旅游目的地决策、午饭吃什么。

## Goals

- **G-001** 用户可以创建一个投票主题（如"周末去哪玩"），并预先列出若干候选项
  - [ ] AC: 创建表单含 标题 + 候选项数组（≥2）
  - [ ] AC: 创建成功后返回该投票的唯一可分享链接
- **G-002** 其他用户通过链接进入投票页，可对候选项投票
  - [ ] AC: 投票页展示标题 + 候选项列表 + 实时票数
  - [ ] AC: 单设备/会话对同一投票只允许投一次（防重投基于 localStorage + 服务端会话标识，默认不强校验账号）
- **G-003** 任意时刻可查看当前每个候选项的票数 / 占比
  - [ ] AC: 票数变更后 ≤ 5s 内前端可见（轮询或刷新即可，不强求实时推送）
- **G-004** 投票创建者可以关闭投票（停止接受新票）
  - [ ] AC: 关闭后投票页只读，新提交返回 400

## Constraints

- 单实例部署可用（SQLite 即可，无需引入 PG/Redis）
- 不引入登录系统；用 cookie/localStorage 区分匿名 session
- Node ≥ 20 + pnpm；前后端同仓 monorepo
- 不做移动 App，只做 Web

## Non-Goals

- 用户账户体系 / 实名
- 投票权重 / 角色权限
- 实时 WebSocket 推送（轮询足够）
- 富文本候选项 / 图片候选项
- 投票统计的可视化高级图表（基础进度条即可）

## Scope Boundary

**In**：创建投票、投票、查看结果、关闭投票、防重投（弱校验）。

**Out**：账号系统、富权限、推送、移动端原生、导出 / 分享到第三方平台。

## Open Questions

（裸调 pipeline 默认全部 ★ 推荐，不弹菜单。记录在此供下游 PRD 阶段细化。）

- Q1 候选项是否允许投票者动态新增？★ 否（仅创建者预设） / 允许投票者新增
- Q2 单选 vs 多选？★ 单选 / 多选（最多 N 项）
- Q3 是否需要投票截止时间？★ 无（仅靠创建者手动关闭） / 必填截止时间
- Q4 防重投强度？★ localStorage + 服务端 session cookie 弱校验 / 强校验（指纹 / IP）

## Research Findings

`research_done: false` — pipeline 裸调下默认跳过深度调研，节省时间。典型投票应用模式 (Doodle, 钉钉投票) 已是成熟领域，按 ★ 默认 acceptance 即可。

## 接下来做什么

由 pipeline 接管推进到 PRD 阶段。

---
id: STORY-003
title: 实时结果展示（票数 + 百分比 + 自动刷新）
owner: raptoravis
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: PRD-001
priority: P2
estimate: M
blocked_by: [STORY-002]
---

# STORY-003 实时结果

**As a** 参与者 / 观望者
**I want** 看到每个候选项的当前票数与百分比，并在他人投票时自动更新
**So that** 我能即时感知群体倾向

## Given-When-Then

- **AC-003.1**
  - Given 一个有 3 票分布在 2 个候选项（2/1）的投票
  - When 我打开页面
  - Then 看到选项 A：2 票（66.7%）、选项 B：1 票（33.3%），总计 3 票

- **AC-003.2**
  - Given 我打开了投票页且页面保持在前台
  - When 别人在另一浏览器投了一票
  - Then 我的页面在 ≤ 5s 内自动刷新票数（轮询或 SSE 任一实现均可）

- **AC-003.3**
  - Given 0 票
  - When 我打开页面
  - Then 显示 "暂无投票"，每项 0 票 0%

- **AC-003.4**
  - Given 我自己投票后
  - Then 结果区域立即更新（无需等下一次轮询）

## Dependencies

- STORY-002（需要有投票动作产生数据）

## Out of scope

- 历史趋势图、按时段拆分等高级可视化

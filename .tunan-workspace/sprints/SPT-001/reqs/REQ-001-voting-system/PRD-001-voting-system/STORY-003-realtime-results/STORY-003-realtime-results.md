---
id: STORY-003
title: 投票页实时显示总参与人数和每项票数
owner: raptoravis
status: done
created: 2026-05-13
updated: 2026-05-13
source_id: PRD-001
priority: P2
estimate: S
blocked_by: []
---

# STORY-003 — 实时结果

## User Story

- **As a** 参与者 Bo
- **I want** 在投票页看到当前每个候选项的票数和总参与人数，并在别人投票后 ≤ 2 秒看到刷新
- **So that** 我能感知"大家都在选什么"，决定要不要补投或修改

## Scope

覆盖 PRD-001 FR-5。包含：结果 API、前端轮询（★ 默认）展示、横向条形图或纯数字票数（任选）。**不**包含 SSE / WebSocket（除非 ★ 默认轮询不达标）。

## Acceptance (Given-When-Then)

- **AC-1** Given 一个房间打开 2 个浏览器（A 和 B）
  When A 提交投票
  Then B 的投票页在 ≤ 2 秒内显示更新后的票数（每项 + 总参与人数）
- **AC-2** Given 结果展示区
  When 渲染
  Then 每个候选项显示「N 票 (X%)」文字 + 横向比例条；总参与人数另列
- **AC-3** Given 0 票的候选项
  When 渲染
  Then 显示「0 票 (0%)」，比例条为空，不出现 NaN / 除零异常
- **AC-4** Given 实时刷新轮询
  When 房间被关闭（来自 STORY-005，本 STORY 仅前置兼容）
  Then 轮询继续工作（结果可读），但不再请求投票 API
- **AC-5** Given a11y 要求（PRD NFR-2）
  When 用屏幕阅读器或键盘 Tab 浏览结果区
  Then 票数有可读文字（不仅依赖颜色条），更新时不抢占焦点

## Dependencies

- STORY-002（参与者已能投票，否则没数据可统计）

## Notes

- ★ 默认轮询间隔 1.5 秒（满足 p95 < 2s）；PLAN 阶段可调
- 如发现轮询给 50 人房间撑不住，再换 SSE — 但本 STORY 不预先做

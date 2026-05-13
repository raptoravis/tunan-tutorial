---
id: STORY-002
title: 参与者能匿名进入房间多选投票并修改
owner: raptoravis
status: done
created: 2026-05-13
updated: 2026-05-13
source_id: PRD-001
priority: P1
estimate: M
blocked_by: []
---

# STORY-002 — 参与投票（多选 + 修改）

## User Story

- **As a** 参与者 Bo
- **I want** 凭房间链接进入页面、勾选若干候选项、提交，并能在房间关闭前修改自己的选择
- **So that** 我能在群里被拉来投票时无注册地参与，反悔时也能调整

## Scope

覆盖 PRD-001 FR-2 + FR-3。包含：参与者 token 分配、投票提交（覆盖式）、个人当前选择回显。**不**包含实时刷新别人的票数（STORY-003）与追加候选项（STORY-004）。

## Acceptance (Given-When-Then)

- **AC-1** Given 一个已创建房间链接 `/r/<room-id>`
  When 用一个全新浏览器（无痕窗口）打开
  Then 页面展示房间标题与所有候选项的复选框；首次访问时服务端分配一个参与者 token 写入 HttpOnly cookie
- **AC-2** Given 投票页
  When 一项都没勾就点提交
  Then 提交被前端拦截 或 服务端返回 400 + 中文错误提示
- **AC-3** Given 勾选 ≥1 项后提交
  When 服务端处理
  Then 返回 200，页面以高亮/勾选态回显该参与者当前选择，提示"已投票，可修改"
- **AC-4** Given 同参与者再次进入页面（同 cookie）
  When GET 投票页
  Then 上次的勾选状态正确回显
- **AC-5** Given 同参与者修改勾选并再次提交
  When 服务端处理
  Then 该参与者的选择被**覆盖**（不是累加），且 DB 中只保留最新一组
- **AC-6** Given 不存在的房间 id
  When 访问 `/r/<bad-id>`
  Then 返回 404，中文友好提示

## Dependencies

- STORY-001（房间存在 + 候选项查询 API + DB schema）

## Notes

- 参与者 token 与房间组合构成"已投票身份"；不同房间互不影响
- 票数展示本 STORY 可以**先用一次性 GET**（页面加载时拉一次），实时刷新留给 STORY-003
- 房间已关闭（closed_at 非空）时本 STORY 默认无法投票 — 行为细节交由 STORY-005 完善（本期可允许提交但 STORY-005 会改）

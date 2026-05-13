---
id: PLAN-005
title: 创建者删除 PLAN
owner: raptoravis
status: done
created: 2026-05-13
updated: 2026-05-13
source_id: STORY-005
priority: P2
blocked_by: []
---

# PLAN-005 创建者删除

Server `DELETE /api/polls/:id` 校验 owner_token cookie；级联删 votes + options + polls。前端在 is_owner=true 时显示删除按钮，window.confirm 二次确认；onDeleted 回首页。

Affected: server routes/polls.ts (DELETE), web api.ts (deletePoll), web PollPage.tsx (按钮 + confirm), App.tsx (onDeleted), 测试 server (T-D01..04) + web (T-WD1..4).

Risks: 用 native window.confirm 简化；如需自定义 modal 后续 STORY。
Rollback: 不合并。

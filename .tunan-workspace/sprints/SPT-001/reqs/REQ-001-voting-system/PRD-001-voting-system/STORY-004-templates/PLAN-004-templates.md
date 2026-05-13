---
id: PLAN-004
title: 模板按钮 PLAN
owner: raptoravis
status: done
created: 2026-05-13
updated: 2026-05-13
source_id: STORY-004
priority: P2
blocked_by: []
---

# PLAN-004 模板按钮

Web-only：新增 `apps/web/src/templates.ts` 写两个模板；CreatePage 头部加两个 button，点击 setState 预填 title + options。

Affected：apps/web/src/templates.ts (新), apps/web/src/pages/CreatePage.tsx (改), apps/web/src/pages/CreatePage.test.tsx (改加 T-TPL1..4)

Risks: 无；纯前端 state。
Rollback: 不合并 / revert。

---
id: PLAN-005
title: STORY-005 模板首页 实现计划
owner: raptoravis
source_id: STORY-005
status: done
created: 2026-05-13
updated: 2026-05-13
priority: P2
pre_auth:
  scope: [tdd_red_gate, pr_lgtm]
---

# PLAN-005 — 模板首页

仅 web 改动。

## Affected Files
- `packages/web/src/templates.ts` 新增：模板字典 + lookup
- `packages/web/src/App.tsx` Home 渲染两个模板按钮
- `packages/web/src/pages/NewPoll.tsx` 读 `?template=` 预填

## Steps
1. templates.ts: `{ travel: {title, options}, lunch: {title, options} }`
2. App.tsx Home: 两个 .btn primary + 自定义链接
3. NewPoll：读 `new URLSearchParams(location.search).get("template")`，匹配 → 预填 useState 初值
4. 未知 template → 退化为空白创建页（不报错）
5. tsc + 手测

无 server / tests 改动；可选给 web 加 1 个 templates.ts 单测但价值低，由 sponsor checklist 验证。

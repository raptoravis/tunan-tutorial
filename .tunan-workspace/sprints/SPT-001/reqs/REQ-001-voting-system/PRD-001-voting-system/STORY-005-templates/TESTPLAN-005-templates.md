---
id: TESTPLAN-005
title: STORY-005 模板首页 测试
owner: raptoravis
source_id: PLAN-005
status: done
created: 2026-05-13
updated: 2026-05-13
priority: P2
pre_auth:
  scope: [tdd_red_gate, pr_lgtm]
---

# TESTPLAN-005

## Unit (vitest in web 可选，或仅手测)
- 加一个 web 包 vitest 配置太重；按 manual smoke 覆盖

## Smoke (手测 / 浏览器)
- T-1 GET / → 看见"去哪旅游" + "中饭吃什么" + "自定义创建" 链接
- T-2 点"去哪旅游" → /new?template=travel → 标题 "周末去哪玩？" + 4 选项预填
- T-3 点"中饭吃什么" → /new?template=lunch → 标题 "中饭吃什么？" + 4 选项预填
- T-4 编辑预填后提交 → 用编辑后的值创建成功
- T-5 /new?template=foo → 退化为空白创建页（不报错）

## Regression
TESTPLAN-001..004 全集 34 case 仍绿

## Pass
T-1..T-5 手测 + 34 regression

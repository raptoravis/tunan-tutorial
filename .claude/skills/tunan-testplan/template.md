---
id: TESTPLAN-NNN
title:
owner:
kind: feature
status: draft
created:
updated:
source_id:           # 对应 PLAN-NNN
priority: P2
blocked_by: []
---

# TESTPLAN-NNN: <标题>

## Test Matrix
| 维度 | 取值 |
|---|---|
| 浏览器 | Chrome / Safari / FF |
| ... | ... |

## Persona Scenarios
- novice: <步骤 + 期望结果>
- power-user: ...
- adversarial: ...

## Smoke
- [ ] <最小冒烟项>

## Regression
- [ ] <受影响的现有功能>

## Pass Criteria
- 全部 ✅；失败时进入 PR 池 status=failed，回流到 retro

## 接下来做什么
1. ★ `/tunan-dev <TESTPLAN-id>`（创建 worktree 开始开发）

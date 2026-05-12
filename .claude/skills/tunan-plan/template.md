---
id: PLAN-NNN
title:
owner:
kind: feature
status: draft
created:
updated:
source_id:           # 对应 STORY-NNN
priority: P2
blocked_by: []
---

# PLAN-NNN: <标题>

## Approach
<一段：选哪条路 + 为什么；不写代码>

## Environment Notes（按需勾选；与本 PLAN 不涉及的画 ❌）
- [ ] Windows 兼容：路径长度 / 行尾 / 大小写
- [ ] 系统 HTTP_PROXY 影响：Playwright/curl/fetch 等本机服务探测若被 Clash/V2Ray 拦截，
      需在配置中固化 NO_PROXY=127.0.0.1,localhost
- [ ] Node 版本要求 / 内置模块（node:sqlite 等）可用性
- [ ] 多 OS CI 矩阵需要还是单 OS 即可

## Affected Files
- `path/to/file1` — <为何动>
- `path/to/file2`

## Steps
1. <步骤，按可独立验证的小单位>
2. ...

## Risks
- <风险 + 缓解>

## Rollback
<怎么回滚：revert / feature flag / DB migration down / ...>

## 接下来做什么
1. ★ `/tunan-testplan <PLAN-id>`

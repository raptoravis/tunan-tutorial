---
id: PLAN-003
title: STORY-003 cookie 防重复投票 实现计划
owner: raptoravis
source_id: STORY-003
status: done
created: 2026-05-13
updated: 2026-05-13
priority: P2
pre_auth:
  by: raptoravis
  at: 2026-05-13T00:00:00Z
  scope: [tdd_red_gate, pr_lgtm]
---

# PLAN-003 — cookie 防重复投票

## Approach

cookie 命名 `voted_polls`：值是 base64(JSON.stringify(string[]))，记录已投过的 shortCode 列表。
不签名（demo 级；reset cookie 即可重投属已知 limitation）。

## Affected Files

- `packages/server/src/cookie.ts` — 新增：parse/serialize voted cookie
- `packages/server/src/app.ts` — vote 端点读 cookie → 409 / 写新 cookie
- `packages/server/tests/api.dedupe.spec.ts` — 5 用例
- `packages/web/src/pages/Poll.tsx` — 409 处理 → 切结果视图 + toast 文案
- `packages/web/src/pages/NewPoll.tsx` + `Poll.tsx` 底部加灰字"匿名 cookie 去重"

## Steps

1. 写 cookie.ts helpers + 测试
2. app.ts vote：解 cookie → 已含 shortCode 则 409 → 否则 push + setCookie
3. 写 dedupe integration tests（用 fetch 配合 Cookie header 模拟）
4. Poll.tsx：catch 409 → 拉最新结果 → 切结果视图 + 灰字 toast
5. UI 灰字提示
6. vitest + tsc

## Risks

- cookie 编码字节数大于 4KB（极端 4000+ poll）→ 不在 MVP 关注

## Rollback

git revert。

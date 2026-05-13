---
id: PLAN-002
title: STORY-002 多选模式 实现计划
owner: raptoravis
source_id: STORY-002
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P2
pre_auth:
  by: raptoravis
  at: 2026-05-13T00:00:00Z
  scope: [tdd_red_gate, pr_lgtm]
---

# PLAN-002 — STORY-002 多选模式

## Approach

复用 STORY-001 工程；schema 中 `mode` 字段已就位。本 STORY 仅做：
1. API 在 multi 模式下接受多 optionIds + 至少 1 项校验
2. API 在 single 模式下强制 optionIds.length===1（NIT 来自 PR-001 review）
3. Web 创建页加 mode toggle；投票页根据 mode 渲染 radio/checkbox

## Affected Files

- `packages/server/src/app.ts` — vote 端点加 mode 一致性校验
- `packages/server/tests/api.vote.spec.ts` — 增多选/单选 length 用例
- `packages/server/tests/api.polls.multi.spec.ts` — 新增 multi 创建用例
- `packages/web/src/pages/NewPoll.tsx` — 加 mode toggle radio
- `packages/web/src/pages/Poll.tsx` — multi 模式 checkbox + 选中集合

## Steps

1. 测试先写（red）：multi 创建 + multi 投票（两选项各 1 票）+ multi 空数组 400 + single 多 id 400
2. 改 app.ts vote：读 poll.mode；mode=single 时 optionIds.length 必须===1，否则 400
3. multi 模式：optionIds.length ≥ 1，每 id 写一条 votes
4. 改 NewPoll：mode radio（"single 单选 ★默认" / "multi 多选"）
5. 改 Poll：根据 poll.mode 渲染 radio | checkbox；checkbox 维护 Set<number>；提交集合
6. tsc + vitest 全绿
7. 手测 smoke：创建 multi poll → 勾两项 → 看两项各 1 票

## Risks

- R1：投票页 selected 状态从 number|null 改为 Set<number>，需要重写
- R2：与 STORY-001 single 行为兼容（mode 缺省 single）

## Rollback

git revert PR；schema 不变。

## 对齐（pre-auth ★ 全默认）

| Q | 默认 | 备选 |
|---|---|---|
| 单选模式 length 校验 | 严格 ===1 | length>=1 即可 |
| UI toggle 默认值 | single | multi |
| 多选最大数 | 不限（最多即选项数） | 上限 N |

---
id: TESTPLAN-003
title: 查看投票详情测试计划
owner: raptoravis
source_id: PLAN-003
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P2
blocked_by: []
---

# TESTPLAN-003 — 查看投票详情

## Persona

- **novice Bob**：拿到分享链接 → 打开 → 看到标题 + 3 个选项 + 当前 0 票
- **adversarial**：随便编一个 id 访问 → 看到"找不到这个投票"

## Smoke

- [ ] S1 `pnpm install`
- [ ] S2 `pnpm -F server test` 全绿
- [ ] S3 `pnpm -F web test` 全绿

## Unit / Integration

- [ ] U1 `polls.test.ts > getPoll` 返回 `{id, title, options:[{id,text,count:0}], totalVotes:0}`（无投票时）
- [ ] U2 `getPoll(不存在 id)` 返回 null
- [ ] U3 `index.test.ts > GET /api/polls/:id` 合法 → 200 + 正确 body
- [ ] U4 `GET /api/polls/:bad` → 404
- [ ] U5 `PollPage.test.tsx` 加载中 → 显示 loading
- [ ] U6 PollPage：fetch 成功 → 渲染标题 + 选项数量正确
- [ ] U7 PollPage：fetch 404 → 显示"找不到这个投票"

## Regression

- [ ] R1 STORY-001 health 仍 200
- [ ] R2 STORY-002 POST /api/polls + CreatePoll 表单不变

## Pass Criteria

S1..S3 + U1..U7 + R1..R2 全 ✅

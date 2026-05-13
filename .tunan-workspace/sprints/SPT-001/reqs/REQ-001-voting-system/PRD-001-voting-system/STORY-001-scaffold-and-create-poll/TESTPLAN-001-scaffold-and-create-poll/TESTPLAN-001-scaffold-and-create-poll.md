---
id: TESTPLAN-001
title: 项目脚手架 + 创建投票端到端 TESTPLAN
owner: raptoravis
kind: feature
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: PLAN-001
priority: P0
blocked_by: []
---

# TESTPLAN-001: 项目脚手架 + 创建投票端到端

## Test Matrix
| 维度 | 取值 |
|---|---|
| API client | Hono `app.request()`（内存模拟，不启端口） |
| DB | 每个测试用例独立 in-memory SQLite |
| Node | v24.15.0 |
| OS | Windows 11（本地） |

## Persona Scenarios
- **creator-happy**：填写合法表单 → POST `/api/polls` → 拿到 `{pollId, voteUrl, adminUrl, adminToken}` → GET `/v/<pollId>` 看到题目和选项
- **creator-bad-input**：候选项只填 1 个 / 截止时间 5 分钟后（< 10 分钟下限）/ 题目超 200 字 → 全部 400
- **adversarial**：候选项填 11 个 / 截止时间填 31 天后 → 400

## Smoke
- [ ] `pnpm install` 无报错
- [ ] `pnpm test` 全部用例通过（红→绿）
- [ ] `pnpm dev` 启动后 `curl http://localhost:3000/` 返回创建表单 HTML（含 `<form` 与 `name="question"`）
- [ ] `curl -X POST http://localhost:3000/api/polls -H "content-type: application/json" -d '{"question":"中午吃啥","options":["拉面","盖饭"],"deadline":"<+1h iso>","publicDetails":false}'` 返回 201 + 4 字段

## Regression
- 本 STORY 是 v0.1，无现存功能；仅校验 vitest 自身不破

## Pass Criteria
- API 单测 7 个用例全绿（详见 `tests/polls.create.test.ts`）：
  1. happy path → 201 + 字段齐全
  2. pollId 22 字符
  3. adminToken 32 字符
  4. polls/options 行数正确
  5. question 空 → 400
  6. options.length < 2 → 400
  7. deadline 越界 → 400
- smoke 4 项均 ✅
- 未通过自动作为 PR 评论；本 STORY 失败则 PR 池 `status=failed` 回 retro

## 接下来做什么
1. ★ `/tunan-dev TESTPLAN-001`（创建 worktree 开始开发）

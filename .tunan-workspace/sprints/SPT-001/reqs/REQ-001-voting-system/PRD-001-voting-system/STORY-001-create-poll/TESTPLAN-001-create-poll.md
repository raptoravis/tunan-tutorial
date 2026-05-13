---
id: TESTPLAN-001
title: 创建投票 TESTPLAN
owner: raptoravis
status: done
created: 2026-05-13
updated: 2026-05-13
source_id: PLAN-001
priority: P2
blocked_by: []
---

# TESTPLAN-001 创建投票

## Test Matrix

| 维度 | 取值 |
|---|---|
| 运行环境 | Node 22 + Windows / Linux（CI） |
| 浏览器 | Chrome latest（dev manual） |
| 数据规模 | 0 / 2 / 10 个候选项；标题 0/1/100/101 字 |
| 角色 | 创建者（owner_token 持有）、参与者（无 owner_token） |

## Persona Scenarios

### novice
1. 打开 `/`
2. 填标题 "中饭吃啥"、3 个候选项 "麻辣烫/沙县/便当"
3. 点击 "创建"
4. 期望：跳转到 `/p/<id>`，看到标题与 3 个候选项

### power-user
1. 用 fetch 直接调 `POST /api/polls`，body 含 10 个候选项 + 截止时间 ISO 串
2. 期望：返回 200 + `{id}`，set-cookie 含 owner_token
3. 立即 `GET /api/polls/:id` 应见 `is_owner: true`

### adversarial
1. POST 0/1 个候选项 → 400 "至少需要 2 个候选项"
2. POST 11 个候选项 → 400 "最多 10 个候选项"
3. POST 标题 101 字 → 400 长度超限
4. POST 标题 0 字 → 400 标题必填
5. POST 重复候选项 label → 400 候选项不能重复
6. GET 不存在 id → 404

## Smoke

- [ ] S-1 `pnpm -F server dev` 启动后 `curl http://localhost:4123/health` 返回 200
- [ ] S-2 `POST /api/polls` 合法 body 返回 200 + id
- [ ] S-3 `GET /api/polls/:id` 返回该投票详情

## Server Unit/Integration Tests (apps/server/test/polls.spec.ts)

- [ ] T-001 创建投票 happy path → 200 + id + set-cookie owner_token
- [ ] T-002 创建投票 title 校验（0/101 字）→ 400
- [ ] T-003 创建投票 options 校验（<2 / >10 / 重复）→ 400
- [ ] T-004 GET 投票返回 options 按 position 排序
- [ ] T-005 GET 不存在 id → 404
- [ ] T-006 创建者请求 GET 时 `is_owner: true`；非创建者 `is_owner: false`
- [ ] T-007 截止时间字段：未传时 deadline_at = null；传 ISO 时存为 UTC

## Web Unit Tests (apps/web/src/pages/CreatePage.test.tsx)

- [ ] T-W1 候选项默认 2 个空格输入框
- [ ] T-W2 加候选项按钮最多加到 10
- [ ] T-W3 提交时本地校验：标题空 / options<2 → 显示错误，不发请求
- [ ] T-W4 提交成功 mock fetch 返回 id → router.push 到 `/p/:id`

## Regression

- [ ] R-1 N/A（首个 STORY，无回归基线）

## Pass Criteria

- 所有 T-* 单测 ✅
- 所有 Smoke ✅
- 三个 persona 的 adversarial 步骤手动复跑 ✅
- 任一 ❌ → PR failed

## 接下来做什么

1. ★ `/tunan-dev TESTPLAN-001` — pipeline 衔接

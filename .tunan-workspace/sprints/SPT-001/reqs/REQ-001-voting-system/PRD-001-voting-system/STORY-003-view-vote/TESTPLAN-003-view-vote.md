---
id: TESTPLAN-003
title: 查看投票 TESTPLAN
owner: raptoravis
source_id: PLAN-003
status: ready
created: 2026-05-13
updated: 2026-05-13
---

# TESTPLAN-003 — 查看投票

## Functional Tests (vitest)

- [ ] **F-1** GET `/api/votes/:id` 200 + shape `{id, title, options:[{idx,label,count}], closed: false, you_voted_idx: null}`
- [ ] **F-2** options 按 idx 升序，count 初始为 0
- [ ] **F-3** GET 不存在 id → 404
- [ ] **F-4** 首次 GET（无 cookie）响应含 `Set-Cookie: vsession=...; HttpOnly; SameSite=Lax`
- [ ] **F-5** 携带已存在投票的 cookie GET → you_voted_idx 反映之

## Smoke

- [ ] **S-1** 用 curl `POST /api/votes` 得到 id → `curl -c jar.txt GET /api/votes/:id` 看 shape + Set-Cookie
- [ ] **S-2** 浏览器创建投票 → 跳转 `#/v/<id>` → 看到 标题、3 个候选项、各自 count=0 + 进度条
- [ ] **S-3** 5s 后页面 count 仍正确刷新

## Pass Criteria

全部 F + S 通过。

## TDD red-gate

先写 `votes.view.spec.ts` 跑红 → red ok → 写产品代码 → green。

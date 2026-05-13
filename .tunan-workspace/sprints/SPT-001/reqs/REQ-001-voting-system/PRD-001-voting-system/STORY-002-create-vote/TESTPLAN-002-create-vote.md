---
id: TESTPLAN-002
title: 创建投票 TESTPLAN
owner: raptoravis
source_id: PLAN-002
status: ready
created: 2026-05-13
updated: 2026-05-13
---

# TESTPLAN-002 — 创建投票

## Functional Tests

- [ ] **F-1** POST `/api/votes {title:"午饭", options:["A","B"]}` → 200，返回 id (`^[A-Za-z0-9]{8}$`) + admin_token (≥32 chars)
- [ ] **F-2** DB 中确认 votes + vote_options 行已写
- [ ] **F-3** title 空 → 400
- [ ] **F-4** options 仅 1 项 → 400
- [ ] **F-5** options 11 项 → 400
- [ ] **F-6** 两次连续创建得到不同 id

## Smoke

- [ ] **S-1** 浏览器进入 `/` 看到表单（title input + 2 个 option input + 添加候选按钮 + 提交按钮）
- [ ] **S-2** 填"周末去哪 / 桂林 / 大理" → 提交 → URL hash 跳到 `#/v/<id>` 且 localStorage 含 `vote:<id>:admin`
- [ ] **S-3** 标题为空提交 → 前端 disable 提交按钮或后端 400 + 友好提示

## Persona

- **novice Cathy**：创建"午饭吃什么"投票 - 顺利完成
- **adversarial Aaron**：故意填 11 项 / 空 title / 重复 option label → 都被前后端拒
- **power-user Penny**：用 curl `POST /api/votes` 拿 admin_token，连续 5 次创建均成功

## Pass Criteria

全部 F + S 通过 → PR ready。

## TDD red-gate

先写 `votes.create.spec.ts` 跑红 → red ok 后写产品代码 → green。

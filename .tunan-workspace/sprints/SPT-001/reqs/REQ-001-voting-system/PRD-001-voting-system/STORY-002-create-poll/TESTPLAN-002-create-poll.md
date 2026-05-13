---
id: TESTPLAN-002
title: 创建投票测试计划
owner: raptoravis
source_id: PLAN-002
status: done
created: 2026-05-13
updated: 2026-05-13
priority: P2
blocked_by: []
---

# TESTPLAN-002 — 创建投票

## Persona

- **novice Alice**：首页 → 填标题 "中午吃啥" → 三个选项 → 创建 → 跳 `/poll/<id>`
- **power-user**：增减选项行；按 enter 提交
- **adversarial**：空标题 / 超长标题 / 1 个选项 / 21 个选项 / 重复选项 / 空选项文本 / 60 字符选项文本

## Smoke

- [ ] S1 `pnpm install` 通过
- [ ] S2 `pnpm -F server test` 全绿
- [ ] S3 `pnpm -F web test` 全绿
- [ ] S4 `pnpm -F web build` 通过

## Unit / Integration

- [ ] U1 `polls.test.ts` createPoll：合法输入返回 8 字符 id；DB 中 polls + options 行数正确
- [ ] U2 createPoll：title 空 → ValidationError
- [ ] U3 createPoll：title > 100 → ValidationError
- [ ] U4 createPoll：options.length < 2 → ValidationError
- [ ] U5 createPoll：options.length > 20 → ValidationError
- [ ] U6 createPoll：任一 option 空 → ValidationError
- [ ] U7 createPoll：任一 option > 50 → ValidationError
- [ ] U8 createPoll：options 有重复 → ValidationError
- [ ] U9 `index.test.ts` POST /api/polls：合法 → 201 + `{id, url}`，url 形如 `/poll/<id>`
- [ ] U10 POST /api/polls：非法 → 400 + 错误消息体
- [ ] U11 `ids.test.ts` generateId：返回 8 字符；只含 base62 字符；100 次调用不撞
- [ ] U12 `CreatePoll.test.tsx`：初始 2 个选项行；点"加"出现第 3 行；"创建" disabled 当 title 空
- [ ] U13 `CreatePoll.test.tsx`：填合法输入 + mock fetch → 提交后调用 POST 且 navigate 到 `/poll/<id>`
- [ ] U14 `CreatePoll.test.tsx`：选项数到 20 时"加"按钮 disabled

## Regression

- [ ] R1 STORY-001：`GET /api/health` 仍 200 + `{ok:true}`
- [ ] R2 STORY-001：首页根路由仍能渲染（现在被改成路由壳，但内容应有 CreatePoll 表单）

## Pass Criteria

- S1..S4 + U1..U14 + R1..R2 全 ✅

## 接下来做什么

由 pipeline 自动衔接 `/tunan-dev TESTPLAN-002`。

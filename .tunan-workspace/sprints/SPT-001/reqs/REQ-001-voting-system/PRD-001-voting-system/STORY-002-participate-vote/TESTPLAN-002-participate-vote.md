---
id: TESTPLAN-002
title: 参与投票（多选 + 修改）— 测试计划
owner: raptoravis
status: ready
created: 2026-05-13
updated: 2026-05-13
source_id: PLAN-002
priority: P1
---

# TESTPLAN-002 — 参与投票（多选 + 修改）

源：[STORY-002](./STORY-002-participate-vote.md) · [PLAN-002](./PLAN-002-participate-vote.md)

## Test Matrix

| 维度 | 取值 |
|---|---|
| Node | v24（本机）|
| Cookie 模式 | 有 / 无 / 篡改非 hex |
| 房间状态 | 正常 / 已关闭 / 不存在 |
| 投票数量 | 0 / 1 / N / 含非法 option_id |
| 同一参与者 | 首投 / 二投覆盖 / 切回原选 |

## Persona Scenarios

### Novice — 参与者 Bo
1. 打开发起人发的 `/r/<id>` 链接
2. 看到候选项复选框
3. 勾 2 项 → 点提交
4. 看到"已投票，可修改"提示
5. **期望**：刷新页面仍回显勾选

### Power-user — 反悔者
1. 投完票
2. 把所有勾选取消，改勾另一个候选项 → 提交
3. **期望**：旧选被覆盖，回读只剩新选

### Adversarial — Mallory
- A. POST `option_ids: []` → 400
- B. POST 不属于本房间的 option_id → 400
- C. POST 字符串 option_ids → 400
- D. 用 curl 不带 cookie 直接 POST → 服务端签发 cookie 并接受（OQ-1 决议）
- E. 房间已关闭 → POST 返回 410
- F. 不存在的房间 → 404
- G. 同 cookie 并发提交 10 次 → 不丢、不重复（最终一次胜出）

## Smoke

- [ ] **S-1** server dev 起，curl 创建房间 → 拿 cookie POST 投票 → my-vote 回读一致
- [ ] **S-2** web dev 起，浏览器走 novice persona 全流程

## Unit / Integration（node --test，packages/server/test/votes.test.ts）

- [ ] **U-1** 首次 GET 房间响应含 `Set-Cookie: pt=...; HttpOnly; SameSite=Lax`
- [ ] **U-2** POST 合法多选 → 200 + `selected` 数组等于请求
- [ ] **U-3** POST 后 GET my-vote 回显一致（同 cookie）
- [ ] **U-4** 同 cookie 二次 POST 覆盖（不累加）；DB 中只剩第二次的 votes 行
- [ ] **U-5** 房间已关闭（手动 UPDATE rooms SET closed_at=now）→ POST 返回 410
- [ ] **U-6** 不存在的 room_id → 404
- [ ] **U-7** POST option_ids=[] → 400
- [ ] **U-8** POST 含其他房间的 option_id → 400 不串库
- [ ] **U-9** POST 字符串 / 缺字段 → 400
- [ ] **U-10** 两个不同 cookie 视作不同参与者；各自 my-vote 互不影响
- [ ] **U-11** 已 deleted（deleted_at 非空）的 option_id 不可投 → 400
- [ ] **U-12** 并发 10 次提交后 DB 中该参与者只剩最后一次

## A11y

- [ ] **A-1** 复选框有显式 `<label>` 关联（点 label 切换 input）
- [ ] **A-2** Tab 顺序：候选项 1 → ... → 候选项 N → 提交
- [ ] **A-3** "已投票，可修改" 用 `role="status"`，不抢焦点

## Regression

复用 STORY-001 的 TESTPLAN-001 单测（U-1..U-9 + Adv-D/E/G + Persistence）：

- [ ] **R-1** TESTPLAN-001 全集仍 17/17 pass
- [ ] **R-2** GET /api/rooms/:id 字段未减；新增 Set-Cookie 不影响 JSON body
- [ ] **R-3** 前端创建页 / 成功页路由仍可达；浏览器手测

## Pass Criteria

- ✅ 关键自动化全过：TESTPLAN-002 U-* + Adv-* + TESTPLAN-001 全集（回归）
- ❌ 任一 U-* 失败 → PR failed

## TDD red 起步

dev 入产品代码前先把 U-1, U-2, U-4, U-5 四个核心 case 写出来跑红。

## 失败重试

不重试。

## 接下来做什么

1. ★ `/tunan-dev TESTPLAN-002` — 建 worktree + TDD red

---
id: TESTPLAN-001
title: 创建投票房间 — 测试计划
owner: raptoravis
status: implemented
created: 2026-05-13
updated: 2026-05-13
source_id: PLAN-001
priority: P1
---

# TESTPLAN-001 — 创建投票房间

源：[STORY-001](./STORY-001-create-room.md) · [PLAN-001](./PLAN-001-create-room.md)

## Test Matrix

| 维度 | 取值 | 备注 |
|---|---|---|
| 运行环境 | Node 22+（v24 本机） | `node:sqlite` 需 22+ |
| OS | Windows / 跨平台（CI 只跑 Windows-本地） | sponsor 当前环境 |
| 浏览器 | Chrome 最新（手测） | a11y 项目用 Tab + Enter |
| 数据规模 | 0 / 2 / 10 候选项 | 边界 + 常态 |
| 输入合法性 | 合法 / 缺失 / 超长 / 重复 | 校验路径 |
| 持久化 | 同进程读 / 重启进程读 | 验证落盘 |

## Persona Scenarios

### Novice — 第一次用 Aria
1. 打开 `http://localhost:5173/`
2. 填标题"周五午餐吃啥"
3. 填 3 个候选项："麻辣烫"、"日料"、"沙县"
4. 点「创建」
5. **期望**：跳转到成功页，看到形如 `http://localhost:5173/r/<8 位 id>` 的链接和一段管理 token；点「复制链接」剪贴板内容正确；URL 中不再带 token 明文（已 replaceState）

### Power-user — 想多次创建 Aria
1. 创建一次投票
2. 浏览器后退（或点"再建一个"按钮 / 直接访问 `/`）
3. 再创建一次（标题不同）
4. **期望**：两次房间 id 不同；两次都能 GET 回读；管理 token 不同

### Adversarial — 想搞坏它 Mallory
- A. 标题留空提交 → 前端拦截 + 服务端 400
- B. 候选项只填 1 个 → 前端拦截 + 服务端 400
- C. 候选项里写 121 字符 → 服务端 400 + 错误指明字段
- D. 重复候选项（"麻辣烫"、"麻辣烫"、"麻辣烫 "）→ 服务端去重后只保留一份（或 400 提示重复；二选一，由 dev 实现，但必须可验证）
- E. 直接 `curl -X POST /api/rooms -d 'garbage'` → 服务端 400，不崩溃
- F. GET `/api/rooms/aaaaaaaa`（合法格式但不存在）→ 404 + 中文错误
- G. GET `/api/rooms/short`（非法长度）→ 400 或 404，不 500

## Smoke

- [ ] **S-1** `pnpm -F server dev` 起服务，`curl -X POST http://localhost:4123/api/rooms -H 'content-type: application/json' -d '{"title":"t","options":["a","b"],"allow_add":false}'` 返回 200 + `room_id`
- [ ] **S-2** `curl http://localhost:4123/api/rooms/<返回的 room_id>` 返回 200 且 `title` 字段匹配
- [ ] **S-3** `pnpm -F web dev` 起前端，浏览器访问 `http://localhost:5173/` 能看到表单（不白屏）
- [ ] **S-4** 浏览器走完 novice persona，链接可点开（即便目标房间页是占位"敬请期待"也算成功）

## Persistence

- [ ] **P-1** 创建一个房间，记录 `room_id` 与 db 文件 mtime
- [ ] **P-2** Ctrl-C 关掉 server，重新 `pnpm -F server dev`
- [ ] **P-3** GET 同一 `room_id` 仍能返回 200 + 完整数据（标题、候选项、allow_add 一致）

## A11y（关键项）

- [ ] **A-1** 所有 input 都有 `<label>` 关联（DevTools Accessibility tab 检查）
- [ ] **A-2** Tab 键可遍历：标题输入 → 候选项各行输入 → 「+ 添加候选项」按钮 → allow_add 复选框 → 「创建」按钮；焦点环可见
- [ ] **A-3** 校验错误以 `role="alert"` 或同级文本展示，不仅用红色边框
- [ ] **A-4** 正文与背景对比度 ≥ 4.5:1（用 Chrome DevTools Lighthouse 或 axe）

## Unit / Integration tests（node --test）

需被自动化的单测，在 `packages/server/test/`：

- [ ] **U-1** `rooms.test.ts` — POST /api/rooms 合法输入 → 200 + 返回 schema 校验
- [ ] **U-2** `rooms.test.ts` — POST /api/rooms 标题空 → 400
- [ ] **U-3** `rooms.test.ts` — POST /api/rooms 候选项 < 2 → 400
- [ ] **U-4** `rooms.test.ts` — POST /api/rooms 标题超长 / 候选项超长 → 400 且 error.field 指向具体字段
- [ ] **U-5** `rooms.test.ts` — POST + GET 往返一致；allow_add 字段保留
- [ ] **U-6** `rooms.test.ts` — GET 不存在的 room_id → 404
- [ ] **U-7** `rooms.test.ts` — 同一 db 文件关闭再 open，旧数据可读（持久化）
- [ ] **U-8** `id.test.ts` — base62 短链长度 == 8 且字符集合法；连开 1000 次无碰撞
- [ ] **U-9** `id.test.ts` — admin token hash 与原文不等；同输入 hash 稳定

> 测试运行：`pnpm -F server test`（脚本 = `node --test --experimental-sqlite test/**/*.test.ts` 或借 `tsx --test`）

## Regression

本期是首个 STORY，无既有功能 — 但需保证：

- [ ] **R-1** `pnpm install` 在干净 clone 后能成功（lockfile 完整）
- [ ] **R-2** `pnpm -F server build`（tsc）无类型错误
- [ ] **R-3** `pnpm -F web build`（vite build）无错误且产物 < 500KB（基线）

## Pass Criteria

- ✅ 全部 = ✅：U-1..9、S-1..4、P-1..3、A-1..4、R-1..3 + 三个 persona 完整跑通 → PR 进 testing→sponsor_wait
- ❌ 任一关键项失败（U-* / S-* / persona）→ PR 标 failed，回 dev / retro
- A-* 中允许 ≤1 项软失败（如对比度小幅不达标），但需在 PR 评论里显式注明

## TDD red 起步要求

`tunan-dev` 进入产品代码前必须先把 **U-1..U-9 中至少 U-1, U-2, U-5, U-6** 这 4 个核心 case 写出来并跑红（无实现 → fail），sponsor 见红后才能 `red ok` 放行（或 `--pre-auth` 自动放行）。

## 失败重试

不重试。flaky 视为失败，回 retro。

## 接下来做什么

1. ★ `/tunan-dev TESTPLAN-001` — 建 worktree + TDD red 起步
2. `/tunan-tdd TESTPLAN-001`（dev 入口已内调，通常不必单独跑）
3. `/tunan-prime`

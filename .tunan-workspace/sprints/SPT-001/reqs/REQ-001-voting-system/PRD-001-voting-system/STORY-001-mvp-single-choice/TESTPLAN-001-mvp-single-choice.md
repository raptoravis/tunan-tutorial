---
id: TESTPLAN-001
title: STORY-001 MVP 测试计划
owner: raptoravis
source_id: PLAN-001
status: ready
created: 2026-05-13
updated: 2026-05-13
priority: P2
pre_auth:
  by: raptoravis
  at: 2026-05-13T00:00:00Z
  scope: [tdd_red_gate, pr_lgtm]
---

# TESTPLAN-001 — STORY-001 MVP（单选）测试计划

## Test Matrix

| 维度 | 取值 |
|---|---|
| 浏览器 | Chrome（手测）+ Node 22+ 运行 vitest |
| 操作系统 | Windows 11（本地）；CI 待续 |
| Persona | novice / power-user / adversarial |
| 数据规模 | 单 poll 0–10 选项；1–100 票 |
| 网络 | 本地直连 + dev proxy |

## 测试层次

| 层 | 工具 | 范围 |
|---|---|---|
| Unit | vitest@3 | shortcode 生成、option trim/去重、聚合计算（百分比、倒序） |
| Integration（API） | vitest + Hono `app.fetch(req)` 直调 | 创建 / 读 / 投 三端点的 happy + 边界 + 错误 |
| Smoke 手测 | 浏览器 | 端到端走一遍 sanity |

不引入 Playwright/Cypress（本 STORY 范围内不必）。

## Unit Cases — `packages/server/tests/shortcode.spec.ts`

- **U-1** `genShortCode()` 返回长度 8 的字符串
- **U-2** 返回字符仅含 `[0-9A-Za-z]`
- **U-3** 1000 次调用无重复（碰撞概率合理性 sanity）

## Unit Cases — `packages/server/tests/options.spec.ts`

- **U-4** `normalizeOptions(['杭州', ' 杭州 ', '成都'])` → `['杭州','成都']`（trim + 去重保序）
- **U-5** 空字符串/纯空白被剔除：`['', '  ', '成都']` → `['成都']`
- **U-6** 长度超过 80 字符的选项被剔除并 throw `validation_failed`

## Unit Cases — `packages/server/tests/results.spec.ts`

- **U-7** 聚合：votes=[A,A,B] / options=[A,B] → `[{A,2,67%},{B,1,33%}]`，倒序
- **U-8** 0 票时 percent 全 0，total=0
- **U-9** 完全平票时 ord 稳定（按 option idx 升序兜底）

## Integration Cases — `packages/server/tests/api.polls.spec.ts`

- **I-1 POST /api/polls happy**
  - body `{ title: "周末去哪", options: ["杭州","成都"], mode: "single" }`
  - 期望 200，返回 `{ id, shortCode, shareUrl }`，shortCode 长度 8
- **I-2 POST /api/polls 校验失败 — 空标题** → 400 `error:"validation_failed", field:"title"`
- **I-3 POST /api/polls 校验失败 — 1 个选项** → 400 `field:"options"`
- **I-4 POST /api/polls trim/去重** body `{ title:"X", options:["杭州"," 杭州 ","成都"] }` → 创建成功，DB 中只有 2 个 option
- **I-5 GET /api/polls/:shortCode happy** → 返回 poll + options + 0 票聚合
- **I-6 GET /api/polls/:shortCode 404** → 404 `error:"not_found"`

## Integration Cases — `packages/server/tests/api.vote.spec.ts`

- **I-7 POST vote happy** 单选 → 200，返回最新聚合（该 option count=1）
- **I-8 POST vote 校验 — optionIds 为空** → 400 `field:"optionIds"`
- **I-9 POST vote 校验 — option 不属于此 poll** → 400 `error:"option_mismatch"`
- **I-10 POST vote 404 — shortCode 不存在** → 404
- **I-11 三票聚合** 顺序投 A,A,B → GET 结果 A:2 B:1，A 在前

## Persona Scenarios（手测）

### novice — Alice 第一次用
1. 访问 `/new`
2. 标题填 `周末去哪`，加 2 个选项 `杭州` / `成都`
3. 点提交 → 跳 `/p/<code>`
4. 顶部显示分享链接 + 复制按钮 ✅
5. 点选 `杭州` → 提交 → 页面切结果视图，杭州 1 票 (100%) ✅

### power-user — Bob 键盘流
1. 打开 Alice 给的 `/p/<code>`（隐身窗口）
2. Tab 到第一个 radio
3. 方向键移到第二个
4. Tab 到提交按钮 → Enter
5. 结果视图正确显示 + 焦点保持可见 ✅

### adversarial — Mallory 找茬
1. `/new` 标题留空 → 提交 → 前端阻止（按钮 disabled 或 inline error）✅
2. DevTools 直接 `fetch('/api/polls', {method:'POST', body:'{}'})` → 400 ✅
3. 已存在的 poll，DevTools 调 `POST /api/polls/INVALID/vote` → 404 ✅
4. 重复点击提交按钮 5 次 → 仅 1 票被记录（按钮 disable 在 onSubmit 第一时间触发）—— **本 STORY 可接受 2-3 票**（防重在 STORY-003）；记入"已知 limitation"，不算失败
5. 选项里输入 `<script>alert(1)</script>` → 创建成功 → 投票页文本节点渲染，不执行脚本 ✅

## Smoke（必跑）

- [ ] `pnpm install` 全装通过
- [ ] `pnpm -F server dev` 启动 :4123，`GET /healthz` 200
- [ ] `pnpm -F web dev` 启动 :5173，首页 `/new` 可访问
- [ ] 端到端：创建 → 拿到 `/p/<code>` → 投一票 → 结果显示
- [ ] `pnpm -r test` 全绿

## Regression

> 本 STORY 是首个 STORY，无既有功能可回归。后续 STORY 须把以上 Unit/Integration/Smoke 全集纳入回归。

## Pass Criteria

- 全部 Unit + Integration 用例 ✅（红色任意一条 → 失败）
- 所有 Smoke 复选框 ✅
- 三个 persona 场景手测通过（adversarial 步骤 4 视作 known limitation 不阻塞）
- 任一项失败 → PR 状态置 failed，进 retro

## 对齐决议（pre-auth 全部 ★ 默认）

| 决策点 | ★ 默认 | 备选 |
|---|---|---|
| 测试粒度 | unit + integration + 手测 smoke | 仅 e2e / 仅单测 |
| 失败重试 | 不重试 | 重试 1 次 / 3 次 |
| 环境 | 本地（每用例独立内存 sqlite） | dev / staging |
| 测试 DB | `:memory:` per-test | 共享文件 |

## 接下来做什么

1. ★ `/tunan-dev TESTPLAN-001` — 建 worktree 开发（入口统一 commit+push PLAN/TESTPLAN）
2. `/tunan-tdd TESTPLAN-001` — TDD 红灯起步
3. `/tunan-prime`

---
name: tunan-plan
description: tunan 工作流第四站：把 STORY 转成可执行的实现 PLAN（包括影响文件、步骤、风险、回滚）。不写代码。触发：/tunan-plan、"给 STORY-xxx 出 plan"。
---

# tunan-plan — STORY → PLAN

> **何时触发**：sponsor 说 `/tunan-plan`、`/tunan-plan <STORY-id>`。

## 调用语法

```
/tunan-plan                       # pop-next
/tunan-plan <STORY-id>
/tunan-plan list / show / block / unblock
```

## 关键原则

- **PLAN 描述怎么做，不写代码**。代码是 `tunan-dev` 的事
- **影响文件清单是核心**：列具体路径 + 为何动 + 怎么动一句话
- **每步可独立验证**：每步应能跑测试或人眼检查，不留"等做完再说"的步
- **回滚必须可执行**：写明 revert 哪个 commit / feature flag 名 / DB 反向迁移；空着不算
- **依赖类型偏好**：优先 Node 内置（`node:*`）> 纯 JS > 原生模块（`*.node`）。原生模块仅在
  提供不可替代价值时选，并在 Approach 节显式声明（含 fallback）。例如 SQLite 优先 `node:sqlite`
  而非 `better-sqlite3`，规避 Windows / 新 Node 版本上原生编译翻车（来源 RETRO-002）
- **Next.js Server→Client 边界**：从 `node:sqlite` / `better-sqlite3` 等驱动返回的行对象
  prototype 是 `null`，**直接**作为 prop 传给 `"use client"` 组件会被 Next 15+ 序列化拒绝
  （"Only plain objects ... Classes or null prototypes are not supported"）。PLAN 中遇到
  "SSR 取行 → 传 Client Component" 的链路，Affected Files 节要显式标注必须 `.map(r => ({ ...r }))`
  或在 helper 层统一包装（来源 RETRO-PR-003：STORY-002 投票页首次踩坑）。

## 流程

### 1. prime + pop-next

### 2. 探查代码现状（轻量）

- 用 `Glob` / `Grep` 找 STORY 里提到的功能 / 模块 / 数据模型在哪
- 列出现有相关文件，标注「将动 / 仅读 / 新建」
- 不做大规模重构；如果发现 PLAN 必须先重构才能做，回头开新 STORY（Non-Goal 此 STORY 的范围）

### 3. 起草 PLAN（基于本 skill 同目录 `template.md`）

#### Approach
- 选一条路 + 为什么；列出否决的备选 + 否决原因（≤2 句/条）

#### Affected Files
```
- src/api/vote.ts         — 新增 close-vote 端点
- src/db/schema.sql       — 加 closed_at 列
- web/src/Vote.tsx        — 提交按钮置灰逻辑
- tests/vote.spec.ts      — 新增关闭后投票场景
```

#### Steps
按可独立验证的小单位写：
```
1. DB 迁移：加 closed_at（migration up + down）
2. API：POST /vote/close 端点 + 权限校验
3. Web：投票按钮在 closed_at 非空时置灰 + tooltip
4. 测试：关闭/重开/二次提交场景
```

#### Risks
- 现有未关闭投票数据迁移（默认 NULL，向后兼容）
- 时区漂移（用 UTC 存）

#### Rollback
- DB：migration down 删列
- API：feature flag `vote_close_enabled` 关闭即恢复
- Web：commit revert 即可，无持久态影响

### 4. 对齐（tunan-align）

常见 Q：
- 切迁移：先迁移再发代码 / 同步发 / 灰度
- feature flag：用 / 不用
- 测试覆盖度：单测 + e2e / 仅单测

### 5. 落盘

`<STORY-dir>/<PLAN-id>-<STORY-slug>.md`，`source_id: STORY-NNN`，`status: ready`

<!-- MIRROR of tunan-prime §池结构；改前先改源 -->
> `<STORY-dir>` 即源 STORY 所在目录（通过 STORY id Glob 反查：`.tunan-workspace/sprints/SPT-*/reqs/**/<STORY-id>-*/`）。
> PLAN 文件 slug 沿用 STORY slug 保持目录内 prefix 一致；多 PLAN（如修订）走后缀 `-v2`。

## 反模式

- ❌ "在 src/ 下做修改" — 不具体，重写
- ❌ Steps 是一段文字 — 必须编号步骤
- ❌ Rollback 写"git revert" — 不够，要说具体哪个 commit/迁移/flag
- ❌ 把 TESTPLAN 内容写进来 — 那是下一站的事，PLAN 只列"会写哪些测试文件"

## 接下来做什么

```
✅ PLAN-NNN 已写入 <STORY-dir>/PLAN-NNN-<STORY-slug>.md，status=ready

推荐下一步：
  1. ★ /tunan-testplan PLAN-NNN  — 出测试计划
  2. （PLAN 文件停在 unstaged；等 /tunan-dev 入口时统一 commit+push 到 base，见 tunan-dev §2.5）
  3. /tunan-prime
```

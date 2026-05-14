---
name: tunan-verify
description: tunan 合并后验收。在 dev 分支上跑对应 TESTPLAN 全集 + 关联回归；通过则链路级联 done；失败则在 REQ 池新建回归 bug。tunan-merge 默认自动调用。触发：/tunan-verify、合并后自动衔接。
---

# tunan-verify — 合并后验收

> **何时触发**：`tunan-merge` 默认自动调；或 sponsor 手动 `/tunan-verify <PR-id>`。

## 调用语法

```
/tunan-verify <PR-id>
/tunan-verify <PR-id> --skip-regression     # 仅跑 TESTPLAN 三档不跑额外回归
```

## 前置

- PR 池条目 `status: merged`（`merged_at` 非空）
- 合并目标分支（默认 dev）已包含此 PR

## 流程

### 1. checkout 目标分支
```
git fetch origin
git checkout <base>      # 默认 dev
git pull --ff-only
```

如果 `--ff-only` 失败 → 报错并停（不要硬 reset）。

### 2. 运行 TESTPLAN 全集
- 调 `tunan-test --testplan=<TESTPLAN-id>`，但执行目录是仓库主分支而不是 worktree
- 三档（smoke/persona/regression）必须全过

### 3. 跨 PR 回归（默认开启）
- 找最近 N 个已 merged 的 PR（默认 5）的 TESTPLAN，把它们的 smoke 用例合并去重一起跑
- 目的：本次合并不破坏前几次合并的功能
- `--skip-regression` 关闭

### 4. 链路级联回写

**必须按顺序跑 4 个子步，每步打印"已写 N / 跳过 N"**：

#### 4.1 当前链路三级回写
- TESTPLAN-NNN → `done`（若已 done 则跳过）
- PLAN-NNN → `done`
- STORY-NNN → `done`
- 报告：`链路三级：TESTPLAN/PLAN/STORY 已写 X / 跳过 Y`

#### 4.2 解 blocked_by 引用清理
- Glob 所有 STORY，找 `blocked_by` 含本次 done 的 STORY-NNN：
  - 从该 list 移除本 id
  - 若移除后 `blocked_by` 为空 **且** 该 STORY status==`blocked` → 改为 `ready`
- 报告：`解 blocked：N 个 STORY 受影响，K 个由 blocked → ready`

#### 4.3 PRD 级联
- 取 STORY-NNN 的 source_id 找到所属 PRD
- 扫该 PRD 下所有 STORY frontmatter：若 **100%** done → PRD `status: done`；否则保持
- 报告：`PRD-MMM: <m>/<n> STORY done → status=<done|in_progress>`

#### 4.4 REQ 级联
- 取 PRD-MMM 的 source_id 找到所属 REQ
- 扫该 REQ 下所有 PRD：若 **100%** done → REQ `status: done`；否则保持
- 报告：`REQ-LLL: <m>/<n> PRD done → status=<done|in_progress>`

**Why**（来源 RETRO-009）：PR-005 / PR-006 连续两次 verify 漏级联到 PRD/REQ；
把 4 步显式枚举 + 每步报告，强迫执行者完整跑完不能跳。

### 5. 失败回流
任一档失败：
<!-- MIRROR of tunan-prime §池结构；改前先改源 -->
- 读 `.tunan-workspace/settings.md` 的 `current_sprint`；在 `.tunan-workspace/sprints/<current_sprint>/reqs/<REQ-NEW-id>-<slug>/<REQ-NEW-id>-<slug>.md` 新建 REQ 目录与文件（**写入当前 sprint**，可能与原 REQ 所在 sprint 不同）：
  - `kind: bug`
  - `source_id: REQ-原`（链回原需求）
  - `title: 回归 — <一句话失败现象>`
  - `priority: P1`
  - 正文 Goals/AC：失败用例对应的修复目标
- 保留 PR 池 `status: merged`（合并已发生，不回滚），新增 `verify_failed: true` 字段
- 播报：
  ```
  ⚠️ Verify 失败：<n> 个用例红
  已生成回归 REQ-NEW，可走 /tunan-req 流程修复
  ```

### 6. 成功输出
```
✅ Verify 通过 (TESTPLAN-NNN: 25/25)
链路级联：
  TESTPLAN-NNN done
  PLAN-NNN done
  STORY-NNN done
  PRD-MMM in_progress (3/5 STORY done)
  REQ-LLL in_progress
```

## 反模式

- ❌ 失败时回滚 merge → 已合并的代码用前向修复（新 PR），不回滚
- ❌ 跳过回归（除非 sponsor 显式 `--skip-regression`）
- ❌ 在 worktree 内跑 → 必须在主分支（dev）跑，验合并后实际状态
- ❌ 改 TESTPLAN 让其变绿 → 回归发现的失败必须 raise REQ

## 接下来做什么

通过：
```
✅ Verify 通过；链路级联完成。

推荐下一步：
  1. ★ /tunan-plan <next-STORY>      — 拉链上下一个 ready
  2. /tunan-prime                     — 看池整体进度
  3. /tunan-retro <REQ-id>            — 阶段性回顾（可选）
```

失败：
```
⚠️ Verify 失败；已生成 REQ-NEW-NNN（回归 bug）。

推荐下一步：
  1. ★ /tunan-req REQ-NEW-NNN        — 走 bug 修复流程
  2. /tunan-pr-resolve <PR-id>        — 如失败可前向修复在原 worktree 重起
  3. /tunan-retro <REQ-id>            — 复盘 TESTPLAN 为何漏掉这个回归
```

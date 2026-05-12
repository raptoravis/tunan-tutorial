---
name: tunan-parallel-pick
description: tunan 并行任务拣选器。从池中找出可同时进行而不互锁的多个条目（按 blocked_by 依赖图 + 影响文件冲突分析），让小团队 / 单人多 worktree 并行干活。触发：/tunan-parallel-pick、"哪几个 STORY 可以并行做"。
---

# tunan-parallel-pick — 并行拣选

> **何时用**：池里有多个 ready 条目想并发跑；多人协作分活；单人想开多个 worktree 并行。

## 调用语法

```
/tunan-parallel-pick                       # 默认 STORY 池，仅出建议（read-only）
/tunan-parallel-pick --pool=plan
/tunan-parallel-pick --max=3               # 最多挑几个
/tunan-parallel-pick --owner=any           # 不限 owner
/tunan-parallel-pick --queue [--max=N]     # 拣 + 顺序自动跑 pipeline（同批 red-gate）
/tunan-parallel-pick --queue --resume      # 续做被中断的 queue
```

## 流程

### 1. 拉候选
- 池中 status==ready、blocked_by==[]
<!-- MIRROR of tunan-prime §池结构；改前先改源 -->
- 默认 pool=story 时用 Glob `.tunan-workspace/sprints/SPT-*/reqs/REQ-*/PRD-*/STORY-*/STORY-*.md`；`--pool=plan` 用同 STORY 目录下的 `PLAN-*.md`，其他 pool 按 tunan-prime 的 6 类 Glob 映射。
- 默认按 owner 过滤；--owner=any 关闭

### 2. 分析互斥

两两条目互斥的判定（任一命中即互斥）：
- **依赖关系**：A.blocked_by 含 B 或反之
- **文件冲突**：A 关联的 PLAN 中 Affected Files 与 B 的有交集
- **共享资源**：两者动同一 schema / migration / 配置

### 3. 求最大独立集（贪心）
- 按优先级 + created 排序
- 依次加入：与已选集合无任何互斥即加入；否则跳过
- 限 `--max`

### 4. 输出建议组合 + 单 sponsor 多 worktree 提示

```
可并行 3 项（互不冲突）：

| id        | 影响文件               | 估算 |
| STORY-007 | src/api/vote.ts        | M    |
| STORY-009 | web/src/PollList.tsx   | S    |
| STORY-011 | docs/                  | S    |

互斥已排除：
  STORY-008 (与 007 共享 src/api/vote.ts)

推荐 worktree：
  /tunan-dev TESTPLAN-007
  /tunan-dev TESTPLAN-009
  /tunan-dev TESTPLAN-011

每个开独立终端 / 标签页跑闭环；
评论触发后用 /tunan-pr <id> 各自推进。
```

### 5. 不自动开 worktree（默认模式）

- 仅出建议；让 sponsor 决定是真的并行还是排队
- 防止误开过多 worktree 占盘
- sponsor 显式用 `--queue` 才转为 take-action 模式（下方第 6 节）

### 6. --queue 模式（顺序自动跑 + 同批 red-gate）

> ⚠ "queue" 不是 "parallel"。单会话 Claude 顺序执行，红/绿/PR 起步串行。
> 真正省下的是 sponsor 每个 STORY 都要手输 `/tunan-pipeline STORY-X` 的接入动作。

流程：

1. 走 1-3 步正常拣选 → 输出拣中 N 个 STORY（默认 max=3）
2. **集中确认**：列队列 + "确认 sponsor: 跑 queue / 调整 / 取消"，等显式 `queue go`
3. 顺序对每个 STORY 跑：plan → testplan → worktree + TDD red（**不停！收集红报告**）
   - 每个 STORY 完成 plan/testplan/worktree/red 后：frontmatter 写 `status=in_progress`、`queue_id=<同一批 id>`、`queue_phase=red_ready`
   - red 报告以"摘要 + counts"形式聚合，不全文输出（避免一次性吐 N 份长报告）
4. **批量 red-gate**：N 份红报告摘要一次性展示，sponsor 一行：
   - `red ok all` → 全部放行进产品代码
   - `red ok STORY-003,STORY-007` → 仅指定的放行；未列的保留 worktree + queue_phase=red_held（不删，便于事后手动决定）
   - `abort` → 全部撤回：删 worktree、frontmatter status 回退到 ready、清 queue_id/queue_phase
5. 对放行的 STORY：顺序写产品代码 → 全测试绿 → push + 起 PR
   - 每完成一项：frontmatter `queue_phase=pr_open`
6. **PR approve 不批**：每个 PR 仍各自等 sponsor LGTM/approve；沿用 tunan-pr 闭环
   - 队列在 "等 approve" 阶段并不阻塞；sponsor 可以一次性把 N 个 PR 全 approve，闭环会顺序衔接 merge + verify
7. 全部 merged + verify 后：清各 STORY frontmatter 的 `queue_id`/`queue_phase`，输出汇总

queue_phase 取值：`red_ready` / `red_held` / `green` / `pr_open` / `merged` / `verified` / `aborted`

### 7. --queue --resume 模式

`--resume` 适配中途中断（网络断、Claude 崩、sponsor 关窗）。

恢复逻辑（纯从已有 artifact 重建状态，无外置 state 文件）：

<!-- MIRROR of tunan-prime §池结构；改前先改源 -->
1. Glob `.tunan-workspace/sprints/SPT-*/reqs/REQ-*/PRD-*/STORY-*/STORY-*.md` 中所有 STORY frontmatter，找 `queue_id` 非空且 `queue_phase != verified/aborted` 的条目
2. 按 `queue_id` 分组（同批的归一起）；多个 queue_id 时 sponsor 选一个续做
3. 按 `queue_phase` 决定从哪步继续：
   - `red_ready` → 跳到第 4 步（批量 red-gate 等 sponsor 答复）
   - `red_held` → 跳过该 STORY，问 sponsor 要不要现在放行
   - `green` → 跳到第 5 步尾段（push + 起 PR）
   - `pr_open` → 跳到第 6 步（轮 PR 状态）
4. 报告恢复点 + 待办清单后续做

v1 限制：仅支持单 queue resume；多 queue 并存时 sponsor 自己选；resume 不重跑已 done 的阶段。

## 反模式

- ❌ 假并行（实际有共享文件冲突）
- ❌ 一次推 ≥ 5 个并行 — 单人精力有限；默认 ≤ 3
- ❌ 忽略 owner — 多人时必须按 owner 分组
- ❌ 把 PR approve 也同批 — approve 是 sponsor 对该 PR 的强人为判断，不能批；强行批破坏质量底线
- ❌ --queue 跑到一半 sponsor 没回 red-gate 就刷新会话 — 用 --resume，别从头来

## 接下来做什么

```
✅ 推荐 3 项并行：STORY-007 / STORY-009 / STORY-011

推荐下一步：
  1. ★ /tunan-dev TESTPLAN-007    — 开第一个 worktree
  2. /tunan-prime                   — 看池整体
  3. /tunan-takeover <id>           — 把某项改派给团队成员
```

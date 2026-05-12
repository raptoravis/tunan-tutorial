---
name: tunan-dev
description: tunan 工作流第六站（开发执行）：从 TESTPLAN 池弹出一个，创建 git worktree 隔离分支，按 TESTPLAN+PLAN 写代码，push 起 PR，落 PR 池条目。默认走 TDD（red-gate）。触发：/tunan-dev、"开发 TESTPLAN-xxx"、"开始实现 STORY-xxx"。
---

# tunan-dev — TESTPLAN → worktree → 代码 → PR

> **何时触发**：sponsor 说 `/tunan-dev`、`/tunan-dev <TESTPLAN-id>`、"开始写 STORY-007"。

## 调用语法

```
/tunan-dev                                # pop-next：弹 TESTPLAN 池下一个
/tunan-dev <TESTPLAN-id>
/tunan-dev <TESTPLAN-id> --no-tdd         # 关闭强制 TDD（不推荐；下方说明）
/tunan-dev <TESTPLAN-id> --resume         # 进入已存在的 worktree 续做
```

**开关**：
- `--no-tdd` — 绕开 `tunan-tdd` 的 red-gate（**默认强制 TDD**，见 memory feedback_tdd_red_gate）
- `--branch=<name>` — 自定义分支（默认 `tunan/dev/<STORY-id>-<owner>`）
- `--base=<branch>` — PR 目标分支（默认 `dev`，无 dev 分支则 `main`/`master`）

## 流程（**开始**播报：1) prime 2) 弹 TESTPLAN 3) 建 worktree 4) TDD 红 5) 写产品代码 6) 跑 TESTPLAN 7) push 起 PR 8) 入 PR 池）

### 1. prime + 依赖检查
- 调 `tunan-prime --id=<TESTPLAN-id>` 协议：确保对应 STORY/PLAN/TESTPLAN 都在链上
- 检查 PLAN/STORY frontmatter，所有 `blocked_by` 都已 done

### 2. pop-next（与 G-002 一致）
- TESTPLAN 池筛 ready+无 block+owner==me；选第一项
- 置 `status: in_progress`

### 2.5. 链路文件落盘到 base（worktree add 之前）

主仓库工作树里 tunan-plan / tunan-testplan 落盘的 `<STORY-dir>/PLAN-*.md` /
`TESTPLAN-*.md` 此时通常停在 staged/unstaged。worktree 从 `<base>` 切出**之前**
必须先把它们 commit + push 到 `<base>`，否则新 worktree 拿不到。

步骤（在主仓库根目录执行）：

```bash
# MIRROR of tunan-prime §池结构；改前先改源
git add <STORY-dir>/PLAN-*.md <STORY-dir>/TESTPLAN-*.md     # <STORY-dir> = .tunan-workspace/sprints/SPT-*/reqs/REQ-*/PRD-*/STORY-*/
git status --short      # 确认没夹带无关改动；夹带则停下问 sponsor
git commit -m "<STORY-id> 链路落盘：plan + testplan"
git push origin <base>
```

若 base 上已有同名文件（人为冲突 / 重做），停下询问 sponsor，不要静默覆盖。

**Why**（RETRO-006 + RETRO-010）：先前用「worktree 内 cp + commit」绕开（旧 §3.5），
导致 PLAN/TESTPLAN 的 commit 落在 PR 分支而非 base，`base..head` diff 里看起来像
PR 在改自己的设计文档。前置到 base 后，PR diff 只剩代码 + PR 池条目，评审噪音消失。

> 这是对全局 git-commit-push 纪律的**显式例外**：tunan-dev 入口本身就是 sponsor
> 显式触发的"开干"动作，等价于授权这一次 commit。不扩展到产品代码 / 其他场景。

### 3. 创建 worktree

<!-- MIRROR of tunan-prime §池结构；改前先改源 -->
```
git worktree add .tunan-workspace/worktrees/<STORY-id>-<owner> -b tunan/dev/<STORY-id>-<owner> <base>
```

- 路径派生自 STORY-id（不是 TESTPLAN-id），便于 prime / review / merge 关联
- 基线分支：`dev` 优先，不存在则 `main`/`master`
- 进入 worktree 后，PLAN/TESTPLAN 已随 §2.5 的 commit 在 base 历史中，worktree checkout 即可见

### 4. TDD 红灯（缺省强制）

调 `tunan-tdd <TESTPLAN-id>`，行为：
- 在 worktree 内**先写测试**（按 TESTPLAN persona/smoke/regression 全集）
- 跑测试 → 必须**全红**（或编译失败可视为 red）
- 写**红状态报告**：失败列表 + 计数
- **sponsor 显式放行**才进入第 5 步（见 tunan-tdd skill 的 red-gate 协议）

`--no-tdd` 时跳过本步，**但必须在 PR 描述里明确标注 `non-tdd` 原因**，retro 时优先复盘。

### 5. 写产品代码

按 PLAN 的 Steps 顺序，**最小**改动让红测试逐项变绿：
- 一次只写让一个测试变绿的最少代码
- 不顺手写"看起来需要"的额外功能 — 不在 TESTPLAN 里就不写
- 不改无关文件、不改格式、不"清理"

### 6. 跑全 TESTPLAN

调 `tunan-test <TESTPLAN-id>`：
- 必须 smoke + persona + regression 全绿
- 任何 flaky 视为失败（与 testplan 决议一致）
- **避开 pnpm run 前置校验**：pnpm 11+ 在 run 脚本前会做 IGNORED_BUILDS / deps validation
  可能吞掉 `pnpm dev` / `pnpm test` 等命令。dev / test 阶段直接 `./node_modules/.bin/<tool>`
  调用更稳；package.json 中的 scripts 仅供人手跑。（来源 RETRO-002）

### 7. push + 起 PR

```
git push -u origin tunan/dev/<STORY-id>-<owner>
gh pr create --base <base> --head <branch> \
  --title "<STORY-id>: <story title>" \
  --body "$(填充 .claude/skills/tunan-pr/template.md)"
```

PR body 必填：
- Summary（一句话 why）
- Changes（按文件/模块）
- Test Evidence（TESTPLAN-id + 通过摘要）
- Reviewer Checklist（来自 .claude/skills/tunan-pr/template.md）
- Sponsor Checklist
- 链接 STORY-id / PLAN-id / TESTPLAN-id

### 8. 落 PR 池

`<STORY-dir>/<PR-id>-<STORY-slug>.md`（与同 STORY 的 PLAN/TESTPLAN 同居；多 PR 走后缀 -v2/-v3）：
- 在 worktree 内落盘并 commit + push（与第 3.5 步同分支）；评审者从 PR diff 可见
- frontmatter 含 `gh_pr: <number>`、`worktree: <path>`、`branch: <name>`
- `source_id: TESTPLAN-id`
- `status: reviewing`

**PR id 分配（防并行 worktree 撞库）**：从**主仓库 + 所有活跃 worktree** 的
所有 `PR-*.md`（嵌套结构下用递归查找）联合取最大 id + 1，不能只看主仓库当前 pool：

<!-- MIRROR of tunan-prime §池结构；改前先改源 -->
```bash
git worktree list --porcelain | awk '/^worktree /{print $2}' | \
  while read wt; do find "$wt/.tunan-workspace/sprints" -type f -path '*/reqs/REQ-*/PRD-*/STORY-*/PR-*.md' 2>/dev/null; done | \
  sed -E 's|.*/PR-0*([0-9]+)-.*|\1|' | sort -n | tail -1
```

> **Why**：worktree 内 PR 池条目尚未合并回主仓库时，仅看主仓库 pool 会重复递号
> （来源 RETRO-PR-003：STORY-002 与 STORY-006 并行各分到 PR-002，merge 后才暴露撞库）。
> 撞库发生时的补救：手动 `git mv PR-002-... PR-N-...` 并替换文件内所有 `PR-002` 出现。

### 9. 状态机回写
- TESTPLAN 池条目 status → done（PR 起好即视为 testplan 阶段完成）
- 不动 STORY/PLAN/REQ/PRD（等 verify 链回写）

## 反模式

- ❌ 直接在主分支写 — 必须 worktree 隔离
- ❌ 边写产品代码边写测试 — TDD 模式下违反 red-gate
- ❌ "顺手"修无关文件 — 单 PR 只做这个 STORY
- ❌ commit message 写"WIP" — 用 `tunan-cp` 起像样的 message
- ❌ 跳 TESTPLAN 直接 push — PR 必须带 Test Evidence

## 失败处理

- worktree 已存在 → 询问是 `--resume` 还是删除重建（不静默覆盖）
- TDD red-gate 卡住超过 30 分钟 → 自动建议 `/tunan-prime`、必要时 `/tunan-takeover`
- PR 起不来（gh 报错）→ 不删 worktree，给出排错建议（auth / 远程分支冲突）

## 接下来做什么

<!-- MIRROR of tunan-prime §池结构；改前先改源 -->
```
✅ PR-NNN 已起：gh#<num>，worktree=.tunan-workspace/worktrees/<STORY-id>-<owner>

推荐下一步：
  1. ★ /tunan-pr PR-NNN          — 启动自驱动 reviewer/tester 闭环
  2. /tunan-pr PR-NNN --watch     — 持续轮询评论（本地循环）
  3. /tunan-prime                  — 看池/PR 现状
```

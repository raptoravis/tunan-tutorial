---
name: tunan-prime
description: tunan 现状回拉武器（关键防漂移）。在长会话、多人切换、跨阶段切换、不确定上下文时调用，输出当前真实状态。纯只读。触发：/tunan-prime、"看下现在状态"、"我现在到哪一步了"、"先 prime 一下"。
---

# tunan-prime — 现状回拉

> **何时触发**：sponsor 说 `/tunan-prime`、"现在做到哪了"、"先看看池里有什么"、"prime 一下"；或当其他 tunan-* skill 检测到上下文不一致时**主动**建议先跑这个。

> **重要原则：纯只读**。永远不修改任何 frontmatter / 文件 / 分支。看到错乱状态只**报告**，不"顺手修"。

## 调用语法

```
/tunan-prime [开关]
```

**开关**：
- `--all-owners` — 不只看当前 git user 的；列全池
- `--retro=N` — 列最近 N 条 retro（默认 3）
- `--verbose` — 把每条目的 `blocked_by` / `source_id` / `priority` 全展开
- `--id=<X>` — 仅围绕某个 id（沿 source_id 链向上向下追溯）

## 流程

### 1. 探测 workspace

- 找 `.tunan-workspace/`（项目根 → 父目录两层内）
- 没找到 → 报错并提示 `bash install-windows.ps1` 或手动建池目录；不脑补不创建

### 池结构（嵌套，REQ→PRD→STORY，自 2026-05-11 重构）

```
.tunan-workspace/
  <REQ-id>-<slug>/                                   # REQ 顶层目录
    <REQ-id>-<slug>.md                               # REQ 本体
    <PRD-id>-<slug>/                                 # 该 REQ 下每个 PRD 一个目录
      <PRD-id>-<slug>.md
      <STORY-id>-<slug>/                             # 该 PRD 下每个 STORY 一个目录
        <STORY-id>-<slug>.md
        <PLAN-id>-<STORY-slug>.md                    # 文件名 slug 沿用 STORY slug
        <TESTPLAN-id>-<STORY-slug>.md
        <PR-id>-<STORY-slug>.md                      # 多 PR：PR-NNN-<STORY-slug>-v2.md
  retro/                                             # 扁平不变
    <YYYY-MM-DD>-<slug>.md
  worktrees/                                         # 扁平不变（gitignored）
    <STORY-id>-<owner>/
```

Glob 模式（其他 skill 引用本节）：
- 所有 REQ：`.tunan-workspace/REQ-*/REQ-*.md`（top-level）
- 所有 PRD：`.tunan-workspace/REQ-*/PRD-*/PRD-*.md`
- 所有 STORY：`.tunan-workspace/REQ-*/PRD-*/STORY-*/STORY-*.md`
- 所有 PLAN：`.tunan-workspace/REQ-*/PRD-*/STORY-*/PLAN-*.md`
- 所有 TESTPLAN：`.tunan-workspace/REQ-*/PRD-*/STORY-*/TESTPLAN-*.md`
- 所有 PR：`.tunan-workspace/REQ-*/PRD-*/STORY-*/PR-*.md`

### 2. 读 6 池

对上述 6 类 Glob 模式分别遍历：
- 列出匹配的 `*.md` 文件，读 frontmatter
- 默认仅展示 `owner == 当前 git user`（除非 `--all-owners`）
- 按 status 分组：`ready / in_progress / blocked / failed / done`（done 默认折叠为计数）

### 2.5 结构 lint（轻量自检，纯只读）

每次 prime 时跑下列一致性检查；不一致**只报告**，不修：

- 每个 `REQ-NNN-*/` 目录下必有同 id 同 slug 的 `REQ-NNN-*.md`
- 每个 `<REQ-dir>/PRD-NNN-*/` 必有同 id 的 `PRD-NNN-*.md`
- 每个 `<PRD-dir>/STORY-NNN-*/` 必有同 id 的 `STORY-NNN-*.md`
- 每个 STORY 的 frontmatter `blocked_by` 列表里的 id 都能在池里 Glob 找到

输出形如：

```
⚠ 结构 lint：
  - REQ-007-foo/ 下未找到 REQ-007-foo.md（疑似目录创了但 REQ 未起草）
  - STORY-009 blocked_by=[STORY-XXX] 指向不存在的 id
```

无问题时静默。（来源 RETRO-004）

### 3. 读 worktree 区

- `git worktree list --porcelain`
- 把 worktree 路径与 `.tunan-workspace/worktrees/<id>-<owner>` 对照，列出：路径 / 分支 / 对应池条目 id（从路径名抽 id）/ 是否有未提交改动（`git -C <path> status --porcelain` 简短摘要）
- **健康度核对**：对每个 worktree 跑 `git -C <wt> log <base>..HEAD --oneline`：
  - 如果有领先 commit **且**对应 STORY 池状态 ≠ `in_progress` / `done` → 标 `⚠ 池/worktree 不一致：worktree 已有 N commits 但 STORY-NNN 状态=ready`
  - 如果有领先 commit **且**对应 PR 池无条目 → 标 `⚠ worktree 已写代码但未起 PR`
  - 仅报告，不修改任何文件
- **Why**（来源 RETRO-006）：另一会话/人在 worktree 已开工但未回写池状态时，prime 会假报"无活跃 worktree"，下游 skill（parallel-pick / dev）会带着错误前提工作

### 4. 读 PR 池详情

对所有 PR md 条目（按 Glob 模式 `.tunan-workspace/REQ-*/PRD-*/STORY-*/PR-*.md`）：
- 读 frontmatter `gh_pr` 字段
- 用 `gh pr view <num> --json state,reviewDecision,comments,updatedAt` 拉 PR 真实状态
- 标出 sponsor 是否已 approve / 是否有未消费评论
- 把 PR 池条目 status 与 GitHub 真实状态做**一致性核对**：不一致只报告（"池中 status=sponsor_wait，但 GitHub 已 MERGED；建议跑 /tunan-merge 或 /tunan-verify 同步"），不动文件

### 5. 读最近 retro

- `.tunan-workspace/retro/` 按文件 mtime 倒序取前 N
- 列：日期 / 标题 / 一句话产出（读首行或 `summary:` frontmatter）

### 5.5 多 session 变化探测

多 session / 多 agent 协作时，另一方可能在你不知情时改了池或代码。本节主动检测：

- `git log --oneline -10` — 列最近 10 commit；如果有比"你上次 prime 时记得的 HEAD"更新的，标 `⚠ 自上次 prime 后有 N 个新 commit`
- `find .tunan-workspace/REQ-*/ -name '*.md' -newer ~/.claude/.tunan-last-prime-mark 2>/dev/null`（mark 文件由本步在结束时 `touch` 更新）— 列出新改的池条目
- 输出形如：
  ```
  ⚠ 自上次 prime 后变化：
    - 3 个新 commit（c1c0fab, 5cbe034, f45ac50）
    - 4 个池条目更新（STORY-005, PR-006, PLAN-005, TESTPLAN-005）
    可能其他 session 介入；prime 仍按当前状态报告
  ```
- 若 mark 文件不存在（首次 prime）→ 静默只 `touch`
- **Why**（来源 RETRO-009）：本周内 prime 多次错过其他 session 的动作（STORY-005 凭空 done、pipeline.md 凭空多 --pre-auth），靠 system reminder 揭示

### 6. 输出

**两段格式：先中文摘要 ≤ 10 行，再结构化清单。**

#### 摘要段（示例）

```
你（jonli）当前手头：
  • 1 个 STORY 在做（STORY-007 投票历史，in_progress）
  • 1 个 PR 等评审（PR-005 reviewing，2 条 reviewer 评论未处理）
  • 1 个 worktree 活跃：worktrees/STORY-007-jonli（有未提交改动）
REQ/PRD 池有 3 项 ready 等你拉新工作。
最近 retro：2026-05-08 修了"投票后无结果计数"的回归。
⚠️ 一致性：PR-003 池中 status=sponsor_wait，GitHub 已 MERGED — 建议 /tunan-merge PR-003 同步。
```

#### 清单段

```
== REQ 池 ==                    (owner=jonli)
  ready:        REQ-008 a11y 焦点陷阱修复  P1
  in_progress:  —
  blocked:      REQ-009 (blocked_by REQ-008)
  failed:       —

== PRD 池 ==
  ...

== 活跃 worktree ==
  worktrees/STORY-007-jonli  branch: tunan/dev/STORY-007-jonli  diff: 3 files
  ...

== PR 池 ==
  PR-005  reviewing      gh#42  comments: 2 unread
  PR-003  sponsor_wait   gh#40  ⚠ GitHub: MERGED
  ...

== 最近 retro (3) ==
  2026-05-08  vote-result-count-regression
  2026-05-02  worktree-cleanup-flake
  2026-04-28  initial-bootstrap
```

## 接下来做什么

根据现状自动推荐 ≤3 项（top3 + ★ 默认）。例：

```
推荐下一步：
  1. ★ /tunan-merge PR-003       — 池/GitHub 不一致，先同步
  2. /tunan-pr PR-005             — 处理 2 条未读评审评论
  3. /tunan-story                 — 拉 ready 池中的下一个 STORY
  自由：你也可以先去 prd 池看看
```

> 池为空时输出："REQ 池没东西，要 `/tunan-req` 起一个新需求吗？"

## 失败处理

- workspace 缺失 → 不创建，提示用户跑 install
- `gh` 未登录 / 网络断 → PR 段降级为只读 frontmatter，明确标"⚠ 未能从 GitHub 同步"
- 某文件 frontmatter 损坏 → 列出并跳过该条目，不阻塞其他

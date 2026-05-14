---
name: tunan-merge
description: tunan PR 合并到 dev（或 main）+ worktree/分支清理 + 自动衔接 verify。前置：sponsor 已 approve 且 PR 处于 sponsor_wait。触发：/tunan-merge、tunan-pr 检测到 approve 后自动调用。
---

# tunan-merge — 合并 + 清理

> **何时触发**：sponsor 说 `/tunan-merge <PR-id>`；或 `tunan-pr` 检测到 sponsor approve 后自动调本 skill。

## 调用语法

```
/tunan-merge <PR-id>
/tunan-merge <PR-id> --strategy=<merge|squash|rebase>     # 默认 merge
/tunan-merge <PR-id> --no-verify                          # 合后不自动调 verify（不推荐）
```

## 前置（硬性）

- PR 池条目 `status: sponsor_wait`
- `last_review: pass` 且 `last_test: pass`
- GitHub PR `reviewDecision == APPROVED` 或评论中检出 sponsor approve 关键字
- **任一不满足 → 拒绝合并**，给 sponsor 报告缺什么

## 流程

### 1. 二次确认（除非自动调用）

直接调用时（sponsor 显式跑 `/tunan-merge`）：
```
即将合并 PR-NNN: <title>
  base ← head:  dev ← tunan/dev/STORY-007-jonli
  策略:         merge
  上游链路:     STORY-007 → PLAN-007 → TESTPLAN-007
  最近 review:  pass | test: pass | sponsor: APPROVED
继续？(默认 ★ 是 / 否)
```

`tunan-pr` 内调（已 sponsor approve）→ 跳过本步直接合。

### 2. 合并

```
gh pr merge <num> --merge --delete-branch
```

`--delete-branch` 让 GitHub 自动删远程分支。

策略：
- `merge` ★默认（保留 PR commit 历史）
- `squash`（PR 多 commit 想压一个）
- `rebase`（线性历史强迫症 / 上游约定）

### 2.5. Pull 前主仓 PLAN/TESTPLAN 副本核对

<!-- MIRROR of tunan-prime §池结构；改前先改源 -->
tunan-plan / tunan-testplan 把 PLAN/TESTPLAN 文件写在**主仓库** `.tunan-workspace/sprints/SPT-*/reqs/<REQ-dir>/<PRD-dir>/<STORY-dir>/` 下供
tunan-prime 索引；tunan-dev 又把它们复制进 worktree 并随 PR 提交。当 PR 合回 master 后，主仓库内：

- 当时 plan/testplan 落盘的 `PLAN-NNN-*.md` / `TESTPLAN-NNN-*.md` 仍是 **untracked** 副本
- STORY frontmatter 可能被 dev 阶段改成 `in_progress` 仍 **modified**

此时 `git pull --ff-only` 会 abort（"untracked files would be overwritten" / "would be overwritten by merge"）。

协议（在 `git pull` 前对该 STORY 目录跑）：

1. 对每个 untracked PLAN/TESTPLAN 副本，与 PR 分支同路径文件 `git diff` 比对：
   - 内容一致 → `rm` 主仓本地副本，让 pull 把 PR 版本带回来
   - 内容不同 → **停下报告 sponsor**：a) 留 PR 版本（删本地） b) 用本地版本另起新 PR
2. 对 modified 的 STORY 文件：若改动只是 status 流转（ready↔in_progress） → `git checkout -- <file>` 丢弃，pull 后 PR 版本接管；若有内容差异 → 同上由 sponsor 决议

完成本步后再执行下方 §3 本地清理 / §5 verify。

（来源 RETRO-007）

### 3. 本地清理

<!-- MIRROR of tunan-prime §池结构；改前先改源 -->
```
git -C .tunan-workspace/worktrees/<STORY-id>-<owner> status   # 检查无未提交改动
git worktree remove .tunan-workspace/worktrees/<STORY-id>-<owner>
git branch -D tunan/dev/<STORY-id>-<owner>                   # 远程已被 GitHub 删
```

如果有未提交改动 → **不删**，报告并退出，让 sponsor 处理。

**Windows 长路径 fallback**：若 `git worktree remove` 报 "Filename too long"（260 字符限制，
常因 node_modules 深路径触发）。按顺序尝试：

1. `rm -rf <worktree>/node_modules`（释放绝大多数长路径，最便宜）
2. 重试 `git worktree remove <worktree>`
3. 仍失败 → `git worktree prune` + `node -e "fs.rmSync('<worktree-abs-path>', {recursive: true, force: true, maxRetries: 3})"`
4. 还残留 → 报告路径给 sponsor，tunan-prime 后续把它标为孤儿目录；**不要**用 `git worktree remove --force` 强删（git 元数据消失但磁盘目录残留更糟）

`fs.rm` 在 Node ≥ 16 支持长路径 + 重试；`prune` 确保 git 不再追踪已删元数据。
（来源 RETRO-002 + RETRO-007）

### 4. PR 池状态机回写

frontmatter：
- `status: merged`
- `merged_at: <timestamp>`
- `merged_sha: <sha>`
- `merge_strategy: merge|squash|rebase`

### 5. 自动衔接 verify（默认）

```
/tunan-verify <PR-id>
```

`--no-verify` 时跳过；但要播报"未自动 verify，建议 `/tunan-verify <PR-id>` 手动跑"。

## 失败处理

- GitHub 拒绝合并（base 改了 / 缺 review approval）→ PR 池保持 sponsor_wait，提示"`/tunan-pr <PR-id>` 重检 / `/tunan-pr-resolve <PR-id>` 处理冲突"
- worktree 删除失败（有未提交改动）→ **不强删**，报告内容让 sponsor 决定
- `gh` 网络错 → 等待 sponsor 重试，不重复尝试合并（防双合并）

## 反模式

- ❌ 跳过前置二次合并未 approved 的 PR
- ❌ `git push --force` 主动覆盖 base
- ❌ 删 worktree 时 `--force` 丢未提交改动
- ❌ 合到 main 而非 dev（默认 base 应是 dev；PR body 显式说明才允许）

## 接下来做什么

```
✅ PR-NNN 已合并到 dev，sha=<short>，分支与 worktree 已清理。

推荐下一步：
  1. ★ /tunan-verify <PR-id>      — 跑 TESTPLAN 全集 + 链路回写（默认已自动调）
  2. /tunan-prime                  — 看池现状（看哪些上游已联动 done）
  3. /tunan-plan <next-STORY>      — 拉下一个 ready
```

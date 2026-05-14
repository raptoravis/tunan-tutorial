---
name: tunan-pr-resolve
description: tunan PR 失败修复模式。处理合并冲突 / CI 红 / 评论挤压不收敛 / failed 状态。把 PR 拉回 reviewing 让闭环继续。触发：/tunan-pr-resolve、"PR-xxx 卡住了"、"PR 失败修一下"。
---

# tunan-pr-resolve — PR 失败修复

> **何时用**：PR 池条目 `status: failed`；或闭环跑了 N 轮仍不收敛；或合并冲突；或 GitHub Actions 红。

## 调用语法

```
/tunan-pr-resolve <PR-id>
/tunan-pr-resolve <PR-id> --rebase     # 显式 rebase 到 base
/tunan-pr-resolve <PR-id> --abandon    # 放弃此 PR：删 worktree+分支，PR 池 status=failed 永久
```

## 触发场景与处理

### A. 合并冲突（rebase / merge from base 后冲突）

1. 进入 worktree：`cd <worktree>`
2. `git fetch origin && git rebase origin/<base>` 或 `git merge origin/<base>`（默认 rebase）
3. 冲突文件：列出 + 调 `tunan-align`：
   - Q：保留谁（★保留 PR 这侧 / 保留 base 这侧 / 手动合并）
   - 自由文本允许 sponsor 写"对 X 文件保留 base，对 Y 保留 PR"
4. 解决后 `git add` + `git rebase --continue`
5. **必须重跑** `tunan-test`：rebase 改动可能引入新冲突逻辑
6. push（rebase 后需要 `git push --force-with-lease`，**这是合法的 force**，因为是 PR 分支自有；脚本里要明确写）

### B. CI 红（GitHub Actions 失败）

1. `gh pr checks <num>` 拉失败的 check
2. `gh run view <run-id> --log-failed` 拉失败日志（USER.md：摘要不粘原文）
3. 分类：
   - 测试失败 → 与 `tunan-test` 一致路径处理（写 PR 评论 + 等修）
   - 构建失败 → diff 中找最可能的 commit / 文件 → 修
   - lint/format 失败 → 自动修（`npm run lint --fix` / `pre-commit run`），单独一个 commit
4. 推

### C. 评论挤压不收敛（review 反复 changes_requested）

1. 调 `tunan-prime --id=<PR-id>`：看是否上游 STORY/PLAN 本身有问题
2. 如果是 PLAN/STORY 错 → 标 PR `status: failed`，建议 `/tunan-retro <PR-id>` 复盘是否回到 `tunan-plan` 重做
3. 如果是 coder 误解评论 → 把所有未消费评论汇总，sponsor 标注哪些是必修哪些是 NIT，再跑 `tunan-pr`

### D. 手动 abandon

`--abandon` 时：
1. `git worktree remove <path> --force`
2. `git branch -D <branch>`
3. `gh pr close <num>`
4. PR 池条目 `status: failed`，写 `abandon_reason` frontmatter
5. 上游 STORY 状态保持 in_progress（不污染），sponsor 决定是 retake 还是改 STORY

## 危险操作的边界

- `git push --force-with-lease`：仅对 PR 分支，禁止对 main/dev/master
- `git reset --hard`：仅在 sponsor 显式同意 abandon 时；其他场景必须用 stash / 单独 commit
- 不删 base 分支；不动其他 worktree

## 反模式

- ❌ 卡住直接 `--abandon` → 先看是 PLAN 错还是代码错
- ❌ rebase 冲突时复制 base 版本 + 删 PR 改动 → 等于 abandon，不诚实
- ❌ 静默 force push（不 with-lease）→ 可能覆盖他人推送

## 接下来做什么

```
✅ PR-NNN 已脱离 failed，status=<reviewing|abandoned>

推荐下一步：
  1. ★ /tunan-pr <PR-id>          — 让闭环继续
  2. /tunan-retro <PR-id>          — 如果失败原因值得复盘
  3. /tunan-plan <STORY-id>        — 如 PLAN 本身错了，回头重做
```
